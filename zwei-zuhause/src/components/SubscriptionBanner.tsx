import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { purchasesAvailable, usePlus } from '@/data/plus';
import { useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/**
 * Hinweis zur Testzeit bzw. zur kostenlosen Version. Immer dezent – die Grundfunktionen bleiben ja frei.
 * Ohne Kaufmöglichkeit (Web/Entwicklung) erst kurz vor Ende der Testzeit.
 */
export function SubscriptionBanner() {
  const t = useT();
  const { otherName } = useFamily();
  const { active, inTrial, solo, promoUntil, trialDaysLeft, hasPlus } = usePlus();
  const s = t.common.subscription;
  if (active) return null;

  if (hasPlus) {
    // Allein erklärt die Einladungskarte die Testzeit – erst kurz vor Ende der kostenlosen Zeit erinnern.
    if (solo && trialDaysLeft > 5) return null;
    if (!purchasesAvailable && trialDaysLeft > 3) return null;
    // Gutschein: erst in der letzten Woche erinnern.
    if (promoUntil && trialDaysLeft > 7) return null;
    const text = promoUntil
      ? fmt(s.promoBanner, { n: trialDaysLeft })
      : solo
        ? fmt(s.soloBanner, { n: trialDaysLeft, name: otherName })
        : trialDaysLeft === 0
          ? s.trialBannerLast
          : trialDaysLeft === 1
            ? s.trialBannerOne
            : fmt(s.trialBannerOther, { n: trialDaysLeft });
    return (
      <Pressable accessibilityRole="button" onPress={() => router.push('/plus')} style={styles.trial}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.trialText}>{inTrial ? text : s.cta}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    );
  }

  // Kostenlose Version: ein ruhiger Hinweis auf Plus.
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/plus')} style={styles.trial}>
      <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      <Text style={styles.trialText}>{s.freeBanner}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </Pressable>
  );
}

/** Erklärt, warum ein Plus-Bereich gerade gesperrt ist, und führt zum Abo. */
export function PlusCard() {
  const t = useT();
  const { otherName } = useFamily();
  const s = t.common.subscription;
  return (
    <View style={styles.locked}>
      <Text style={styles.lockedTitle}>✨ {s.readOnlyTitle}</Text>
      <Text style={styles.lockedText}>{fmt(s.readOnlyText, { name: otherName })}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/plus')} style={styles.button}>
        <Text style={styles.buttonText}>{s.cta}</Text>
      </Pressable>
    </View>
  );
}

/** Für Plus-Bereiche (Kosten, Unterhalt, Dokumente): ohne Plus statt des Formulars die Erklärung. */
export function PlusGate({ children }: { children: React.ReactNode }) {
  const { hasPlus } = usePlus();
  if (hasPlus) return <>{children}</>;
  return (
    <View style={{ padding: spacing.lg }}>
      <PlusCard />
    </View>
  );
}

const styles = StyleSheet.create({
  trial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  trialText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.primary },
  locked: { backgroundColor: colors.primaryPale, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  lockedTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  lockedText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  button: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '800', color: colors.white },
});
