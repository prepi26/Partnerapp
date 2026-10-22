import { useEffect, useState } from 'react';

import { useStore } from '@/data/store';
import { Family, ParentKey, ScheduleChange } from '@/data/types';
import { registerForPush } from '@/lib/push';
import { onHandoverReminderChange, refreshHandoverReminders } from '@/lib/reminders';
import { supabase } from '@/lib/supabase';

/**
 * Plant die Erinnerungen am Vorabend jeder Übergabe – für alle eigenen Familien (Kinder mit verschiedenen Eltern).
 * Neu, sobald sich Plan oder Tausch ändern.
 */
export function HandoverReminders() {
  const { families, schedule_changes, userId } = useStore();
  // Erinnerungen in den Einstellungen ein- oder ausgeschaltet: neu planen.
  const [setting, setSetting] = useState(0);
  useEffect(() => onHandoverReminderChange(() => setSetting((n) => n + 1)), []);
  // Plan-Angaben aller Familien als Abhängigkeit – nicht jede neue Nachricht soll neu planen.
  const plans = families
    .map((f) =>
      [
        f.id,
        f.schedule_model,
        f.schedule_start,
        f.schedule_first,
        f.handover_time,
        f.handover_place,
        f.children,
        f.name_a,
        f.name_b,
      ].join('|'),
    )
    .join(';');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Erst nach der Mitteilungs-Erlaubnis planen.
      await registerForPush();
      // Bestätigte Tausche aller Familien – die geöffnete hat sie schon, die anderen holen wir kurz nach.
      const { data } = await supabase
        .from('schedule_changes')
        .select('*')
        .eq('status', 'accepted')
        .in('family_id', families.map((f) => f.id));
      if (cancelled) return;
      const changes = (data ?? []) as ScheduleChange[];
      await refreshHandoverReminders(
        families.map((family: Family) => {
          const me: ParentKey = family.parent_b === userId ? 'b' : 'a';
          return {
            family,
            changes: changes.filter((c) => c.family_id === family.id),
            me,
            nameOf: (k: ParentKey) => (k === 'a' ? family.name_a : family.name_b),
          };
        }),
      );
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, schedule_changes, setting, userId]);

  return null;
}
