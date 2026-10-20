import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { buildReportHtml, ReportInput } from './report';

export const RANGES = [
  { key: '30', label: '30 Tage', days: 30 },
  { key: '90', label: '3 Monate', days: 90 },
  { key: '365', label: '12 Monate', days: 365 },
] as const;

/** Erstellt das PDF und öffnet den Teilen-Dialog (im Browser: Drucken). */
export async function shareReport(input: ReportInput) {
  const html = buildReportHtml(input);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Bericht teilen' });
}
