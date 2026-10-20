import * as Sharing from 'expo-sharing';
import { RefObject } from 'react';
import { Platform, Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export const APP_LINK = 'https://apps.apple.com/app/id6820457302';

/** Macht aus einer View ein Bild im Story-Format (1080×1920). */
export function captureStory(ref: RefObject<View | null>) {
  return captureRef(ref, { format: 'png', width: 1080, height: 1920, result: 'tmpfile' });
}

/** Teilt ein Bild – auf iOS zusammen mit Text und App-Store-Link. */
export async function shareImage(uri: string, message: string) {
  if (Platform.OS === 'ios') {
    await Share.share({ url: uri, message });
  } else if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Teilen' });
  }
}
