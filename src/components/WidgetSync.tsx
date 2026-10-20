import { useEffect } from 'react';

import { useCouple } from '@/data/store';
import { updateWidget } from '@/lib/widget';

/** Hält das Home-Bildschirm-Widget auf dem Stand von Namen, Startdatum und Beziehungsstatus. */
export function WidgetSync() {
  const { couple, myName, partnerName } = useCouple();

  useEffect(() => {
    updateWidget({ couple, myName, partnerName });
  }, [couple, myName, partnerName]);

  return null;
}
