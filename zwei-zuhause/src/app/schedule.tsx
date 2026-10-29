import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { parentColor } from '@/components/ParentTag';
import { Card, Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ParentKey, ScheduleModel } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { addDays, parseISO } from '@/lib/dates';
import { DEFAULT_CUSTOM_PATTERN, models, normalizeTime, plannedParent } from '@/lib/schedule';
import { close } from '@/lib/nav';
import { colors, radius, spacing } from '@/theme';

const TIMES = ['08:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export default function Schedule() {
  const t = useT();
  const { family, nameOf, otherJoined, otherName, updateFamily } = useFamily();
  const [model, setModel] = useState<ScheduleModel>(family.schedule_model);
  const [start, setStart] = useState(family.schedule_start);
  const [first, setFirst] = useState<ParentKey>(family.schedule_first);
  // Eigener Rhythmus: je Tag 'a' oder 'b', ab dem Starttag, 1–4 Wochen.
  const [pattern, setPattern] = useState(family.schedule_pattern || DEFAULT_CUSTOM_PATTERN);
  const [time, setTime] = useState(family.handover_time);
  const [place, setPlace] = useState(family.handover_place);
  const cleanTime = normalizeTime(time);
  const [busy, setBusy] = useState(false);

  const draft = { ...family, schedule_model: model, schedule_start: start, schedule_first: first, schedule_pattern: pattern };
  const startDate = parseISO(start);
  // Vorschau: zwei Wochen ab dem Montag der Startwoche.
  const monday = addDays(startDate, -((startDate.getDay() + 6) % 7));
  const preview = [0, 1].map((w) => [...Array(7)].map((_, d) => addDays(monday, w * 7 + d)));

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() =>
      updateFamily({
        schedule_model: model,
        schedule_start: start,
        schedule_first: first,
        schedule_pattern: model === 'custom' ? pattern : '',
        handover_time: cleanTime ?? '',
        handover_place: place.trim(),
      }),
    );
    if (ok) close();
    else setBusy(false);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: spacing.sm }}>
          {models(t).map((m) => {
            const chosen = m.key === model;
            return (
              <Pressable
                key={m.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: chosen }}
                onPress={() => setModel(m.key)}
                style={[styles.option, chosen && styles.optionChosen]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{m.title}</Text>
                  <Text style={styles.optionText}>{m.text}</Text>
                </View>
                <Ionicons
                  name={chosen ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={chosen ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>

        {model !== 'none' ? (
          <>
            <DateField label={t.calendar.schedule.start} value={start} onChange={setStart} />
            {model === 'custom' ? (
              <CustomRhythm start={startDate} pattern={pattern} onChange={setPattern} />
            ) : (
              <>
                <Label>{t.calendar.schedule.firstParent}</Label>
                <View style={styles.chips}>
                  <Chip label={nameOf('a')} selected={first === 'a'} onPress={() => setFirst('a')} />
                  <Chip label={nameOf('b')} tint="accent" selected={first === 'b'} onPress={() => setFirst('b')} />
                </View>
              </>
            )}
            {model === 'residenz_we' ? (
              <Text style={styles.hint}>{t.calendar.schedule.residenzHint}</Text>
            ) : null}

            <Card style={{ gap: 4 }}>
              <Label>{t.calendar.schedule.preview}</Label>
              <View style={styles.week}>
                {t.common.dates.weekdaysShort.map((d) => (
                  <Text key={d} style={styles.weekday}>
                    {d}
                  </Text>
                ))}
              </View>
              {preview.map((week, i) => (
                <View key={i} style={styles.week}>
                  {week.map((day, j) => {
                    const p = plannedParent(draft, day);
                    const c = parentColor(p);
                    return (
                      <View key={j} style={[styles.cell, { backgroundColor: c.pale }]}>
                        <Text style={[styles.cellText, { color: c.main }]}>{day.getDate()}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </Card>
          </>
        ) : null}

        <Card style={{ gap: spacing.md }}>
          <Label>{t.calendar.schedule.handover}</Label>
          <View style={styles.chips}>
            {TIMES.map((slot) => (
              <Chip key={slot} label={slot} tint="accent" selected={cleanTime === slot} onPress={() => setTime(slot)} />
            ))}
          </View>
          <Field
            label={t.calendar.schedule.time}
            value={time}
            onChangeText={setTime}
            placeholder={t.calendar.schedule.timePlaceholder}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          {cleanTime === null ? <Text style={styles.error}>{t.calendar.schedule.timeError}</Text> : null}
          <Field
            label={t.calendar.schedule.place}
            value={place}
            onChangeText={setPlace}
            placeholder={t.calendar.schedule.placePlaceholder}
            maxLength={200}
          />
          <Text style={styles.hint}>{t.calendar.schedule.placeHint}</Text>
        </Card>

        <PrimaryButton
          title={busy ? t.common.saving : t.calendar.schedule.save}
          icon="checkmark"
          disabled={busy || cleanTime === null}
          onPress={save}
        />
        <Text style={styles.hint}>
          {otherJoined
            ? fmt(t.calendar.schedule.sharedJoined, { name: otherName })
            : fmt(t.calendar.schedule.sharedNotJoined, { name: otherName })}{' '}
          {t.calendar.schedule.singleDays}
        </Text>
      </ScrollView>
    </>
  );
}

/** Eigener Rhythmus: Tage ab dem Starttag antippen, um sie dem anderen Elternteil zu geben. */
function CustomRhythm({ start, pattern, onChange }: { start: Date; pattern: string; onChange: (p: string) => void }) {
  const t = useT();
  const { nameOf } = useFamily();
  const weeks = pattern.length / 7;
  // Länge ändern: vorhandene Wochen behalten, neue Wochen wiederholen den Anfang.
  const resize = (n: number) => onChange(Array.from({ length: n * 7 }, (_, i) => pattern[i % pattern.length]).join(''));
  const toggle = (i: number) => onChange(pattern.slice(0, i) + (pattern[i] === 'a' ? 'b' : 'a') + pattern.slice(i + 1));

  return (
    <Card style={{ gap: spacing.sm }}>
      <Label>{t.calendar.schedule.customLength}</Label>
      <View style={styles.chips}>
        {[1, 2, 3, 4].map((n) => (
          <Chip
            key={n}
            label={n === 1 ? t.calendar.schedule.customWeeksOne : fmt(t.calendar.schedule.customWeeksOther, { n })}
            tint="accent"
            selected={weeks === n}
            onPress={() => resize(n)}
          />
        ))}
      </View>
      {[...Array(weeks)].map((_, w) => (
        <View key={w} style={styles.week}>
          {[...Array(7)].map((__, d) => {
            const i = w * 7 + d;
            const day = addDays(start, i);
            const key = pattern[i] as ParentKey;
            const c = parentColor(key);
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityLabel={`${t.common.dates.weekdaysShort[(day.getDay() + 6) % 7]} ${day.getDate()}: ${nameOf(key)}`}
                onPress={() => toggle(i)}
                style={[styles.cell, { backgroundColor: c.pale }]}
              >
                <Text style={styles.cellDay}>{t.common.dates.weekdaysShort[(day.getDay() + 6) % 7]}</Text>
                <Text style={[styles.cellText, { color: c.main }]}>{nameOf(key).slice(0, 1).toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text style={styles.hint}>{t.calendar.schedule.customHint}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  cellDay: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optionChosen: { borderColor: colors.primary },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionText: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  error: { fontSize: 13, color: colors.danger, fontWeight: '600' },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
  week: { flexDirection: 'row', gap: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textMuted },
  cell: { flex: 1, aspectRatio: 1.2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 14, fontWeight: '700' },
});
