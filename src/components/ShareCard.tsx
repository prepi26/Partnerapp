import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { colors, gradient, radius, spacing } from '@/theme';

import { HeaderIcon, PrimaryButton, SecondaryButton, showError } from './ui';

interface ShareCardProps {
  names: string;
  days: string;
  daysLabel: string;
  since: string;
  extra?: string | null;
}

/**
 * Teilen-Knopf im Kopf der Startseite: zeigt eine Karte im Story-Format (9:16)
 * und teilt sie als Bild – z. B. in die Instagram-Story oder per WhatsApp.
 */
export function ShareCardButton(props: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<View>(null);

  if (Platform.OS === 'web') return null;

  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureRef(cardRef, { format: 'png', width: 1080, height: 1920, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Eure Karte teilen' });
      }
      setOpen(false);
    } catch {
      showError('Teilen hat nicht geklappt', 'Bitte versuch es noch einmal.');
    }
    setBusy(false);
  };

  return (
    <>
      <HeaderIcon icon="share-outline" label="Als Bild teilen" onPress={() => setOpen(true)} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View ref={cardRef} collapsable={false} style={styles.cardFrame}>
            <ShareCard {...props} />
          </View>
          <View style={styles.actions}>
            <PrimaryButton
              title={busy ? 'Einen Moment…' : 'Teilen'}
              icon="share-outline"
              disabled={busy}
              onPress={share}
            />
            <SecondaryButton title="Schließen" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function ShareCard({ names, days, daysLabel, since, extra }: ShareCardProps) {
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text style={styles.emoji}>🌴💖🌊</Text>
      <View style={styles.center}>
        <Text style={styles.names}>{names}</Text>
        <Text style={styles.kicker}>zusammen seit</Text>
        <Text style={styles.days} adjustsFontSizeToFit numberOfLines={1}>
          {days}
        </Text>
        <Text style={styles.daysLabel}>{daysLabel}</Text>
        <Text style={styles.since}>{since}</Text>
        {extra ? <Text style={styles.extra}>{extra}</Text> : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.brand}>Wir zwei</Text>
        <Text style={styles.brandSub}>Die App für Paare · im App Store</Text>
      </View>
    </LinearGradient>
  );
}

const CARD_WIDTH = 270;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 18, 44, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  cardFrame: { width: CARD_WIDTH, aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden' },
  card: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'space-between' },
  emoji: { fontSize: 30, marginTop: spacing.md },
  center: { alignItems: 'center', alignSelf: 'stretch' },
  names: { color: colors.white, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: spacing.md },
  kicker: { color: colors.white, opacity: 0.9, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  days: {
    color: colors.white,
    fontSize: 76,
    fontWeight: '900',
    letterSpacing: -2,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  daysLabel: { color: colors.white, fontSize: 20, fontWeight: '700', marginTop: -6 },
  since: { color: colors.white, opacity: 0.9, fontSize: 13, marginTop: spacing.sm },
  extra: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center',
  },
  footer: { alignItems: 'center', marginBottom: spacing.sm },
  brand: { color: colors.white, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  brandSub: { color: colors.white, opacity: 0.9, fontSize: 11 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, maxWidth: 420, width: '100%' },
});
