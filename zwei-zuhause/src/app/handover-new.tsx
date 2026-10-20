import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { HandoverStatus } from '@/data/types';
import { toISO, today } from '@/lib/dates';
import { HANDOVER_STATUS } from '@/lib/handovers';
import { colors, spacing } from '@/theme';

const LATE = [10, 15, 30, 45, 60, 90];

export default function HandoverNew() {
  const { addHandover } = useFamily();
  const [day, setDay] = useState(toISO(today()));
  const [status, setStatus] = useState<HandoverStatus>('on_time');
  const [minutes, setMinutes] = useState(15);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() =>
      addHandover({ day, status, minutes_late: status === 'late' ? minutes : 0, note: note.trim() }),
    );
    if (ok) router.back();
    else setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DateField label="Tag der Übergabe" value={day} onChange={setDay} maximumDate={today()} />
        <Label>Wie lief es?</Label>
        <View style={styles.chips}>
          {(Object.keys(HANDOVER_STATUS) as HandoverStatus[]).map((k) => (
            <Chip
              key={k}
              label={`${HANDOVER_STATUS[k].emoji} ${HANDOVER_STATUS[k].label}`}
              selected={status === k}
              onPress={() => setStatus(k)}
            />
          ))}
        </View>
        {status === 'late' ? (
          <>
            <Label>Wie viel später?</Label>
            <View style={styles.chips}>
              {LATE.map((m) => (
                <Chip key={m} label={`${m} Min.`} tint="accent" selected={minutes === m} onPress={() => setMinutes(m)} />
              ))}
            </View>
          </>
        ) : null}
        <Field
          label="Notiz (optional)"
          value={note}
          onChangeText={setNote}
          placeholder={status === 'missed' ? 'z. B. Kurzfristig per Nachricht abgesagt' : 'z. B. Sportsachen fehlten'}
          multiline
          maxLength={1000}
        />
        <PrimaryButton title={busy ? 'Speichere…' : 'Eintragen'} icon="checkmark" disabled={busy} onPress={save} />
        <Text style={styles.hint}>
          Einträge können nicht geändert oder gelöscht werden. Bleib bei dem, was passiert ist – ohne Bewertung.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
});
