import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Field, PrimaryButton } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { PACKS, packQuestionForDay } from '@/data/questions';
import { attempt, useCouple } from '@/data/store';
import { formatDate, toISO, today } from '@/lib/dates';
import { colors, gradient, radius, spacing } from '@/theme';

export default function PackQuestion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pack = PACKS.find((p) => p.id === id);
  const { pack_answers, userId, myName, partnerName, partnerJoined, answerPack } = useCouple();
  const { active } = usePlus();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  if (!pack) return <Redirect href="/question" />;
  if (!active) return <Redirect href="/plus" />;

  const day = toISO(today());
  const ofPack = pack_answers.filter((a) => a.pack === pack.id);
  const mine = ofPack.find((a) => a.user_id === userId && a.day === day);
  const theirs = ofPack.find((a) => a.user_id !== userId && a.day === day);
  const history = [...new Set(ofPack.map((a) => a.day))]
    .filter((d) => d !== day)
    .sort((a, b) => b.localeCompare(a))
    .map((d) => ({
      day: d,
      mine: ofPack.find((a) => a.day === d && a.user_id === userId),
      theirs: ofPack.find((a) => a.day === d && a.user_id !== userId),
    }))
    .filter((h) => h.mine && h.theirs);

  const submit = async () => {
    setSaving(true);
    if (await attempt(() => answerPack(pack.id, day, draft.trim()))) setDraft('');
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `${pack.emoji} ${pack.title}` }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.questionBox}>
          <Text style={styles.kicker}>
            {pack.title} · {formatDate(day)}
          </Text>
          <Text style={styles.question}>{packQuestionForDay(pack, day)}</Text>
        </LinearGradient>

        {mine ? (
          <>
            <AnswerCard name={myName} text={mine.answer} tint="pink" />
            {theirs ? (
              <AnswerCard name={partnerName} text={theirs.answer} tint="blue" />
            ) : (
              <Text style={styles.waiting}>
                {partnerJoined
                  ? `${partnerName} hat noch nicht geantwortet.`
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
          </Card>
        )}

        {history.length ? <Text style={styles.section}>Frühere Antworten</Text> : null}
        {history.map((h) => (
          <Card key={h.day} style={{ gap: spacing.sm }}>
            <Text style={styles.historyDate}>{formatDate(h.day)}</Text>
            <Text style={styles.historyQuestion}>{packQuestionForDay(pack, h.day)}</Text>
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
  waiting: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  historyDate: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  historyQuestion: { fontSize: 16, fontWeight: '700', color: colors.text },
  historyAnswer: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
