import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { currentT } from '@/i18n';
import { must, supabase } from '@/lib/supabase';

const BUCKET = 'documents';
/** Muss zu size_bytes in supabase/schema.sql passen. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

async function readBytes(uri: string): Promise<ArrayBuffer | Uint8Array> {
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).bytes();
}

/** Lädt ein Dokument in den Ordner der Familie und liefert den Pfad. */
export async function uploadDocument(familyId: string, file: PickedFile): Promise<string> {
  const ext = (file.name.split('.').pop() || file.mimeType.split('/')[1] || 'bin').toLowerCase().replace('jpeg', 'jpg');
  const path = `${familyId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploaded = must(
    await supabase.storage.from(BUCKET).upload(path, await readBytes(file.uri), { contentType: file.mimeType }),
  );
  return uploaded?.path ?? path;
}

export async function deleteDocumentFile(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Alle Dokumente der Familie löschen (wenn der letzte Elternteil sein Konto löscht). */
export async function deleteAllDocumentFiles(familyId: string) {
  for (;;) {
    const files = must(await supabase.storage.from(BUCKET).list(familyId, { limit: 1000 })) ?? [];
    if (!files.length) return;
    const removed = must(
      await supabase.storage.from(BUCKET).remove(files.map((f: { name: string }) => `${familyId}/${f.name}`)),
    );
    if (!removed?.length || files.length < 1000) return;
  }
}

/** Kurzlebiger Link zum Öffnen (der Speicher ist privat). */
export async function documentUrl(path: string): Promise<string> {
  const data = must(await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10));
  if (!data?.signedUrl) throw new Error(currentT().family.documents.notFound);
  return data.signedUrl;
}

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
