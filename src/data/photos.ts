import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Kopiert ein Foto aus dem Picker-Cache in den dauerhaften App-Speicher,
 * damit es nicht vom System gelöscht wird.
 */
export async function persistPhoto(sourceUri: string, id: string): Promise<string> {
  if (Platform.OS === 'web') return sourceUri;

  const dir = new Directory(Paths.document, 'memories');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const target = new File(dir, `${id}.${ext}`);
  if (target.exists) target.delete();
  await new File(sourceUri).copy(target);
  return target.uri;
}

export function deletePhoto(uri: string | undefined) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Foto war bereits weg – nichts zu tun.
  }
}
