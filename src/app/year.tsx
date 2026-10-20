import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, showError } from '@/components/ui';
import { useCouple } from '@/data/store';
import { useYearReview } from '@/data/useYearReview';
import { daysBetween, formatNumber, parseISO, today } from '@/lib/dates';
import { APP_LINK, captureStory, shareImage } from '@/lib/shareImage';
import { colors, gradient, radius, spacing } from '@/theme';

export default function YearReviewScreen() {
  const { couple } = useCouple();
  const review = useYearReview();
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const days = Math.max(0, daysBetween(parseISO(couple.start_date), today()));

  const items = [
    { emoji: '💗', value: review.hearts, label: 'Herzen' },
    { emoji: '✉️', value: review.notes, label: 'Liebeszettel' },
    { emoji: '💬', value: review.answers, label: 'gemeinsame Antworten' },
    { emoji: '📸', value: review.memories, label: 'Erinnerungen' },
    { emoji: '⭐', value: review.wishesDone, label: 'erfüllte Wünsche' },
    { emoji: '🗓️', value: days, label: 'Tage zusammen' },
  ];

  const share = async () => {
    setBusy(true);
    try {
      const uri = await captureStory(cardRef);
      await shareImage(uri, `Unser Jahr ${review.year} mit „Wir zwei“ 💖 Die App für Paare: ${APP_LINK}`);
    } catch {
      showError('Teilen hat nicht geklappt', 'Bitte versuch es noch einmal.');
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View ref={cardRef} collapsable={false} style={styles.frame}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.kicker}>Euer Jahr</Text>
            <Text style={styles.year}>{review.year}</Text>
            <Text style={styles.names} numberOfLines={1} adjustsFontSizeToFit>
              {couple.name_a} ♥ {couple.name_b}
            </Text>
          </View>
          <View style={styles.grid}>
            {items.map((item) => (
              <View key={item.label} style={styles.cell}>
                <Text style={styles.cellEmoji}>{item.emoji}</Text>
                <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>
                  {item.value === null ? '–' : formatNumber(item.value)}
                </Text>
                <Text style={styles.cellLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.footer}>
            <Text style={styles.brand}>Wir zwei</Text>
            <Text style={styles.brandSub}>Die App für Paare · im App Store</Text>
          </View>
        </LinearGradient>
      </View>
      {Platform.OS !== 'web' ? (
        <PrimaryButton
          title={busy ? 'Einen Moment…' : 'Als Bild teilen'}
          icon="share-outline"
          disabled={busy}
          onPress={share}
        />
      ) : null}
      <Text style={styles.hint}>Die Zahlen zählen ab dem 1. Januar und wachsen mit jedem Tag weiter.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, alignItems: 'center', paddingBottom: 60 },
  frame: { width: 300, aspectRatio: 9 / 16, borderRadius: radius.lg, overflow: 'hidden' },
  card: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  head: { alignItems: 'center', marginTop: spacing.sm },
  kicker: { color: colors.white, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.9 },
  year: { color: colors.white, fontSize: 64, fontWeight: '900', letterSpacing: -2, lineHeight: 70 },
  names: { color: colors.white, fontSize: 20, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  cell: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  cellEmoji: { fontSize: 18 },
  cellValue: { color: colors.white, fontSize: 26, fontWeight: '900' },
  cellLabel: { color: colors.white, fontSize: 11, fontWeight: '600', textAlign: 'center', opacity: 0.95 },
  footer: { alignItems: 'center' },
  brand: { color: colors.white, fontSize: 18, fontWeight: '900' },
  brandSub: { color: colors.white, opacity: 0.9, fontSize: 11 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
