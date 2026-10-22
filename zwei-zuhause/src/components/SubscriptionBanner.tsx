import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { purchasesAvailable, usePlus } from '@/data/plus';
import { useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/**
 * Hinweis zur Testzeit bzw. „nur noch lesen“. Während der Testzeit dezent, danach deutlich.
 * Ohne Kaufmöglichkeit (Web/Entwicklung) nur, wenn wirklich gesperrt ist.
 */
export function SubscriptionBanner() {
  const t = useT();
  const { otherName } = useFamily();
  const { active, inTrial, trialDaysLeft, canWrite } = usePlus();
  const s = t.common.subscription;
  if (active) return null;

  if (canWrite) {
    if (!purchasesAvailable && trialDaysLeft > 3) return null;
    const text =
      trialDaysLeft === 0 ? s.trialBannerLast : trialDaysLeft === 1 ? s.trialBannerOne : fmt(s.trialBannerOther, { n: trialDaysLeft });
    return (
      <Pressable accessibilityRole="button" onPress={() => router.push('/plus')} style={styles.trial}>
        <Ionicons name="time-outline" size={18} color={colors.primary} />
        <Text style={styles.trialText}>{inTrial ? text : s.cta}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    );
  }

  return (
    <View style={styles.locked}>
      <Text style={styles.lockedTitle}>🔒 {s.readOnlyTitle}</Text>
      <Text style={styles.lockedText}>{fmt(s.readOnlyText, { name: otherName })}</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/plus')} style={styles.button}>
        <Text style={styles.buttonText}>{s.cta}</Text>
      </Pressable>
    </View>
  );
}

/** Für Bildschirme, auf denen man etwas einträgt: nach der Testzeit ohne Abo statt des Formulars. */
export function WriteGate({ children }: { children: React.ReactNode }) {
  const { canWrite } = usePlus();
  if (canWrite) return <>{children}</>;
  return (
    <View style={{ padding: spacing.lg }}>
      <SubscriptionBanner />
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
  locked: { backgroundColor: colors.parentBPale, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
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
