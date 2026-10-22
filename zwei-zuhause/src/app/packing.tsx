import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { parentColor } from '@/components/ParentTag';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { Card, Chip, confirmDestructive, SecondaryButton, tap } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { attempt, useFamily } from '@/data/store';
import { PackingItem, ParentKey } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** Liegt bei a → bei b → unbekannt → bei a … */
const NEXT_HOLDER: Record<string, ParentKey | null> = { a: 'b', b: null, none: 'a' };

export default function Packing() {
  const t = useT();
  const p = t.family.packing;
  const { packing_items, addPackingItem, resetPacking } = useFamily();
  const { canWrite } = usePlus();
  const [label, setLabel] = useState('');
  const [recurring, setRecurring] = useState(false);

  const add = async () => {
    const text = label.trim();
    if (!text) return;
    if (await attempt(() => addPackingItem({ label: text, recurring }))) setLabel('');
  };

  const always = packing_items.filter((i) => i.recurring);
  const once = packing_items.filter((i) => !i.recurring);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>{p.intro}</Text>
        <SubscriptionBanner />

        <Group title={p.always} hint={p.alwaysHint} items={always} readOnly={!canWrite} />
        <Group title={p.once} hint={p.onceHint} items={once} readOnly={!canWrite} />

        {canWrite ? (
          <Card style={{ gap: spacing.sm }}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={p.addPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={add}
            />
            <View style={styles.addRow}>
              <Chip label={`↻ ${p.addAlways}`} tint="accent" selected={recurring} onPress={() => setRecurring(!recurring)} />
              <View style={{ flex: 1 }} />
              <SecondaryButton title={p.add} icon="add" onPress={add} />
            </View>
          </Card>
        ) : null}

        {canWrite && packing_items.some((i) => i.packed) ? (
          <SecondaryButton
            title={p.reset}
            icon="refresh"
            onPress={() => confirmDestructive(p.resetTitle, p.resetText, p.reset, () => attempt(resetPacking))}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Group({ title, hint, items, readOnly }: { title: string; hint: string; items: PackingItem[]; readOnly: boolean }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.section}>{title}</Text>
      <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
        {items.length ? (
          items.map((item, i) => <Row key={item.id} item={item} first={i === 0} readOnly={readOnly} />)
        ) : (
          <Text style={styles.empty}>{hint}</Text>
        )}
      </Card>
      {items.length ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function Row({ item, first, readOnly }: { item: PackingItem; first: boolean; readOnly: boolean }) {
  const t = useT();
  const p = t.family.packing;
  const { me, nameOf, updatePackingItem, removePackingItem } = useFamily();
  const holder = item.holder ? parentColor(item.holder) : null;
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <Pressable
        role="checkbox"
        aria-checked={item.packed}
        aria-disabled={readOnly}
        aria-label={item.label}
        disabled={readOnly}
        hitSlop={8}
        onPress={() => {
          tap();
          attempt(() => updatePackingItem(item.id, { packed: !item.packed }));
        }}
        style={styles.check}
      >
        <Ionicons
          name={item.packed ? 'checkbox' : 'square-outline'}
          size={26}
          color={item.packed ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.label, item.packed && styles.packed]}>{item.label}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={readOnly}
        onPress={() => attempt(() => updatePackingItem(item.id, { holder: NEXT_HOLDER[item.holder ?? 'none'] }))}
        style={[styles.holder, { backgroundColor: holder?.pale ?? colors.background }]}
      >
        <Text style={[styles.holderText, { color: holder?.main ?? colors.textMuted }]}>
          {item.holder ? (item.holder === me ? p.atYou : fmt(p.at, { name: nameOf(item.holder) })) : p.atNobody}
        </Text>
      </Pressable>
      {!readOnly ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={p.remove}
          hitSlop={8}
          onPress={() => attempt(() => removePackingItem(item.id))}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', paddingHorizontal: 4 },
  hint: { fontSize: 12, color: colors.textMuted, paddingHorizontal: 4 },
  empty: { fontSize: 14, color: colors.textMuted, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  check: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { flex: 1, fontSize: 16, color: colors.text },
  packed: { color: colors.textMuted, textDecorationLine: 'line-through' },
  holder: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  holderText: { fontSize: 12, fontWeight: '700' },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
