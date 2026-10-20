import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAchievements } from '@/data/useAchievements';
import { GROUPS } from '@/lib/achievements';
import { formatNumber } from '@/lib/dates';
import { colors, radius, shadow, spacing } from '@/theme';

export default function Achievements() {
  const achievements = useAchievements();
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.summary}>
        {unlocked} von {achievements.length} Erfolgen geschafft
      </Text>
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
                <View key={a.id} style={[styles.badge, !a.unlocked && styles.locked]}>
                  <Text style={[styles.emoji, !a.unlocked && { opacity: 0.35 }]}>{a.emoji}</Text>
                  <Text style={styles.title}>{a.title}</Text>
                  <Text style={styles.text}>{a.text}</Text>
                  {a.unlocked ? (
                    <Text style={styles.done}>Geschafft ✓</Text>
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
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  group: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
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
