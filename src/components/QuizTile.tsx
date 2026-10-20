import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QUIZ_PER_DAY, quizRounds } from '@/data/quiz';
import { useCouple } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, spacing } from '@/theme';

import { Card } from './ui';

/** Startseite: Hinweis auf das tägliche Quiz „Wie gut kennst du mich?“. */
export function QuizTile() {
  const { quiz_answers, userId, partnerName } = useCouple();
  const day = toISO(today());
  const round = quizRounds(quiz_answers, userId).find((r) => r.day === day);
  const played = (round?.mine.length ?? 0) >= QUIZ_PER_DAY;
  const partnerPlayed = (round?.theirs.length ?? 0) >= QUIZ_PER_DAY;

  const status = !played
    ? partnerPlayed
      ? `${partnerName} hat schon gespielt – du bist dran!`
      : '3 neue Fragen warten auf euch'
    : round?.myScore != null
      ? `Heute: du ${round.myScore}/${QUIZ_PER_DAY} · ${partnerName} ${round.theirScore}/${QUIZ_PER_DAY}`
      : `Warte auf ${partnerName}`;

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/quiz')}>
      {({ pressed }) => (
        <Card style={[styles.tile, pressed && { opacity: 0.7 }]}>
          <Text style={styles.emoji}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Wie gut kennst du mich?</Text>
            <Text style={styles.text} numberOfLines={1}>
              {status}
            </Text>
          </View>
          {!played ? <View style={styles.badge} /> : null}
          <Text style={styles.chevron}>›</Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 30 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 13, color: colors.textMuted },
  badge: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink },
  chevron: { fontSize: 28, color: colors.textMuted },
});
