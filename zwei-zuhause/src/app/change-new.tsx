import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { ParentTag } from '@/components/ParentTag';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ParentKey } from '@/data/types';
import { addDays, parseISO, toISO, today } from '@/lib/dates';
import { acceptedChanges, dayInfo, other } from '@/lib/schedule';
import { colors, spacing } from '@/theme';

const MAX_DAYS = 42;

export default function ChangeNew() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { family, me, nameOf, otherName, otherJoined, schedule_changes, proposeChanges } = useFamily();
  const [day, setDay] = useState(params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : toISO(today()));
  const accepted = useMemo(() => acceptedChanges(schedule_changes), [schedule_changes]);
  const current = dayInfo(family, accepted, new Map(), parseISO(day)).parent;
  const [parent, setParent] = useState<ParentKey>(current ? other(current) : me);
  const [note, setNote] = useState('');
  // Mehrere Tage am Stück, z. B. Ferien oder eine Dienstreise.
  const [range, setRange] = useState(false);
  const [until, setUntil] = useState(day);
  const days = useMemo(() => {
    if (!range) return [day];
    const list: string[] = [];
    for (let d = parseISO(day); toISO(d) <= until && list.length < MAX_DAYS; d = addDays(d, 1)) list.push(toISO(d));
    return list;
  }, [day, range, until]);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() => proposeChanges({ days, parent, note: note.trim() }));
    if (ok) router.back();
    else setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          <Chip label="Ein Tag" selected={!range} onPress={() => setRange(false)} />
          <Chip label="Zeitraum (z. B. Ferien)" tint="accent" selected={range} onPress={() => setRange(true)} />
        </View>
        <DateField
          label={range ? 'Von' : 'Tag'}
          value={day}
          onChange={(d) => {
            setDay(d);
            if (until < d) setUntil(d);
          }}
        />
        {range ? (
          <>
            <DateField label="Bis einschließlich" value={until} onChange={setUntil} minimumDate={parseISO(day)} />
            <Text style={styles.text}>
              {days.length} {days.length === 1 ? 'Tag' : 'Tage'}
              {days.length >= MAX_DAYS ? ` (höchstens ${MAX_DAYS} auf einmal)` : ''}
            </Text>
          </>
        ) : null}
        <View style={{ gap: spacing.xs }}>
          <Label>Laut Plan</Label>
          {current ? (
            <ParentTag parent={current} name={current === me ? 'bei dir' : `bei ${nameOf(current)}`} />
          ) : (
            <Text style={styles.text}>Kein Plan für diesen Tag</Text>
          )}
        </View>
        <Label>Das Kind soll sein bei</Label>
        <View style={styles.chips}>
          <Chip label="mir" selected={parent === me} onPress={() => setParent(me)} />
          <Chip label={otherName} tint="accent" selected={parent !== me} onPress={() => setParent(other(me))} />
        </View>
        <Field
          label="Begründung (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="z. B. Geburtstag der Oma, Dienstreise"
          multiline
          maxLength={500}
        />
        <PrimaryButton
          title={busy ? 'Sende…' : otherJoined ? 'Vorschlag senden' : 'Eintragen'}
          icon="send"
          disabled={busy || (!range && parent === current) || days.length === 0}
          onPress={save}
        />
        <Text style={styles.text}>
          {otherJoined
            ? `${otherName} muss zustimmen. Erst dann gilt die Änderung – beides wird mit Datum festgehalten.`
            : `Solange ${otherName} nicht verbunden ist, kannst du den Vorschlag selbst annehmen.`}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  text: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
