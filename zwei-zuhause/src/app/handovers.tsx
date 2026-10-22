import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AnswerBox } from '@/components/AnswerBox';
import { Card, EmptyState, Fab } from '@/components/ui';
import { useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { formatTimestamp, formatWeekday } from '@/lib/dates';
import { handoverLabel } from '@/lib/handovers';
import { colors, spacing } from '@/theme';

export default function Handovers() {
  const t = useT();
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
            <Text style={styles.intro}>{t.calendar.handovers.intro}</Text>
            {handovers.length ? (
              <Card style={styles.stats}>
                <Stat label={t.calendar.handovers.statOnTime} value={counts.on_time} />
                <Stat label={t.calendar.handovers.statLate} value={counts.late} />
                <Stat label={t.calendar.handovers.statMissed} value={counts.missed} />
              </Card>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title={t.calendar.handovers.emptyTitle}
            text={t.calendar.handovers.emptyText}
          />
        }
        renderItem={({ item: h }) => {
          const mine = h.created_by === userId;
          return (
            <Card style={{ gap: 4 }}>
              <Text style={styles.day}>{formatWeekday(h.day, t)}</Text>
              <Text style={styles.status}>{handoverLabel(h, t)}</Text>
              {h.note ? <Text style={styles.text}>{h.note}</Text> : null}
              <Text style={styles.meta}>
                {mine ? t.calendar.handovers.enteredByYou : fmt(t.calendar.handovers.enteredBy, { name: otherName })} ·{' '}
                {formatTimestamp(h.created_at)}
              </Text>
              {h.reply ? (
                <Text style={[styles.reply, { color: h.reply === 'confirmed' ? colors.primary : colors.danger }]}>
                  {h.reply === 'confirmed' ? `✓ ${t.calendar.handovers.confirmed}` : `✗ ${t.calendar.handovers.disputed}`}
                  {h.reply_note ? `: ${fmt(t.calendar.quote, { text: h.reply_note })}` : ''} ·{' '}
                  {formatTimestamp(h.replied_at ?? h.created_at)}
                </Text>
              ) : mine ? (
                <Text style={styles.meta}>{fmt(t.calendar.handovers.noReply, { name: otherName })}</Text>
              ) : (
                <AnswerBox
                  yes={t.calendar.handovers.yes}
                  no={t.calendar.handovers.no}
                  placeholder={t.calendar.handovers.replyPlaceholder}
                  onAnswer={(confirm, note) => replyHandover(h.id, confirm, note)}
                />
              )}
            </Card>
          );
        }}
      />
      <Fab label={t.calendar.handovers.add} onPress={() => router.push('/handover-new')} />
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
