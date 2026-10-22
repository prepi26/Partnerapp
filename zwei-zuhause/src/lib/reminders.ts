import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Family, ParentKey, ScheduleChange } from '@/data/types';
import { currentT, fmt } from '@/i18n';

import { addDays, today } from './dates';
import { acceptedChanges, handoversAhead, handoverWhere } from './schedule';

/**
 * Lokale Erinnerung am Vorabend jeder Übergabe (19 Uhr) – plant das Handy selbst, ohne Server.
 * Geplant werden die nächsten Wechsel; bei jeder Änderung von Plan oder Tausch neu.
 */

const PREFIX = 'zz-handover-';
const SETTINGS_KEY = 'zweizuhause.handoverReminder';
const MAX_AHEAD = 6;
const HOUR = 19;

export async function loadHandoverReminder(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SETTINGS_KEY)) !== 'off';
  } catch {
    return true;
  }
}

const listeners = new Set<() => void>();

/** Benachrichtigt, wenn Erinnerungen ein- oder ausgeschaltet werden (dann für alle Familien neu planen). */
export function onHandoverReminderChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function saveHandoverReminder(on: boolean) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, on ? 'on' : 'off');
  } catch {
    // Dann gilt beim nächsten Start wieder „an“.
  }
  for (const listener of listeners) listener();
}

export async function cancelHandoverReminders() {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Nichts geplant oder keine Berechtigung – egal.
  }
}

export interface ReminderInput {
  family: Family;
  changes: ScheduleChange[];
  me: ParentKey;
  nameOf: (k: ParentKey) => string;
}

/** Plant die Erinnerungen für alle Familien neu (oder entfernt sie, wenn ausgeschaltet bzw. keine Erlaubnis). */
export async function refreshHandoverReminders(inputs: ReminderInput[]) {
  if (Platform.OS === 'web') return;
  await cancelHandoverReminders();
  if (!(await loadHandoverReminder())) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
  } catch {
    return;
  }

  const t = currentT();
  const now = new Date();
  for (const { family, changes, me, nameOf } of inputs) {
    const kids = family.children.trim() || t.common.theChild;
    const where = handoverWhere(family, t);
    const upcoming = handoversAhead(family, acceptedChanges(changes), today()).slice(0, MAX_AHEAD);

    for (const h of upcoming) {
      const eve = addDays(h.day, -1);
      const when = new Date(eve.getFullYear(), eve.getMonth(), eve.getDate(), HOUR, 0);
      if (when <= now) continue;
      const to = h.to === me ? t.lib.reminder.toYou : fmt(t.lib.reminder.toOther, { name: nameOf(h.to) });
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX}${family.id}-${h.day.getTime()}`,
          content: {
            title: t.lib.reminder.title,
            body: fmt(t.lib.reminder.body, { kids, to, where: where ? ` · ${where}` : '' }),
            data: { url: '/calendar', family: family.id },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
      } catch {
        // Einzelne Erinnerung fehlgeschlagen – die anderen trotzdem planen.
      }
    }
  }
}
