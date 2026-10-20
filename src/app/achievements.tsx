import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AchievementShare } from '@/components/AchievementShare';

import { useAchievements } from '@/data/useAchievements';
import { Achievement, GROUPS } from '@/lib/achievements';
import { formatNumber } from '@/lib/dates';
import { colors, radius, shadow, spacing } from '@/theme';

export default function Achievements() {
  const achievements = useAchievements();
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const [sharing, setSharing] = useState<Achievement | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.summary}>
        {unlocked} von {achievements.length} Erfolgen geschafft
      </Text>
      {unlocked > 0 ? <Text style={styles.hint}>Tipp auf einen geschafften Erfolg, um ihn zu teilen.</Text> : null}
      {GROUPS.map((group) => {
        const list = achievements.filter((a) => a.group === group);
        const done = list.filter((a) => a.unlocked).length;
        return (
          <View key={group} style={{ gap: spacing.sm }}>
            <Text style={styles.group}>
              {group} · {done}/{list.length}
            </Text>
            <View style={styles.grid}>
              {list.map((a) => (
                <Pressable
                  key={a.id}
                  accessibilityRole={a.unlocked ? 'button' : undefined}
                  disabled={!a.unlocked}
                  onPress={() => setSharing(a)}
                  style={({ pressed }) => [styles.badge, !a.unlocked && styles.locked, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.emoji, !a.unlocked && { opacity: 0.35 }]}>{a.emoji}</Text>
                  <Text style={styles.title}>{a.title}</Text>
                  <Text style={styles.text}>{a.text}</Text>
                  {a.unlocked ? (
                    <Text style={styles.done}>Geschafft ✓ · Teilen</Text>
                  ) : (
                    <>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${(a.value / a.goal) * 100}%` }]} />
                      </View>
                      <Text style={styles.progress}>
                        {formatNumber(a.value)} / {formatNumber(a.goal)}
                      </Text>
                    </>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
      <AchievementShare achievement={sharing} onClose={() => setSharing(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  group: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  hint: { fontSize: 13, color: colors.pink, fontWeight: '700', textAlign: 'center' },
  summary: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    alignItems: 'center',
    ...shadow,
  },
  locked: { backgroundColor: colors.muted },
  emoji: { fontSize: 34 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, textAlign: 'center' },
  text: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  done: { fontSize: 13, fontWeight: '800', color: colors.pink, marginTop: 4 },
  track: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkPale,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: { height: '100%', backgroundColor: colors.pink, borderRadius: radius.pill },
  progress: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
});
