import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { DateField } from '@/components/DateField';
import { Field, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { useT } from '@/i18n';
import { toISO, today } from '@/lib/dates';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

export default function JournalNew() {
  const t = useT();
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
        <DateField label={t.messages.journalNew.when} value={day} onChange={setDay} maximumDate={today()} />
        <Field
          label={t.messages.journalNew.what}
          value={text}
          onChangeText={setText}
          placeholder={t.messages.journalNew.placeholder}
          multiline
          maxLength={8000}
          style={{ minHeight: 180 }}
        />
        <PrimaryButton title={busy ? t.common.saving : t.common.save} icon="lock-closed" disabled={busy || !text.trim()} onPress={save} />
        <Text style={styles.hint}>{t.messages.journalNew.tip}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center' },
});
