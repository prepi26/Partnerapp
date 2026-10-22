import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { currentT, Dict } from '@/i18n';

import { buildReportHtml, ReportInput } from './report';

export const RANGES = [
  { key: '30', days: 30 },
  { key: '90', days: 90 },
  { key: '365', days: 365 },
] as const;

/** Zeiträume mit Beschriftung in der gewählten Sprache. */
export function ranges(t: Dict = currentT()) {
  return RANGES.map((r) => ({ ...r, label: t.pro.ranges[r.key] }));
}

/** Erstellt das PDF und öffnet den Teilen-Dialog (im Browser: Drucken). */
export async function shareReport(input: ReportInput) {
  const html = buildReportHtml(input);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: currentT().pro.shareDialogTitle });
}
