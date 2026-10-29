import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, Label, SecondaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { formatShort, parseISO, toISO, today } from '@/lib/dates';
import { holidayDays, holidayName, REGIONS_AT, REGIONS_DE, upcomingHolidays } from '@/lib/holidays';
import { acceptedChanges, dayInfo } from '@/lib/schedule';
import { colors, spacing } from '@/theme';

export default function Holidays() {
  const t = useT();
  const h = t.calendar.holidays;
  const { family, nameOf, schedule_changes, updateFamily } = useFamily();
  const region = family.school_state;
  const accepted = useMemo(() => acceptedChanges(schedule_changes), [schedule_changes]);
  const list = region ? upcomingHolidays(region, toISO(today())).slice(0, 8) : [];

  const choose = (code: string) => attempt(() => updateFamily({ school_state: code }));
  const now = toISO(today());

  // Ist ein Bundesland gewählt, stehen die Ferien oben und die Auswahl darunter.
  const upcoming = (
    <>
      {list.length ? <Text style={styles.section}>{h.upcoming}</Text> : null}
      {list.map((holiday) => {
        const days = holidayDays(holiday);
        const counts = { a: 0, b: 0 };
        for (const d of days) {
          const p = dayInfo(family, accepted, new Map(), parseISO(d)).parent;
          if (p) counts[p]++;
        }
        return (
          <Card key={holiday.start} style={{ gap: 4 }}>
            <Text style={styles.title}>{holidayName(holiday.kind, t)}</Text>
            <Text style={styles.text}>
              {days.length === 1
                ? fmt(h.rangeOne, { from: formatShort(holiday.start, t) })
                : fmt(h.range, { from: formatShort(holiday.start, t), to: formatShort(holiday.end, t), n: days.length })}
            </Text>
            {family.schedule_model !== 'none' ? (
              <Text style={styles.small}>
                {fmt(h.split, { a: nameOf('a'), b: nameOf('b'), na: counts.a, nb: counts.b })}
              </Text>
            ) : null}
            {holiday.start > now ? (
              <View style={{ marginTop: spacing.xs }}>
                <SecondaryButton
                  title={h.propose}
                  icon="swap-horizontal"
                  onPress={() =>
                    router.push({ pathname: '/change-new', params: { day: holiday.start, until: holiday.end } })
                  }
                />
              </View>
            ) : null}
          </Card>
        );
      })}

    </>
  );
  const chooser = (
    <>
      <Label>{h.region}</Label>
      <Text style={styles.small}>{h.regionHint}</Text>
      {[
        { title: h.germany, regions: REGIONS_DE },
        { title: h.austria, regions: REGIONS_AT },
      ].map((group) => (
        <View key={group.title} style={{ gap: spacing.xs }}>
          <Text style={styles.country}>{group.title}</Text>
          <View style={styles.chips}>
            {group.regions.map((r) => (
              <Chip key={r.code} label={r.name} selected={region === r.code} onPress={() => choose(r.code)} />
            ))}
          </View>
        </View>
      ))}
      {region ? <Chip label={h.none} tint="accent" selected={false} onPress={() => choose('')} /> : null}

    </>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{h.hint}</Text>

      {region ? upcoming : null}
      {chooser}
      <Text style={styles.source}>{h.source}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  small: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  country: { fontSize: 13, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: 8 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.text },
  source: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16, marginTop: spacing.md },
});
