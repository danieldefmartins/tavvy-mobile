/**
 * saveQRCode -- exports a QR code SVG ref to a PNG and lets the user
 * save/share it via the best available method.
 *
 * Tries expo-sharing first (proper share sheet with "Save Image"),
 * falls back to RN Share if native module isn't in dev client.
 */

import * as FileSystem from 'expo-file-system';
import { Alert, Platform, Share } from 'react-native';

// Lazy-load expo-sharing — not available in every dev client build
let Sharing: typeof import('expo-sharing') | null = null;
try {
  Sharing = require('expo-sharing');
} catch {
  // Native module not available — will use RN Share fallback
}

/**
 * Export a QR code as PNG and open the native share/save sheet.
 * The ref must expose a `toDataURL(callback)` method (react-native-qrcode-svg).
 */
export async function saveQRCodeToCameraRoll(
  qrRef: { toDataURL: (cb: (data: string) => void) => void } | null,
): Promise<boolean> {
  if (!qrRef) {
    Alert.alert('Error', 'QR code not ready yet. Please try again.');
    return false;
  }

  return new Promise((resolve) => {
    qrRef.toDataURL(async (base64: string) => {
      try {
        const filename = `tavvy-qr-${Date.now()}.png`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Try expo-sharing first (gives proper "Save Image" option)
        if (Sharing) {
          try {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'image/png',
                dialogTitle: 'Save QR Code',
                UTI: 'public.png',
              });
              resolve(true);
              cleanupLater(fileUri);
              return;
            }
          } catch {
            // expo-sharing failed at runtime — fall through to RN Share
          }
        }

        // Fallback: RN built-in Share
        if (Platform.OS === 'ios') {
          await Share.share({ url: fileUri });
        } else {
          await Share.share({
            message: `data:image/png;base64,${base64}`,
            title: 'Tavvy QR Code',
          });
        }

        resolve(true);
        cleanupLater(fileUri);
      } catch (err: any) {
        if (err?.message?.includes('User did not share')) {
          resolve(false);
          return;
        }
        console.error('[saveQRCode] Error:', err);
        Alert.alert('Error', 'Failed to save QR code. Please try again.');
        resolve(false);
      }
    });
  });
}

function cleanupLater(fileUri: string) {
  setTimeout(() => {
    FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
  }, 60000);
}
