import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { WriteGate } from '@/components/SubscriptionBanner';
import { Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { infoCategories, infoCategory } from '@/lib/childInfo';
import { close } from '@/lib/nav';
import { spacing } from '@/theme';

export default function ChildInfoEdit() {
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const t = useT();
  const { child_info, saveChildInfo, removeChildInfo } = useFamily();
  const existing = child_info.find((i) => i.id === params.id);
  const [category, setCategory] = useState(existing?.category ?? params.category ?? 'gesundheit');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [value, setValue] = useState(existing?.value ?? '');
  const [busy, setBusy] = useState(false);

  const used = new Set(child_info.filter((i) => i.category === category).map((i) => i.label));
  const suggestions = infoCategory(category, t).suggestions.filter((s) => !used.has(s));

  const save = async () => {
    setBusy(true);
    const ok = await attempt(() =>
      saveChildInfo({ id: existing?.id, category, label: label.trim(), value: value.trim() }),
    );
    if (ok) close();
    else setBusy(false);
  };

  const remove = () =>
    existing &&
    confirmDestructive(
      t.family.childInfoEdit.deleteTitle,
      fmt(t.family.childInfoEdit.deleteText, { label: existing.label }),
      t.common.delete,
      () => {
        attempt(() => removeChildInfo(existing.id)).then((ok) => ok && close());
      },
    );

  return (
    <WriteGate>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Label>{t.family.childInfoEdit.area}</Label>
          <View style={styles.chips}>
            {infoCategories(t).map((c) => (
              <Chip
                key={c.key}
                label={`${c.emoji} ${c.label}`}
                selected={category === c.key}
                onPress={() => setCategory(c.key)}
              />
            ))}
          </View>
          <Field
            label={t.family.childInfoEdit.what}
            value={label}
            onChangeText={setLabel}
            placeholder={t.family.childInfoEdit.whatPlaceholder}
            maxLength={100}
          />
          {!existing && suggestions.length ? (
            <View style={styles.chips}>
              {suggestions.map((s) => (
                <Chip key={s} label={s} tint="accent" selected={label === s} onPress={() => setLabel(s)} />
              ))}
            </View>
          ) : null}
          <Field
            label={t.family.childInfoEdit.value}
            value={value}
            onChangeText={setValue}
            placeholder={t.family.childInfoEdit.valuePlaceholder}
            multiline
            maxLength={2000}
          />
          <PrimaryButton
            title={busy ? t.common.saving : t.common.save}
            icon="checkmark"
            disabled={busy || !label.trim()}
            onPress={save}
          />
          {existing ? <SecondaryButton title={t.common.delete} icon="trash-outline" danger onPress={remove} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </WriteGate>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
});
