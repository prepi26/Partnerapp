import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import type { Drawing } from '@/data/types';

import { supabase } from './supabase';
import { updateWidgetDrawing } from './widget';

/**
 * Kommt eine Zeichnung, weckt die Mitteilung die App kurz im Hintergrund (content-available).
 * Dann holen wir die neueste Zeichnung und legen sie fürs Widget ab – ohne dass jemand die App öffnet.
 * iOS entscheidet selbst, wie oft das klappt; spätestens beim nächsten Öffnen der App ist das Widget aktuell.
 */
export const DRAWING_TASK = 'wirzwei-drawing-update';

function urlOf(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (typeof data.url === 'string') return data.url;
  const raw = data.dataString ?? data.body;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { url?: unknown };
      return typeof parsed.url === 'string' ? parsed.url : null;
    } catch {
      return null;
    }
  }
  return null;
}

async function refreshDrawingWidget() {
  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return false;
  const { data } = await supabase
    .from('drawings')
    .select('*')
    .neq('from_id', me)
    .order('created_at', { ascending: false })
    .limit(1);
  const drawing = (data?.[0] as Drawing | undefined) ?? null;
  if (!drawing) return false;
  const { data: couples } = await supabase.from('couples').select('*').limit(1);
  const couple = couples?.[0] as { partner_a: string; name_a: string; name_b: string } | undefined;
  const fromName = couple ? (couple.partner_a === drawing.from_id ? couple.name_a : couple.name_b) : '';
  updateWidgetDrawing(drawing, fromName);
  return true;
}

if (Platform.OS === 'ios') {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(DRAWING_TASK, async ({ data }) => {
    try {
      const payload = data as { data?: Record<string, unknown> };
      if (urlOf(payload?.data) !== '/draw') return Notifications.BackgroundNotificationTaskResult.NoData;
      return (await refreshDrawingWidget())
        ? Notifications.BackgroundNotificationTaskResult.NewData
        : Notifications.BackgroundNotificationTaskResult.NoData;
    } catch {
      return Notifications.BackgroundNotificationTaskResult.Failed;
    }
  });
  Notifications.registerTaskAsync(DRAWING_TASK).catch(() => {});
}
