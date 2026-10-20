import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, SecondaryButton } from '@/components/ui';
import { attempt } from '@/data/store';
import { spacing } from '@/theme';

/** Zustimmen oder ablehnen – optional mit kurzer Begründung, die mit festgehalten wird. */
export function AnswerBox({
  yes,
  no,
  onAnswer,
  placeholder = 'Begründung (optional)',
}: {
  yes: string;
  no: string;
  onAnswer: (accept: boolean, note: string) => Promise<void>;
  placeholder?: string;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const answer = async (accept: boolean) => {
    setBusy(true);
    await attempt(() => onAnswer(accept, note.trim()));
    setBusy(false);
  };
  return (
    <View style={styles.box}>
      <Field label="Deine Antwort" value={note} onChangeText={setNote} placeholder={placeholder} maxLength={1000} />
      <View style={styles.buttons}>
        <View style={{ flex: 1 }}>
          <SecondaryButton title={yes} icon="checkmark" onPress={() => !busy && answer(true)} />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton title={no} icon="close" danger onPress={() => !busy && answer(false)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm, marginTop: spacing.sm },
  buttons: { flexDirection: 'row', gap: spacing.sm },
});
