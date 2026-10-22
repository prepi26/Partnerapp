import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { addDays, toISO, today } from '@/lib/dates';
import { decisionCategories, decisionCategory } from '@/lib/decisions';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

export default function DecisionNew() {
  const t = useT();
  const { otherName, addDecision } = useFamily();
  const [category, setCategory] = useState('schule');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [withDue, setWithDue] = useState(false);
  const [due, setDue] = useState(toISO(addDays(today(), 7)));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() =>
      addDecision({ category, title: title.trim(), details: details.trim(), due_date: withDue ? due : null }),
    );
    if (ok) close();
    else setBusy(false);
  };

  const examples = decisionCategory(category, t).examples;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label>{t.family.decisionNew.topic}</Label>
        <View style={styles.chips}>
          {decisionCategories(t).map((c) => (
            <Chip
              key={c.key}
              label={`${c.emoji} ${c.label}`}
              selected={category === c.key}
              onPress={() => setCategory(c.key)}
            />
          ))}
        </View>
        {examples ? <Text style={styles.hint}>{fmt(t.family.examples, { examples })}</Text> : null}
        <Field
          label={t.family.decisionNew.titleLabel}
          value={title}
          onChangeText={setTitle}
          placeholder={t.family.decisionNew.titlePlaceholder}
          maxLength={200}
        />
        <Field
          label={t.family.decisionNew.details}
          value={details}
          onChangeText={setDetails}
          placeholder={t.family.decisionNew.detailsPlaceholder}
          multiline
          maxLength={4000}
        />
        <View style={styles.chips}>
          <Chip label={t.family.decisionNew.noDue} selected={!withDue} onPress={() => setWithDue(false)} />
          <Chip label={t.family.decisionNew.withDue} tint="accent" selected={withDue} onPress={() => setWithDue(true)} />
        </View>
        {withDue ? <DateField label={t.family.decisionNew.dueLabel} value={due} onChange={setDue} minimumDate={today()} /> : null}
        <PrimaryButton
          title={busy ? t.common.sending : fmt(t.family.decisionNew.send, { name: otherName })}
          icon="send"
          disabled={busy || !title.trim()}
          onPress={save}
        />
        <Text style={styles.hint}>{t.family.decisionNew.tip}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
});
