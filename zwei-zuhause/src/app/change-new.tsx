import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { ParentTag } from '@/components/ParentTag';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ParentKey } from '@/data/types';
import { parseISO, toISO, today } from '@/lib/dates';
import { acceptedChanges, dayInfo, other } from '@/lib/schedule';
import { colors, spacing } from '@/theme';

export default function ChangeNew() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { family, me, nameOf, otherName, otherJoined, schedule_changes, proposeChange } = useFamily();
  const [day, setDay] = useState(params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : toISO(today()));
  const accepted = useMemo(() => acceptedChanges(schedule_changes), [schedule_changes]);
  const current = dayInfo(family, accepted, new Map(), parseISO(day)).parent;
  const [parent, setParent] = useState<ParentKey>(current ? other(current) : me);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() => proposeChange({ day, parent, note: note.trim() }));
    if (ok) router.back();
    else setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DateField label="Tag" value={day} onChange={setDay} />
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
          disabled={busy || parent === current}
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
