import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, tap } from '@/components/ui';
import { attempt, FamilyOverview, useFamily } from '@/data/store';
import { Family } from '@/data/types';
import { Dict, fmt, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** „Mia · mit Thomas“ – so heißt eine Familie aus Sicht des eingeloggten Elternteils. */
export function familyLabel(f: Pick<Family, 'children' | 'name_a' | 'name_b'>, myKey: 'a' | 'b', t: Dict) {
  return fmt(t.home.families.label, {
    children: f.children.trim() || t.common.theChild,
    name: myKey === 'a' ? f.name_b : f.name_a,
  });
}

/** Wechsel zwischen den eigenen Familien (nur sichtbar, wenn es mehr als eine gibt). */
export function FamilySwitcher() {
  const t = useT();
  const { family, families, userId, switchFamily } = useFamily();
  const [open, setOpen] = useState(false);
  if (families.length < 2) return null;
  const keyOf = (f: Family) => (f.parent_b === userId ? 'b' : 'a');

  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.home.families.switchTitle}
        onPress={() => {
          tap();
          setOpen(!open);
        }}
        style={({ pressed }) => [styles.current, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="people" size={18} color={colors.primary} />
        <Text style={styles.currentText} numberOfLines={1}>
          {familyLabel(family, keyOf(family), t)}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
      </Pressable>
      {open ? (
        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          {families.map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                attempt(() => switchFamily(f.id));
              }}
              style={styles.row}
            >
              <Ionicons
                name={f.id === family.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={f.id === family.id ? colors.primary : colors.textMuted}
              />
              <Text style={styles.rowText}>{familyLabel(f, keyOf(f), t)}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setOpen(false);
              router.push('/family-new');
            }}
            style={styles.row}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowText, { color: colors.primary, fontWeight: '700' }]}>{t.home.families.add}</Text>
          </Pressable>
        </Card>
      ) : null}
    </View>
  );
}

/** „Alle Kinder heute“ über alle Familien – nur Zahlen und Namen, keine Inhalte. Antippen öffnet die Familie. */
export function FamiliesOverview() {
  const t = useT();
  const f = t.home.families;
  const { overview, family, switchFamily } = useFamily();
  if (overview.length < 2) return null;
  const others = overview.filter((o) => o.family_id !== family.id);
  if (!others.length) return null;

  const where = (o: FamilyOverview) =>
    !o.today_parent
      ? f.noPlan
      : o.today_parent === o.my_key
        ? f.atYou
        : fmt(f.at, { name: o.today_parent === 'a' ? o.name_a : o.name_b });

  return (
    <Card style={{ gap: spacing.sm }}>
      <Text style={styles.title}>{f.overviewTitle}</Text>
      {others.map((o) => {
        const dot = !o.today_parent ? colors.border : o.today_parent === o.my_key ? colors.primary : colors.accent;
        return (
          <Pressable
            key={o.family_id}
            accessibilityRole="button"
            onPress={() => attempt(() => switchFamily(o.family_id))}
            style={styles.overviewRow}
          >
            <View style={[styles.dot, { backgroundColor: dot }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{familyLabel(o, o.my_key, t)}</Text>
              <Text style={styles.meta}>
                {where(o)}
                {o.open_items ? ` · ${fmt(f.open, { n: o.open_items })}` : ''}
                {o.active ? '' : ` · 🔒 ${f.locked}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  currentText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10 },
  rowText: { flex: 1, fontSize: 15, color: colors.text },
  title: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
});
