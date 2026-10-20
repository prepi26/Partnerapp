import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, tap } from '@/components/ui';
import { QUIZ, QUIZ_PER_DAY, quizForDay, quizRounds } from '@/data/quiz';
import { attempt, useCouple } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, gradient, radius, spacing } from '@/theme';

export default function Quiz() {
  const { quiz_answers, userId, partnerName, partnerJoined, answerQuiz } = useCouple();
  const day = toISO(today());
  const questions = quizForDay(day);
  const rounds = quizRounds(quiz_answers, userId);
  const todayRound = rounds.find((r) => r.day === day);
  const played = (todayRound?.mine.length ?? 0) >= QUIZ_PER_DAY;

  if (!played)
    return <Play questions={questions} partnerName={partnerName} onDone={(items) => answerQuiz(day, items)} />;

  const done = rounds.filter((r) => r.myScore !== null);
  const myTotal = done.reduce((sum, r) => sum + (r.myScore ?? 0), 0);
  const theirTotal = done.reduce((sum, r) => sum + (r.theirScore ?? 0), 0);
  const label = (id: string, index: number | undefined) =>
    index === undefined ? '–' : (QUIZ.find((q) => q.id === id)?.options[index] ?? '–');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {todayRound?.myScore != null ? (
          <>
            <Text style={styles.heroKicker}>Ergebnis von heute</Text>
            <Text style={styles.heroScore}>
              Du {todayRound.myScore}/{QUIZ_PER_DAY} · {partnerName} {todayRound.theirScore}/{QUIZ_PER_DAY}
            </Text>
            <Text style={styles.heroText}>
              {todayRound.myScore === QUIZ_PER_DAY
                ? `Gedankenleser! Du kennst ${partnerName} richtig gut 🔮`
                : todayRound.myScore > (todayRound.theirScore ?? 0)
                  ? `Heute kennst du ${partnerName} besser 😎`
                  : todayRound.myScore === todayRound.theirScore
                    ? 'Unentschieden – ihr kennt euch gleich gut 💞'
                    : `${partnerName} kennt dich heute besser 😉`}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.heroKicker}>Gespielt ✓</Text>
            <Text style={styles.heroScore}>Warte auf {partnerName}</Text>
            <Text style={styles.heroText}>
              {partnerJoined
                ? `${partnerName} bekommt eine Mitteilung. Sobald ihr beide gespielt habt, seht ihr, wer richtig lag.`
                : `Sobald ${partnerName} verbunden ist und spielt, seht ihr das Ergebnis.`}
            </Text>
          </>
        )}
      </LinearGradient>

      {questions.map((q) => {
        const mine = todayRound?.mine.find((a) => a.question_id === q.id);
        const theirs = todayRound?.theirs.find((a) => a.question_id === q.id);
        const complete = todayRound?.myScore != null;
        const myHit = complete && theirs && mine ? mine.guess === theirs.own : null;
        const theirHit = complete && theirs && mine ? theirs.guess === mine.own : null;
        return (
          <Card key={q.id} style={{ gap: 6 }}>
            <Text style={styles.topic}>{q.topic}</Text>
            <Text style={styles.line}>
              <Text style={styles.me}>Du: </Text>
              {label(q.id, mine?.own)}
            </Text>
            {complete ? (
              <>
                <Text style={styles.line}>
                  <Text style={styles.partner}>{partnerName}: </Text>
                  {label(q.id, theirs?.own)}
                </Text>
                <Text style={styles.small}>
                  Dein Tipp {myHit ? '✅' : '❌'} {label(q.id, mine?.guess)} · Tipp von {partnerName}{' '}
                  {theirHit ? '✅' : '❌'}
                </Text>
              </>
            ) : (
              <Text style={styles.small}>
                Dein Tipp für {partnerName}: {label(q.id, mine?.guess)}
              </Text>
            )}
          </Card>
        );
      })}

      {done.length > 0 ? (
        <Card style={{ gap: 6 }}>
          <Text style={styles.topic}>Wer kennt wen besser?</Text>
          <Text style={styles.line}>
            Nach {done.length} {done.length === 1 ? 'Runde' : 'Runden'}: Du {myTotal} · {partnerName} {theirTotal}{' '}
            Punkte
          </Text>
        </Card>
      ) : null}
      <Text style={styles.hint}>Morgen gibt es drei neue Fragen.</Text>
    </ScrollView>
  );
}

type Answer = { question_id: string; own: number; guess: number };

function Play({
  questions,
  partnerName,
  onDone,
}: {
  questions: ReturnType<typeof quizForDay>;
  partnerName: string;
  onDone: (items: Answer[]) => Promise<void>;
}) {
  // Pro Frage zwei Schritte: erst über dich, dann der Tipp für deinen Schatz.
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const question = questions[Math.floor(step / 2)];
  const aboutPartner = step % 2 === 1;

  const choose = async (index: number) => {
    if (saving) return;
    tap();
    const next = [...picks.slice(0, step), index];
    setPicks(next);
    if (step + 1 < questions.length * 2) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    const items = questions.map((q, i) => ({ question_id: q.id, own: next[i * 2], guess: next[i * 2 + 1] }));
    const ok = await attempt(() => onDone(items));
    if (!ok) setSaving(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.progress}>
        Frage {Math.floor(step / 2) + 1} von {questions.length} ·{' '}
        {aboutPartner ? `Tipp für ${partnerName}` : 'Über dich'}
      </Text>
      <View style={styles.dots}>
        {Array.from({ length: questions.length * 2 }, (_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotOn]} />
        ))}
      </View>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroKicker}>{aboutPartner ? `Was würde ${partnerName} wählen?` : 'Was passt zu dir?'}</Text>
        <Text style={styles.heroScore}>{question.topic}</Text>
      </LinearGradient>
      {question.options.map((option, index) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          disabled={saving}
          onPress={() => choose(index)}
          style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.optionText}>{option}</Text>
        </Pressable>
      ))}
      {step > 0 && !saving ? (
        <Pressable accessibilityRole="button" onPress={() => setStep(step - 1)} hitSlop={8}>
          <Text style={styles.back}>← Zurück</Text>
        </Pressable>
      ) : null}
      {saving ? <Text style={styles.hint}>Speichere…</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  hero: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  heroKicker: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.9,
  },
  heroScore: { color: colors.white, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  heroText: { color: colors.white, fontSize: 15, lineHeight: 21 },
  topic: { fontSize: 17, fontWeight: '800', color: colors.text },
  line: { fontSize: 15, color: colors.text, lineHeight: 21 },
  me: { color: colors.pink, fontWeight: '700' },
  partner: { color: colors.blue, fontWeight: '700' },
  small: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  progress: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pinkPale },
  dotOn: { backgroundColor: colors.pink },
  option: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionText: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  back: { fontSize: 15, fontWeight: '700', color: colors.blue, textAlign: 'center', marginTop: spacing.sm },
});
