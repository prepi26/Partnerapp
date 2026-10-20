import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { colors, gradient, radius, spacing } from '@/theme';

import { HeaderIcon, PrimaryButton, SecondaryButton, showError } from './ui';

const APP_LINK = 'https://apps.apple.com/app/id6820457302';
const SHARE_TEXT = `Unser Zusammen-Zähler aus „Wir zwei“ 💖 Die App für Paare: ${APP_LINK}`;

/** Deko oben auf der Karte – „Ohne“ für Fotos, auf denen Emojis stören würden. */
const DEFAULT_DECORATION = '🌴💖🌊';
const DECORATIONS = ['', DEFAULT_DECORATION, '💖', '💍', '💑', '🥂', '🌹', '✨'];

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
  // Eigenes Paarfoto als Hintergrund – bleibt nur auf dem Handy, wird nirgends hochgeladen.
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // null = automatisch: mit Foto keine Deko, ohne Foto Palme/Herz/Welle.
  const [decoration, setDecoration] = useState<string | null>(null);
  const shownDecoration = decoration ?? (photoUri ? '' : DEFAULT_DECORATION);
  const cardRef = useRef<View>(null);

  if (Platform.OS === 'web') return null;

  const share = async () => {
    setBusy(true);
    let uri: string;
    try {
      uri = await captureRef(cardRef, { format: 'png', width: 1080, height: 1920, result: 'tmpfile' });
    } catch {
      setBusy(false);
      showError('Bild konnte nicht erstellt werden', 'Bitte versuch es noch einmal.');
      return;
    }
    // Erst die Vorschau schließen, dann das Teilen-Menü öffnen – zwei Fenster übereinander
    // lässt iOS manchmal nicht zu, dann ging Teilen erst nach einem Neustart wieder.
    setOpen(false);
    setBusy(false);
    await new Promise((resolve) => setTimeout(resolve, 450));
    try {
      if (Platform.OS === 'ios') {
        // Bild + Text mit App-Store-Link, damit Freunde die App direkt finden.
        await Share.share({ url: uri, message: SHARE_TEXT });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Eure Karte teilen' });
      }
    } catch {
      showError('Teilen hat nicht geklappt', 'Bitte versuch es noch einmal.');
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  return (
    <>
      <HeaderIcon icon="share-outline" label="Als Bild teilen" onPress={() => setOpen(true)} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View ref={cardRef} collapsable={false} style={styles.cardFrame}>
            <ShareCard {...props} photoUri={photoUri} decoration={shownDecoration} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.decoScroll}
            contentContainerStyle={styles.decoRow}
          >
            {DECORATIONS.map((d) => (
              <Pressable
                key={d || 'none'}
                accessibilityRole="button"
                accessibilityLabel={d ? `Deko ${d}` : 'Ohne Deko'}
                onPress={() => setDecoration(d)}
                style={[styles.decoChip, shownDecoration === d && styles.decoChipActive]}
              >
                <Text style={d ? styles.decoEmoji : styles.decoNone}>{d || 'Ohne'}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <PrimaryButton
              title={busy ? 'Einen Moment…' : 'Teilen'}
              icon="share-outline"
              disabled={busy}
              onPress={share}
            />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  title={photoUri ? 'Ändern' : 'Euer Foto als Hintergrund'}
                  icon="image-outline"
                  onPress={pickPhoto}
                />
              </View>
              {photoUri ? (
                <View style={{ flex: 1 }}>
                  <SecondaryButton title="Entfernen" icon="close-circle-outline" onPress={() => setPhotoUri(null)} />
                </View>
              ) : null}
            </View>
            <SecondaryButton title="Schließen" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function ShareCard({
  names,
  days,
  daysLabel,
  since,
  extra,
  photoUri,
  decoration,
}: ShareCardProps & { photoUri?: string | null; decoration: string }) {
  const deco = decoration ? <Text style={styles.emoji}>{decoration}</Text> : <View style={styles.emojiSpace} />;
  const counter = (
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
  );
  const footer = (
    <View style={styles.footer}>
      <Text style={styles.brand}>Wir zwei</Text>
      <Text style={styles.brandSub}>Die App für Paare · im App Store</Text>
    </View>
  );

  if (photoUri) {
    return (
      <View style={styles.photoCard}>
        <Image source={{ uri: photoUri }} style={styles.fill} resizeMode="cover" />
        {/* Abdunkeln oben und unten, damit die weiße Schrift auf jedem Foto lesbar bleibt. */}
        <LinearGradient
          colors={['rgba(30,18,44,0.45)', 'rgba(30,18,44,0)', 'rgba(30,18,44,0.75)']}
          locations={[0, 0.35, 1]}
          style={styles.fill}
        />
        <View style={styles.photoContent}>
          {deco}
          <View style={{ flex: 1 }} />
          {counter}
          {footer}
        </View>
      </View>
    );
  }

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      {deco}
      {counter}
      {footer}
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
  emojiSpace: { height: 30 + spacing.md },
  decoScroll: { flexGrow: 0, alignSelf: 'stretch', maxWidth: 420 },
  decoRow: { gap: spacing.sm, paddingHorizontal: spacing.xs, alignItems: 'center' },
  decoChip: {
    minWidth: 48,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  decoChipActive: { borderColor: colors.white, backgroundColor: 'rgba(255,255,255,0.3)' },
  decoEmoji: { fontSize: 20 },
  decoNone: { fontSize: 14, fontWeight: '700', color: colors.white },
  photoCard: { flex: 1, backgroundColor: colors.text },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  photoContent: { flex: 1, padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
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
