import { ExtensionStorage } from '@bacons/apple-targets';
import { Platform } from 'react-native';

import { Couple } from '@/data/types';

/** Muss mit app.json (ios.entitlements) und targets/widget/WirZweiWidget.swift übereinstimmen. */
const APP_GROUP = 'group.de.wirzwei.app';
const KEYS = ['myName', 'partnerName', 'nameA', 'nameB', 'startDate', 'status', 'weddingDate'] as const;

/** Schreibt die Daten für das Home-Bildschirm-Widget und lädt es neu. `null` leert es (Abmelden). */
export function updateWidget(data: { couple: Couple; myName: string; partnerName: string } | null) {
  if (Platform.OS !== 'ios') return;
  try {
    const storage = new ExtensionStorage(APP_GROUP);
    if (!data) {
      KEYS.forEach((key) => storage.remove(key));
    } else {
      const { couple } = data;
      storage.set('myName', data.myName);
      storage.set('partnerName', data.partnerName);
      storage.set('nameA', couple.name_a);
      storage.set('nameB', couple.name_b);
      storage.set('startDate', couple.start_date);
      storage.set('status', couple.status ?? 'together');
      storage.set('weddingDate', couple.wedding_date ?? '');
    }
    ExtensionStorage.reloadWidget();
  } catch {
    // Ohne Widget-Unterstützung (z. B. ältere App-Version) einfach nichts tun.
  }
}
