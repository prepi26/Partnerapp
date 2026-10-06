import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { moodEmojis } from '@/data/labels';
import { attempt, useCouple } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

import { Card, tap } from './ui';

/** Stimmung von heute: eigene setzen, die des Partners sehen. */
export function MoodCard() {
  const { moods, userId, myName, partnerName, partnerJoined, setMood } = useCouple();
  const [picking, setPicking] = useState(false);
  const day = toISO(today());
  const mine = moods.find((m) => m.user_id === userId && m.day === day);
  const theirs = moods.find((m) => m.user_id !== userId && m.day === day);

  const choose = (emoji: string) => {
    tap();
    setPicking(false);
    attempt(() => setMood(emoji));
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Meine Stimmung wählen"
          onPress={() => setPicking((p) => !p)}
          style={[styles.person, styles.mine]}
        >
          <Text style={styles.emoji}>{mine?.emoji ?? '➕'}</Text>
          <Text style={styles.name}>{myName}</Text>
          <Text style={styles.sub}>{mine ? 'antippen zum Ändern' : 'Wie geht’s dir?'}</Text>
        </Pressable>
        <View style={[styles.person, styles.theirs]}>
          <Text style={[styles.emoji, !theirs && { opacity: 0.35 }]}>{theirs?.emoji ?? '💭'}</Text>
          <Text style={styles.name}>{partnerName}</Text>
          <Text style={styles.sub}>{theirs ? 'heute' : partnerJoined ? 'noch nichts' : 'noch nicht verbunden'}</Text>
        </View>
      </View>
      {picking ? (
        <View style={styles.picker}>
          {moodEmojis.map((e) => (
            <Pressable
              key={e}
              accessibilityRole="button"
              onPress={() => choose(e)}
              style={[styles.option, mine?.emoji === e && styles.optionSelected]}
            >
              <Text style={styles.optionEmoji}>{e}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  person: { flex: 1, alignItems: 'center', borderRadius: radius.md, paddingVertical: spacing.md, gap: 2 },
  mine: { backgroundColor: colors.pinkPale },
  theirs: { backgroundColor: colors.bluePale },
  emoji: { fontSize: 40 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 4 },
  sub: { fontSize: 12, color: colors.textMuted },
  picker: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  option: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  optionSelected: { backgroundColor: colors.pinkPale },
  optionEmoji: { fontSize: 32 },
});
