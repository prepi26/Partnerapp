import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { WriteGate } from '@/components/SubscriptionBanner';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { HandoverStatus } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { toISO, today } from '@/lib/dates';
import { HANDOVER_EMOJI, HANDOVER_KEYS } from '@/lib/handovers';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

const LATE = [10, 15, 30, 45, 60, 90];

export default function HandoverNew() {
  const t = useT();
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
    if (ok) close();
    else setBusy(false);
  };

  return (
    <WriteGate>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <DateField label={t.calendar.handoverNew.day} value={day} onChange={setDay} maximumDate={today()} />
          <Label>{t.calendar.handoverNew.how}</Label>
          <View style={styles.chips}>
            {HANDOVER_KEYS.map((k) => (
              <Chip
                key={k}
                label={`${HANDOVER_EMOJI[k]} ${t.lib.handoverStatus[k]}`}
                selected={status === k}
                onPress={() => setStatus(k)}
              />
            ))}
          </View>
          {status === 'late' ? (
            <>
              <Label>{t.calendar.handoverNew.howLate}</Label>
              <View style={styles.chips}>
                {LATE.map((m) => (
                  <Chip
                    key={m}
                    label={fmt(t.lib.handoverStatus.minutes, { n: m })}
                    tint="accent"
                    selected={minutes === m}
                    onPress={() => setMinutes(m)}
                  />
                ))}
              </View>
            </>
          ) : null}
          <Field
            label={t.calendar.handoverNew.noteLabel}
            value={note}
            onChangeText={setNote}
            placeholder={status === 'missed' ? t.calendar.handoverNew.notePlaceholderMissed : t.calendar.handoverNew.notePlaceholder}
            multiline
            maxLength={1000}
          />
          <PrimaryButton title={busy ? t.common.saving : t.calendar.handoverNew.enter} icon="checkmark" disabled={busy} onPress={save} />
          <Text style={styles.hint}>{t.calendar.handoverNew.hint}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </WriteGate>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
});
