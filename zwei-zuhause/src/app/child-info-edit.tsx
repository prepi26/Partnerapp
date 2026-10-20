import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { INFO_CATEGORIES, infoCategory } from '@/lib/childInfo';
import { spacing } from '@/theme';

export default function ChildInfoEdit() {
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const { child_info, saveChildInfo, removeChildInfo } = useFamily();
  const existing = child_info.find((i) => i.id === params.id);
  const [category, setCategory] = useState(existing?.category ?? params.category ?? 'gesundheit');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [value, setValue] = useState(existing?.value ?? '');
  const [busy, setBusy] = useState(false);

  const used = new Set(child_info.filter((i) => i.category === category).map((i) => i.label));
  const suggestions = infoCategory(category).suggestions.filter((s) => !used.has(s));

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() =>
      saveChildInfo({ id: existing?.id, category, label: label.trim(), value: value.trim() }),
    );
    if (ok) router.back();
    else setBusy(false);
  };

  const remove = () =>
    existing &&
    confirmDestructive('Eintrag löschen?', `„${existing.label}“ wird für euch beide gelöscht.`, 'Löschen', () => {
      attempt(() => removeChildInfo(existing.id)).then((ok) => ok && router.back());
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label>Bereich</Label>
        <View style={styles.chips}>
          {INFO_CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={`${c.emoji} ${c.label}`}
              selected={category === c.key}
              onPress={() => setCategory(c.key)}
            />
          ))}
        </View>
        <Field label="Was?" value={label} onChangeText={setLabel} placeholder="z. B. Kinderarzt" maxLength={100} />
        {!existing && suggestions.length ? (
          <View style={styles.chips}>
            {suggestions.map((s) => (
              <Chip key={s} label={s} tint="accent" selected={label === s} onPress={() => setLabel(s)} />
            ))}
          </View>
        ) : null}
        <Field
          label="Angabe"
          value={value}
          onChangeText={setValue}
          placeholder="z. B. Dr. Weber, Hauptstr. 5, 0221 123456"
          multiline
          maxLength={2000}
        />
        <PrimaryButton title={busy ? 'Speichere…' : 'Speichern'} icon="checkmark" disabled={busy || !label.trim()} onPress={save} />
        {existing ? <SecondaryButton title="Löschen" icon="trash-outline" danger onPress={remove} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
