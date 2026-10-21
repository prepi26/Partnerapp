import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { parentColor } from '@/components/ParentTag';
import { Card, Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ParentKey, ScheduleModel } from '@/data/types';
import { addDays, parseISO, WEEKDAYS_SHORT } from '@/lib/dates';
import { MODELS, normalizeTime, plannedParent } from '@/lib/schedule';
import { close } from '@/lib/nav';
import { colors, radius, spacing } from '@/theme';

const TIMES = ['08:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export default function Schedule() {
  const { family, nameOf, otherJoined, otherName, updateFamily } = useFamily();
  const [model, setModel] = useState<ScheduleModel>(family.schedule_model);
  const [start, setStart] = useState(family.schedule_start);
  const [first, setFirst] = useState<ParentKey>(family.schedule_first);
  const [time, setTime] = useState(family.handover_time);
  const [place, setPlace] = useState(family.handover_place);
  const cleanTime = normalizeTime(time);
  const [busy, setBusy] = useState(false);

  const draft = { ...family, schedule_model: model, schedule_start: start, schedule_first: first };
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
        handover_time: cleanTime ?? '',
        handover_place: place.trim(),
      }),
    );
    if (ok) close();
    else setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={{ gap: spacing.sm }}>
        {MODELS.map((m) => {
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
          <DateField label="Plan beginnt am" value={start} onChange={setStart} />
          <Label>An diesem Tag ist das Kind bei</Label>
          <View style={styles.chips}>
            <Chip label={nameOf('a')} selected={first === 'a'} onPress={() => setFirst('a')} />
            <Chip label={nameOf('b')} tint="accent" selected={first === 'b'} onPress={() => setFirst('b')} />
          </View>
          {model === 'residenz_we' ? (
            <Text style={styles.hint}>
              Wähle als Start einen Montag. Das Wochenende dieser Woche (Fr–So) ist beim anderen Elternteil.
            </Text>
          ) : null}

          <Card style={{ gap: 4 }}>
            <Label>Vorschau</Label>
            <View style={styles.week}>
              {WEEKDAYS_SHORT.map((d) => (
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
        <Label>Übergabe – wann und wo?</Label>
        <View style={styles.chips}>
          {TIMES.map((t) => (
            <Chip key={t} label={t} tint="accent" selected={cleanTime === t} onPress={() => setTime(t)} />
          ))}
        </View>
        <Field
          label="Uhrzeit"
          value={time}
          onChangeText={setTime}
          placeholder="z. B. 17:00"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        {cleanTime === null ? <Text style={styles.error}>Bitte als Uhrzeit eingeben, z. B. 17:00.</Text> : null}
        <Field
          label="Ort"
          value={place}
          onChangeText={setPlace}
          placeholder="z. B. Kita Sonnenschein, Schule, vor der Haustür"
          maxLength={200}
        />
        <Text style={styles.hint}>
          Neutrale Orte wie Kita oder Schule entlasten das Kind – es muss sich nicht vor beiden Eltern verabschieden.
        </Text>
      </Card>

      <PrimaryButton
        title={busy ? 'Speichere…' : 'Plan speichern'}
        icon="checkmark"
        disabled={busy || cleanTime === null}
        onPress={save}
      />
      <Text style={styles.hint}>
        {otherJoined
          ? `Der Plan gilt für euch beide. ${otherName} sieht die Änderung sofort.`
          : `Sobald ${otherName} verbunden ist, gilt derselbe Plan auf beiden Handys.`}{' '}
        Einzelne Tage ändert ihr im Kalender per Tauschvorschlag.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
