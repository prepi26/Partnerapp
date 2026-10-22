import { Linking } from 'react-native';

import { showError } from '@/components/ui';
import { documentUrl } from '@/data/documents';
import { errorMessage } from '@/data/store';
import { FamilyDocument } from '@/data/types';

/** Öffnet ein Dokument über einen kurzlebigen Link im Browser bzw. der PDF-Ansicht des Handys. */
export async function openDocument(doc: Pick<FamilyDocument, 'file_path'>) {
  try {
    await Linking.openURL(await documentUrl(doc.file_path));
  } catch (e) {
    showError('Dokument nicht geöffnet', errorMessage(e));
  }
}
