import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AnswerBox } from '@/components/AnswerBox';
import { Card, EmptyState, Fab, SecondaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { Decision } from '@/data/types';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { decisionCategory } from '@/lib/decisions';
import { colors, spacing } from '@/theme';

const STATUS = {
  proposed: { text: 'wartet auf Antwort', color: colors.warning },
  agreed: { text: 'zugestimmt', color: colors.primary },
  rejected: { text: 'nicht zugestimmt', color: colors.danger },
} as const;

export default function Decisions() {
  const { decisions, userId, otherName, nameOf, otherJoined, answerDecision, withdrawDecision } = useFamily();
  const author = (d: Decision) =>
    d.created_by === userId ? 'Du' : d.created_by ? otherName : `${nameOf('a')}/${nameOf('b')}`;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={decisions}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.intro}>
            Über wichtige Fragen – Schule, Operation, Auslandsreise, Umzug – entscheiden Eltern mit gemeinsamer Sorge
            zusammen. Hier wird gefragt, beantwortet und festgehalten. Alltägliches entscheidet, wer das Kind gerade
            betreut.
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="git-pull-request-outline"
            title="Noch nichts zu entscheiden"
            text={`Stell eine Frage an ${otherName} – mit Frist, wenn es eilt.`}
          />
        }
        renderItem={({ item: d }) => {
          const cat = decisionCategory(d.category);
          const mine = d.created_by === userId;
          const status = STATUS[d.status];
          return (
            <Card style={{ gap: 4 }}>
              <Text style={styles.cat}>
                {cat.emoji} {cat.label}
              </Text>
              <Text style={styles.title}>{d.title}</Text>
              {d.details ? <Text style={styles.text}>{d.details}</Text> : null}
              {d.due_date ? <Text style={styles.meta}>Antwort erbeten bis {formatDate(d.due_date)}</Text> : null}
              <Text style={styles.meta}>
                {author(d)} · {formatTimestamp(d.created_at)}
              </Text>
              <Text style={[styles.status, { color: status.color }]}>
                ● {status.text}
                {d.answered_at ? ` · ${formatTimestamp(d.answered_at)}` : ''}
              </Text>
              {d.answer_note ? <Text style={styles.text}>„{d.answer_note}“</Text> : null}
              {d.status === 'proposed' && !mine ? (
                <AnswerBox
                  yes="Zustimmen"
                  no="Nicht zustimmen"
                  placeholder="z. B. Einverstanden, wenn …"
                  onAnswer={(agree, note) => answerDecision(d.id, agree, note)}
                />
              ) : null}
              {d.status === 'proposed' && mine ? (
                <SecondaryButton
                  title="Zurückziehen"
                  icon="arrow-undo"
                  danger
                  onPress={() => attempt(() => withdrawDecision(d.id))}
                />
              ) : null}
            </Card>
          );
        }}
        ListFooterComponent={
          otherJoined ? null : (
            <Text style={styles.meta}>Antworten kann nur der andere Elternteil – sobald er/sie verbunden ist.</Text>
          )
        }
      />
      <Fab label="Neue Frage" onPress={() => router.push('/decision-new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  cat: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.text, lineHeight: 21 },
  meta: { fontSize: 12, color: colors.textMuted },
  status: { fontSize: 13, fontWeight: '700' },
});
