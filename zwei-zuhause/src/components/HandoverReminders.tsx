import { useEffect } from 'react';

import { useFamily } from '@/data/store';
import { registerForPush } from '@/lib/push';
import { refreshHandoverReminders } from '@/lib/reminders';

/** Plant die Erinnerungen am Vorabend jeder Übergabe – neu, sobald sich Plan oder Tausch ändern. */
export function HandoverReminders() {
  const { family, schedule_changes, me, nameOf } = useFamily();
  const { schedule_model, schedule_start, schedule_first, handover_time, handover_place, children, name_a, name_b } =
    family;

  useEffect(() => {
    let cancelled = false;
    // Erst nach der Mitteilungs-Erlaubnis planen.
    registerForPush().then(() => {
      if (cancelled) return;
      refreshHandoverReminders({ family, changes: schedule_changes, me, nameOf });
    });
    return () => {
      cancelled = true;
    };
    // Nur bei Änderungen, die die Erinnerungen betreffen – nicht bei jeder neuen Nachricht.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule_model, schedule_start, schedule_first, handover_time, handover_place, children, name_a, name_b, schedule_changes, me]);

  return null;
}
