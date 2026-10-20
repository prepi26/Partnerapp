import { useEffect } from 'react';

import { useCouple } from '@/data/store';
import { updateWidget, updateWidgetDrawing } from '@/lib/widget';

/** Hält das Home-Bildschirm-Widget auf dem Stand von Namen, Startdatum und Beziehungsstatus. */
export function WidgetSync() {
  const { couple, myName, partnerName, drawings, userId } = useCouple();
  // drawings ist neueste zuerst sortiert.
  const latest = drawings.find((d) => d.from_id !== userId) ?? null;

  useEffect(() => {
    updateWidget({ couple, myName, partnerName });
  }, [couple, myName, partnerName]);

  useEffect(() => {
    updateWidgetDrawing(latest, partnerName);
  }, [latest, partnerName]);

  return null;
}
