import { Linking } from 'react-native';

import { showError } from '@/components/ui';
import { documentUrl } from '@/data/documents';
import { errorMessage } from '@/data/store';
import { FamilyDocument } from '@/data/types';
import { currentT } from '@/i18n';

/** Öffnet ein Dokument über einen kurzlebigen Link im Browser bzw. der PDF-Ansicht des Handys. */
export async function openDocument(doc: Pick<FamilyDocument, 'file_path'>) {
  try {
    await Linking.openURL(await documentUrl(doc.file_path));
  } catch (e) {
    showError(currentT().family.documents.openFailed, errorMessage(e));
  }
}
