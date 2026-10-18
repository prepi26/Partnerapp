import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { questionForDay } from '@/data/questions';

import { toISO } from './dates';

/**
 * Lokale Erinnerungen, die das Handy selbst plant (kein Server nötig):
 * - 19:00 Frage des Tages – entfällt heute, wenn schon geantwortet
 * - 21:00 „Eure Serie reißt ab“ – nur heute, nur bei offener Antwort und Serie ab 2 Tagen
 * - 12:30 kleine Liebes-Impulse („Wann hast du … zuletzt umarmt?“)
 * Geplant wird immer für die nächsten 7 Tage und bei jedem App-Start neu.
 */

const PREFIX = 'wz-reminder-';
const SETTINGS_KEY = 'wirzwei.reminders';
const DAYS_AHEAD = 7;

export interface ReminderSettings {
  question: boolean;
  nudges: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = { question: true, nudges: true };

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_REMINDERS, ...JSON.parse(raw) } : DEFAULT_REMINDERS;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

export async function saveReminderSettings(settings: ReminderSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Dann gelten beim nächsten Start wieder die Standardwerte.
  }
  await refreshReminders();
}

function nudges(name: string) {
  return [
    `Wann hast du ${name} zuletzt einfach so umarmt? 🤗`,
    `Schon gesagt, dass du ${name} liebst? Heute ist ein guter Tag dafür 💬`,
    'Ein Kuss mehr schadet nie 💋',
    `Schick ${name} ein Herz – dauert eine Sekunde 💗`,
    `Was magst du gerade besonders an ${name}? Schreib es auf einen Zettel ✉️`,
    'Wann wart ihr zuletzt zusammen aus? Vielleicht ist heute Date-Abend 🍷',
    `Mach ${name} heute ein Kompliment 🌸`,
    'Wann habt ihr zuletzt so richtig zusammen gelacht? 😄',
    'Haltet einen schönen Moment von heute als Erinnerung fest 📸',
    `Frag ${name} heute, wie es wirklich geht 💛`,
    `Wann hast du ${name} zuletzt überrascht? 🎁`,
    'Handy weg, 10 Minuten nur ihr zwei – wie wär’s heute Abend? 🕯️',
  ];
}

interface ReminderState {
  partnerName: string;
  answeredToday: boolean;
  streak: number;
}

let lastState: ReminderState | null = null;

function at(base: Date, dayOffset: number, hours: number, minutes: number) {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hours, minutes);
}

export async function cancelReminders() {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // Nichts geplant oder keine Berechtigung.
  }
}

/** Plant alle Erinnerungen neu. Wird bei App-Start, Antwort und geänderten Einstellungen aufgerufen. */
export async function scheduleReminders(state: ReminderState) {
  lastState = state;
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    await cancelReminders();
    if (status !== 'granted') return;

    const settings = await loadReminderSettings();
    const now = new Date();
    const plans: { id: string; date: Date; title: string; body: string; url: string }[] = [];

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const question = at(now, i, 19, 0);
      if (settings.question && question > now && !(i === 0 && state.answeredToday)) {
        plans.push({
          id: `${PREFIX}question-${i}`,
          date: question,
          title: '💬 Frage des Tages',
          body: questionForDay(toISO(question)),
          url: '/question',
        });
      }
      const nudge = at(now, i, 12, 30);
      if (settings.nudges && nudge > now) {
        const list = nudges(state.partnerName || 'deinem Schatz');
        // Pro Kalendertag ein fester Impuls – so wiederholt sich nichts in einer Woche.
        const dayNumber = Math.floor(nudge.getTime() / 86_400_000);
        plans.push({
          id: `${PREFIX}nudge-${i}`,
          date: nudge,
          title: '💗 Wir zwei',
          body: list[dayNumber % list.length],
          url: '/',
        });
      }
    }

    const warning = at(now, 0, 21, 0);
    if (settings.question && state.streak >= 2 && !state.answeredToday && warning > now) {
      plans.push({
        id: `${PREFIX}streak`,
        date: warning,
        title: `🔥 ${state.streak} Tage in Folge`,
        body: 'Beantwortet heute noch die Frage des Tages, sonst reißt eure Serie ab.',
        url: '/question',
      });
    }

    await Promise.all(
      plans.map((p) =>
        Notifications.scheduleNotificationAsync({
          identifier: p.id,
          content: { title: p.title, body: p.body, data: { url: p.url } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date },
        }),
      ),
    );
  } catch {
    // Erinnerungen sind ein Extra – die App funktioniert auch ohne.
  }
}

/** Mit dem zuletzt bekannten Stand neu planen (z. B. nach erteilter Berechtigung). */
export async function refreshReminders() {
  if (lastState) await scheduleReminders(lastState);
}
