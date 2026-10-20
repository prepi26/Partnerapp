import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { DateField } from '@/components/DateField';
import { Field, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

export default function JournalNew() {
  const { addJournal } = useFamily();
  const [day, setDay] = useState(toISO(today()));
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() => addJournal({ day, text: text.trim() }));
    if (ok) close();
    else setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <DateField label="Wann war es?" value={day} onChange={setDay} maximumDate={today()} />
        <Field
          label="Was ist passiert?"
          value={text}
          onChangeText={setText}
          placeholder="z. B. Übergabe 30 Minuten zu spät, Mia war danach sehr still."
          multiline
          maxLength={8000}
          style={{ minHeight: 180 }}
        />
        <PrimaryButton title={busy ? 'Speichere…' : 'Speichern'} icon="lock-closed" disabled={busy || !text.trim()} onPress={save} />
        <Text style={styles.hint}>
          Tipp: Beschreibe, was du gesehen und gehört hast – nicht, was du vermutest. Das macht deine Notizen glaubwürdig.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
});
