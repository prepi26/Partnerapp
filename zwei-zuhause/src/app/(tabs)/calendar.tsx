import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { parentColor, ParentTag } from '@/components/ParentTag';
import { Card, GradientHeader, HeaderIcon, SecondaryButton, tap } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ISODate, ScheduleChange } from '@/data/types';
import { formatTimestamp, formatWeekday, MONTHS, toISO, today, WEEKDAYS_SHORT } from '@/lib/dates';
import { acceptedChanges, dayInfo, MODELS } from '@/lib/schedule';
import { colors, radius, spacing } from '@/theme';

export default function Calendar() {
  const { family, me, nameOf, schedule_changes, userId, otherJoined, answerChange, withdrawChange } = useFamily();
  const now = today();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));

  const accepted = useMemo(() => acceptedChanges(schedule_changes), [schedule_changes]);
  const proposals = useMemo(() => {
    const map = new Map<ISODate, ScheduleChange>();
    for (const c of schedule_changes) if (c.status === 'proposed') map.set(c.day, c);
    return map;
  }, [schedule_changes]);

  const weeks = useMemo(() => {
    // Wochen beginnen am Montag.
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [...Array(lead).fill(null)];
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (cells.length % 7) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const open = schedule_changes.filter((c) => c.status === 'proposed');
  const answered = schedule_changes
    .filter((c) => c.status !== 'proposed')
    .sort((x, y) => (y.answered_at ?? '').localeCompare(x.answered_at ?? ''))
    .slice(0, 10);

  const model = MODELS.find((m) => m.key === family.schedule_model);
  const todayIso = toISO(now);

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader
        title="Kalender"
        subtitle={model?.title}
        right={<HeaderIcon icon="options-outline" label="Umgangsplan" onPress={() => router.push('/schedule')} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ gap: spacing.sm }}>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voriger Monat"
              hitSlop={10}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[month.getMonth()]} {month.getFullYear()}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nächster Monat"
              hitSlop={10}
              onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.week}>
            {WEEKDAYS_SHORT.map((d) => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>
          {weeks.map((week, i) => (
            <View key={i} style={styles.week}>
              {week.map((day, j) => {
                if (!day) return <View key={j} style={styles.cell} />;
                const info = dayInfo(family, accepted, proposals, day);
                const c = parentColor(info.parent);
                const iso = toISO(day);
                return (
                  <Pressable
                    key={j}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatWeekday(day)}: ${info.parent ? nameOf(info.parent) : 'nicht eingetragen'}`}
                    onPress={() => {
                      tap();
                      router.push({ pathname: '/change-new', params: { day: iso } });
                    }}
                    style={[
                      styles.cell,
                      styles.day,
                      { backgroundColor: c.pale },
                      iso === todayIso && styles.today,
                      info.proposal && styles.proposed,
                    ]}
                  >
                    <Text style={[styles.dayText, { color: info.parent ? c.main : colors.textMuted }]}>
                      {day.getDate()}
                    </Text>
                    {info.change ? <View style={[styles.marker, { backgroundColor: c.main }]} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={styles.legend}>
            <ParentTag parent="a" name={nameOf('a')} />
            <ParentTag parent="b" name={nameOf('b')} />
          </View>
          <Text style={styles.hint}>
            Tipp auf einen Tag, um einen Tausch vorzuschlagen. Punkt = vereinbarte Ausnahme, Rahmen = offener Vorschlag.
          </Text>
        </Card>

        {open.length ? <Text style={styles.section}>Offene Vorschläge</Text> : null}
        {open.map((c) => {
          const mine = c.created_by === userId;
          const canAnswer = !mine || !otherJoined;
          return (
            <Card key={c.id} style={styles.item}>
              <Text style={styles.itemTitle}>{formatWeekday(c.day)}</Text>
              <Text style={styles.itemText}>
                {mine ? 'Du schlägst vor' : 'Vorschlag'}: Kind bei {c.parent === me ? 'dir' : nameOf(c.parent)}
                {c.note ? ` – „${c.note}“` : ''}
              </Text>
              <Text style={styles.meta}>Gestellt am {formatTimestamp(c.created_at)}</Text>
              <View style={styles.buttons}>
                {canAnswer ? (
                  <>
                    <View style={{ flex: 1 }}>
                      <SecondaryButton
                        title="Annehmen"
                        icon="checkmark"
                        onPress={() => attempt(() => answerChange(c.id, true))}
                      />
                    </View>
                    {!mine ? (
                      <View style={{ flex: 1 }}>
                        <SecondaryButton
                          title="Ablehnen"
                          icon="close"
                          danger
                          onPress={() => attempt(() => answerChange(c.id, false))}
                        />
                      </View>
                    ) : null}
                  </>
                ) : null}
                {mine ? (
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      title="Zurückziehen"
                      icon="arrow-undo"
                      danger
                      onPress={() => attempt(() => withdrawChange(c.id))}
                    />
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })}

        {answered.length ? <Text style={styles.section}>Zuletzt beantwortet</Text> : null}
        {answered.map((c) => (
          <View key={c.id} style={styles.row}>
            <Ionicons
              name={c.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={c.status === 'accepted' ? colors.primary : colors.danger}
            />
            <Text style={styles.rowText}>
              {formatWeekday(c.day)}: bei {nameOf(c.parent)} – {c.status === 'accepted' ? 'angenommen' : 'abgelehnt'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  monthTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  week: { flexDirection: 'row', gap: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  cell: { flex: 1, aspectRatio: 1 },
  day: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 2, borderColor: colors.text },
  proposed: { borderWidth: 2, borderColor: colors.warning, borderStyle: 'dashed' },
  dayText: { fontSize: 15, fontWeight: '700' },
  marker: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xs },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: 8 },
  item: { gap: 4 },
  itemTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  itemText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  meta: { fontSize: 12, color: colors.textMuted },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingHorizontal: 4 },
  rowText: { flex: 1, fontSize: 14, color: colors.text },
});
