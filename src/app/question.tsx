import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Field, PrimaryButton } from '@/components/ui';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { PACKS, questionForDay } from '@/data/questions';
import { attempt, useCouple } from '@/data/store';
import { formatDate, toISO, today } from '@/lib/dates';
import { answerStreak } from '@/lib/streak';
import { colors, gradient, radius, spacing } from '@/theme';

export default function Question() {
  const { answers, pack_answers, userId, myName, partnerName, partnerJoined, answer } = useCouple();
  const { active: plus } = usePlus();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const day = toISO(today());
  const mine = answers.find((a) => a.user_id === userId && a.day === day);
  const theirs = answers.find((a) => a.user_id !== userId && a.day === day);
  const streak = answerStreak(answers, userId, day);

  // Frühere Tage, an denen beide geantwortet haben.
  const history = [...new Set(answers.map((a) => a.day))]
    .filter((d) => d !== day)
    .sort((a, b) => b.localeCompare(a))
    .map((d) => ({
      day: d,
      mine: answers.find((a) => a.day === d && a.user_id === userId),
      theirs: answers.find((a) => a.day === d && a.user_id !== userId),
    }))
    .filter((h) => h.mine && h.theirs);

  const submit = async () => {
    setSaving(true);
    if (await attempt(() => answer(day, draft.trim()))) setDraft('');
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.questionBox}>
          <Text style={styles.kicker}>
            Heute · {formatDate(day)}
            {streak >= 2 ? `  ·  🔥 ${streak} Tage in Folge` : ''}
          </Text>
          <Text style={styles.question}>{questionForDay(day)}</Text>
        </LinearGradient>

        {mine ? (
          <>
            <AnswerCard name={myName} text={mine.answer} tint="pink" />
            {theirs ? (
              <AnswerCard name={partnerName} text={theirs.answer} tint="blue" />
            ) : (
              <Text style={styles.waiting}>
                {partnerJoined
                  ? `${partnerName} hat noch nicht geantwortet. Sobald es so weit ist, erscheint die Antwort hier.`
                  : `Sobald ${partnerName} verbunden ist und antwortet, seht ihr eure Antworten gegenseitig.`}
              </Text>
            )}
          </>
        ) : (
          <Card style={{ gap: spacing.md }}>
            <Field
              label="Deine Antwort"
              value={draft}
              onChangeText={setDraft}
              placeholder="Schreib ehrlich – erst danach siehst du die andere Antwort."
              multiline
              maxLength={2000}
            />
            <PrimaryButton
              title={saving ? 'Speichere…' : 'Antwort abschicken'}
              icon="send"
              disabled={!draft.trim() || saving}
              onPress={submit}
            />
            <Text style={styles.hint}>
              🔒 Die Antwort von {partnerName} siehst du erst, wenn du selbst geantwortet hast.
            </Text>
          </Card>
        )}

        {/* Themen-Fragen nur zeigen, wenn Plus gekauft werden kann oder schon aktiv ist. */}
        {purchasesAvailable || plus ? (
          <>
            <Text style={styles.section}>{plus ? 'Themen-Fragen' : 'Themen-Fragen · Plus'}</Text>
            {PACKS.map((p) => {
              const done = pack_answers.some((a) => a.pack === p.id && a.day === day && a.user_id === userId);
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => router.push(plus ? `/pack/${p.id}` : '/plus')}
                  style={({ pressed }) => [styles.pack, pressed && { opacity: 0.7 }]}
                >
                  <Text style={styles.packEmoji}>{p.emoji}</Text>
                  <Text style={styles.packTitle}>{p.title}</Text>
                  <Ionicons
                    name={!plus ? 'lock-closed' : done ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={done ? colors.pink : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </>
        ) : null}

        {history.length ? <Text style={styles.section}>Eure bisherigen Antworten</Text> : null}
        {history.map((h) => (
          <Card key={h.day} style={{ gap: spacing.sm }}>
            <Text style={styles.historyDate}>{formatDate(h.day)}</Text>
            <Text style={styles.historyQuestion}>{questionForDay(h.day)}</Text>
            <Text style={styles.historyAnswer}>
              <Text style={{ color: colors.pink, fontWeight: '700' }}>{myName}: </Text>
              {h.mine!.answer}
            </Text>
            <Text style={styles.historyAnswer}>
              <Text style={{ color: colors.blue, fontWeight: '700' }}>{partnerName}: </Text>
              {h.theirs!.answer}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AnswerCard({ name, text, tint }: { name: string; text: string; tint: 'pink' | 'blue' }) {
  return (
    <View style={[styles.answer, { backgroundColor: tint === 'pink' ? colors.pinkPale : colors.bluePale }]}>
      <Text style={[styles.answerName, { color: tint === 'pink' ? colors.pink : colors.blue }]}>{name}</Text>
      <Text style={styles.answerText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  questionBox: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  kicker: {
    color: colors.white,
    opacity: 0.9,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  question: { color: colors.white, fontSize: 24, fontWeight: '800', lineHeight: 31 },
  answer: { borderRadius: radius.md, padding: spacing.md, gap: 4 },
  answerName: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  answerText: { fontSize: 17, color: colors.text, lineHeight: 24 },
  waiting: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing.md,
  },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  pack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  packEmoji: { fontSize: 24 },
  packTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  historyDate: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  historyQuestion: { fontSize: 16, fontWeight: '700', color: colors.text },
  historyAnswer: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
