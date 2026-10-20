import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AnswerBox } from '@/components/AnswerBox';
import { Card, EmptyState, Fab } from '@/components/ui';
import { useFamily } from '@/data/store';
import { formatTimestamp, formatWeekday } from '@/lib/dates';
import { handoverLabel } from '@/lib/handovers';
import { colors, spacing } from '@/theme';

export default function Handovers() {
  const { handovers, userId, otherName, replyHandover } = useFamily();
  const counts = { on_time: 0, late: 0, missed: 0 };
  for (const h of handovers) counts[h.status]++;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={handovers}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.intro}>
              Halte kurz fest, wie eine Übergabe gelaufen ist. Der andere Elternteil kann bestätigen oder widersprechen –
              so entsteht ein faires Bild statt zwei Erinnerungen.
            </Text>
            {handovers.length ? (
              <Card style={styles.stats}>
                <Stat label="pünktlich" value={counts.on_time} />
                <Stat label="verspätet" value={counts.late} />
                <Stat label="ausgefallen" value={counts.missed} />
              </Card>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="Noch keine Übergaben"
            text="Ein Tipp nach jeder Übergabe genügt – auch wenn alles gut lief. Gerade das zeigt, dass es klappt."
          />
        }
        renderItem={({ item: h }) => {
          const mine = h.created_by === userId;
          return (
            <Card style={{ gap: 4 }}>
              <Text style={styles.day}>{formatWeekday(h.day)}</Text>
              <Text style={styles.status}>{handoverLabel(h)}</Text>
              {h.note ? <Text style={styles.text}>{h.note}</Text> : null}
              <Text style={styles.meta}>
                {mine ? 'Von dir' : `Von ${otherName}`} eingetragen · {formatTimestamp(h.created_at)}
              </Text>
              {h.reply ? (
                <Text style={[styles.reply, { color: h.reply === 'confirmed' ? colors.primary : colors.danger }]}>
                  {h.reply === 'confirmed' ? '✓ bestätigt' : '✗ widersprochen'}
                  {h.reply_note ? `: „${h.reply_note}“` : ''} · {formatTimestamp(h.replied_at ?? h.created_at)}
                </Text>
              ) : mine ? (
                <Text style={styles.meta}>Noch keine Rückmeldung von {otherName}</Text>
              ) : (
                <AnswerBox
                  yes="Stimmt so"
                  no="Stimmt nicht"
                  placeholder="z. B. Stau auf der A3, kurz Bescheid gegeben"
                  onAnswer={(confirm, note) => replyHandover(h.id, confirm, note)}
                />
              )}
            </Card>
          );
        }}
      />
      <Fab label="Übergabe eintragen" onPress={() => router.push('/handover-new')} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.meta}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  stats: { flexDirection: 'row', marginBottom: spacing.sm },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.text },
  day: { fontSize: 15, fontWeight: '800', color: colors.text },
  status: { fontSize: 16, fontWeight: '700', color: colors.text },
  text: { fontSize: 15, color: colors.text, lineHeight: 21 },
  meta: { fontSize: 12, color: colors.textMuted },
  reply: { fontSize: 13, fontWeight: '700' },
});
