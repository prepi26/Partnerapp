import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCouple } from '@/data/store';
import { StatPeriod, useThoughtStats } from '@/data/thoughtStats';
import { useAchievements } from '@/data/useAchievements';
import { colors, radius, spacing } from '@/theme';

import { Card, Chip } from './ui';

const PERIODS: { key: StatPeriod; label: string }[] = [
  { key: 'today', label: 'Heute' },
  { key: 'week', label: 'Woche' },
  { key: 'month', label: 'Monat' },
  { key: 'year', label: 'Jahr' },
];

/** Wer hat öfter an wen gedacht? Heute, diese Woche, diesen Monat, dieses Jahr. */
export function ThoughtLeaderboard() {
  const { userId, partnerName } = useCouple();
  const stats = useThoughtStats();
  const [period, setPeriod] = useState<StatPeriod>('week');

  if (!stats) return null;
  const mine = stats.find((s) => s.from_id === userId)?.[period] ?? 0;
  const theirs = stats.filter((s) => s.from_id !== userId).reduce((sum, s) => sum + s[period], 0);
  const max = Math.max(mine, theirs, 1);

  const verdict =
    mine === 0 && theirs === 0
      ? 'Noch keine Herzen – wer fängt an? 💗'
      : mine === theirs
        ? 'Gleichstand – ihr denkt gleich oft aneinander 💞'
        : mine > theirs
          ? `Du liegst vorn – ${partnerName} muss aufholen 😉`
          : `${partnerName} liegt vorn – schick schnell ein Herz 😉`;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>💗 Herz-Rangliste</Text>
      <View style={styles.chips}>
        {PERIODS.map((p) => (
          <Chip key={p.key} label={p.label} selected={period === p.key} onPress={() => setPeriod(p.key)} />
        ))}
      </View>
      <Bar name="Du" value={mine} max={max} leader={mine > theirs} tint={colors.pink} />
      <Bar name={partnerName} value={theirs} max={max} leader={theirs > mine} tint={colors.blue} />
      <Text style={styles.verdict}>{verdict}</Text>
    </Card>
  );
}

function Bar({
  name,
  value,
  max,
  leader,
  tint,
}: {
  name: string;
  value: number;
  max: number;
  leader: boolean;
  tint: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>
        {leader ? '👑 ' : ''}
        {name}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(value / max) * 100}%`, backgroundColor: tint }]} />
      </View>
      <Text style={styles.count}>{value}</Text>
    </View>
  );
}

/** Kachel auf der Startseite: Jahresrückblick. */
export function YearTile() {
  const year = new Date().getFullYear();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/year')}>
      {({ pressed }) => (
        <Card style={[styles.tile, pressed && { opacity: 0.7 }]}>
          <Text style={styles.tileEmoji}>🗓️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Euer Jahr {year}</Text>
            <Text style={styles.verdict} numberOfLines={1}>
              Herzen, Zettel, Erinnerungen – als Bild zum Teilen
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Card>
      )}
    </Pressable>
  );
}

/** Kachel auf der Startseite: Fortschritt der Paar-Erfolge. */
export function AchievementsTile() {
  const achievements = useAchievements();
  const unlocked = achievements.filter((a) => a.unlocked);
  const next = achievements.find((a) => !a.unlocked);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/achievements')}>
      {({ pressed }) => (
        <Card style={[styles.tile, pressed && { opacity: 0.7 }]}>
          <Text style={styles.tileEmoji}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Eure Erfolge · {unlocked.length} von {achievements.length}
            </Text>
            <Text style={styles.verdict} numberOfLines={1}>
              {next ? `Nächster: ${next.emoji} ${next.title}` : 'Alles geschafft – unglaublich! 🎉'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { width: 90, fontSize: 15, fontWeight: '700', color: colors.text },
  track: { flex: 1, height: 14, borderRadius: radius.pill, backgroundColor: colors.pinkPale, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  count: { width: 44, textAlign: 'right', fontSize: 16, fontWeight: '800', color: colors.text },
  verdict: { fontSize: 13, color: colors.textMuted },
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tileEmoji: { fontSize: 30 },
  chevron: { fontSize: 28, color: colors.textMuted },
});
