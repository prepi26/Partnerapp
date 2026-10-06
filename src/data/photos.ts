import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { must, supabase } from '@/lib/supabase';

const BUCKET = 'photos';
const URL_LIFETIME_S = 60 * 60 * 24 * 7;

async function readBytes(uri: string): Promise<ArrayBuffer | Uint8Array> {
  if (Platform.OS === 'web') return (await fetch(uri)).arrayBuffer();
  return new File(uri).bytes();
}

/** Lädt ein Foto in den gemeinsamen Speicher des Paares und liefert den Pfad. */
export async function uploadPhoto(coupleId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const path = `${coupleId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploaded = must(
    await supabase.storage.from(BUCKET).upload(path, await readBytes(uri), { contentType: mimeType }),
  );
  return uploaded?.path ?? path;
}

export async function deletePhoto(path: string | null) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Zeitlich begrenzte Links, weil der Foto-Speicher privat ist. */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, URL_LIFETIME_S);
  const urls: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return urls;
}
