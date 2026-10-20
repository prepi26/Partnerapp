import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { must, supabase } from '@/lib/supabase';

const BUCKET = 'receipts';
const URL_LIFETIME_S = 60 * 60 * 24;

async function readBytes(uri: string): Promise<ArrayBuffer | Uint8Array> {
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).bytes();
}

/** Lädt einen Beleg in den gemeinsamen Speicher der Familie und liefert den Pfad. */
export async function uploadReceipt(familyId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const path = `${familyId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploaded = must(
    await supabase.storage.from(BUCKET).upload(path, await readBytes(uri), { contentType: mimeType }),
  );
  return uploaded?.path ?? path;
}

export async function deleteReceipt(path: string | null) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Alle Belege der Familie löschen (wenn der letzte Elternteil sein Konto löscht). */
export async function deleteAllReceipts(familyId: string) {
  // Seitenweise, weil list() höchstens 1000 Einträge liefert; gelöschte rücken nach.
  for (;;) {
    const files = must(await supabase.storage.from(BUCKET).list(familyId, { limit: 1000 })) ?? [];
    if (!files.length) return;
    const removed = must(
      await supabase.storage.from(BUCKET).remove(files.map((f: { name: string }) => `${familyId}/${f.name}`)),
    );
    // Nichts gelöscht (keine Berechtigung) oder letzte Seite: fertig – sonst liefe die Schleife ewig.
    if (!removed?.length || files.length < 1000) return;
  }
}

/** Zeitlich begrenzte Links, weil der Beleg-Speicher privat ist. */
export async function signedReceiptUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, URL_LIFETIME_S);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return urls;
}
