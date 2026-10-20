import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { addDays, toISO, today } from '@/lib/dates';
import { DECISION_CATEGORIES, decisionCategory } from '@/lib/decisions';
import { colors, spacing } from '@/theme';

export default function DecisionNew() {
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
    if (ok) router.back();
    else setBusy(false);
  };

  const examples = decisionCategory(category).examples;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label>Thema</Label>
        <View style={styles.chips}>
          {DECISION_CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={`${c.emoji} ${c.label}`}
              selected={category === c.key}
              onPress={() => setCategory(c.key)}
            />
          ))}
        </View>
        {examples ? <Text style={styles.hint}>z. B. {examples}</Text> : null}
        <Field
          label="Worum geht es?"
          value={title}
          onChangeText={setTitle}
          placeholder="z. B. Klassenfahrt nach Italien im Mai"
          maxLength={200}
        />
        <Field
          label="Details"
          value={details}
          onChangeText={setDetails}
          placeholder="Was, wann, wie viel kostet es, was spricht dafür?"
          multiline
          maxLength={4000}
        />
        <View style={styles.chips}>
          <Chip label="Ohne Frist" selected={!withDue} onPress={() => setWithDue(false)} />
          <Chip label="Antwort bis …" tint="accent" selected={withDue} onPress={() => setWithDue(true)} />
        </View>
        {withDue ? <DateField label="Antwort erbeten bis" value={due} onChange={setDue} minimumDate={today()} /> : null}
        <PrimaryButton
          title={busy ? 'Sende…' : `An ${otherName} senden`}
          icon="send"
          disabled={busy || !title.trim()}
          onPress={save}
        />
        <Text style={styles.hint}>
          Tipp: Schreib sachlich, was du vorschlägst und warum. Ein Vorschlag mit Begründung wird eher angenommen als
          eine Forderung.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
});
