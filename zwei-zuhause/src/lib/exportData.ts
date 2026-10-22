import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { toISO, today } from './dates';

/**
 * Export „Meine Daten“ (Art. 15/20 DSGVO): alles, was dieses Konto sehen kann, als lesbare JSON-Datei.
 * Gemeinsame Einträge enthalten auch Angaben des anderen Elternteils – so, wie sie in der App stehen.
 */
export async function shareDataExport(data: Record<string, unknown>) {
  const name = `zwei-zuhause-daten-${toISO(today())}.json`;
  const json = JSON.stringify({ exportiert_am: new Date().toISOString(), ...data }, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Meine Daten' });
}
