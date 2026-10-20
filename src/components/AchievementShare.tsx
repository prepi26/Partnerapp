import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { useCouple } from '@/data/store';
import { Achievement } from '@/lib/achievements';
import { APP_LINK, captureStory, shareImage } from '@/lib/shareImage';
import { colors, gradient, radius, spacing } from '@/theme';

import { PrimaryButton, SecondaryButton, showError } from './ui';

/** Vorschau eines freigeschalteten Erfolgs als Story-Bild – mit „Teilen“. */
export function AchievementShare({ achievement, onClose }: { achievement: Achievement | null; onClose: () => void }) {
  const { couple } = useCouple();
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (!achievement) return;
    setBusy(true);
    let uri: string;
    try {
      uri = await captureStory(cardRef);
    } catch {
      setBusy(false);
      showError('Bild konnte nicht erstellt werden', 'Bitte versuch es noch einmal.');
      return;
    }
    // Wie bei der Teilen-Karte: erst die Vorschau schließen, dann das Teilen-Menü öffnen.
    setBusy(false);
    onClose();
    await new Promise((resolve) => setTimeout(resolve, 450));
    try {
      await shareImage(
        uri,
        `Erfolg freigeschaltet: ${achievement.emoji} ${achievement.title} – mit „Wir zwei“ 💖 Die App für Paare: ${APP_LINK}`,
      );
    } catch {
      showError('Teilen hat nicht geklappt', 'Bitte versuch es noch einmal.');
    }
  };

  return (
    <Modal visible={!!achievement} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {achievement ? (
          <View ref={cardRef} collapsable={false} style={styles.frame}>
            <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <Text style={styles.names} numberOfLines={1} adjustsFontSizeToFit>
                {couple.name_a} ♥ {couple.name_b}
              </Text>
              <View style={styles.center}>
                <Text style={styles.kicker}>Erfolg freigeschaltet</Text>
                <View style={styles.badge}>
                  <Text style={styles.emoji}>{achievement.emoji}</Text>
                </View>
                <Text style={styles.title}>{achievement.title}</Text>
                <Text style={styles.text}>{achievement.text}</Text>
              </View>
              <View style={styles.footer}>
                <Text style={styles.brand}>Wir zwei</Text>
                <Text style={styles.brandSub}>Die App für Paare · im App Store</Text>
              </View>
            </LinearGradient>
          </View>
        ) : null}
        <View style={styles.actions}>
          {Platform.OS !== 'web' ? (
            <PrimaryButton
              title={busy ? 'Einen Moment…' : 'Teilen'}
              icon="share-outline"
              disabled={busy}
              onPress={share}
            />
          ) : null}
          <SecondaryButton title="Schließen" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 18, 44, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  frame: { width: 270, aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden' },
  card: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'space-between' },
  names: { color: colors.white, fontSize: 26, fontWeight: '900', marginTop: spacing.md, textAlign: 'center' },
  center: { alignItems: 'center', gap: spacing.sm },
  kicker: { color: colors.white, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.9 },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 64 },
  title: { color: colors.white, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  text: { color: colors.white, fontSize: 14, textAlign: 'center', opacity: 0.95, lineHeight: 20 },
  footer: { alignItems: 'center', marginBottom: spacing.sm },
  brand: { color: colors.white, fontSize: 18, fontWeight: '900' },
  brandSub: { color: colors.white, opacity: 0.9, fontSize: 11 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, maxWidth: 420, width: '100%' },
});
