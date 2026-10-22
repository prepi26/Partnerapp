import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Fab } from '@/components/ui';
import { useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { infoCategories } from '@/lib/childInfo';
import { formatTimestamp } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function ChildInfoScreen() {
  const t = useT();
  const { child_info, family, userId, otherName } = useFamily();
  const kids = family.children.trim();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{fmt(t.family.childInfo.intro, { kids: kids || t.family.childInfo.yourChild })}</Text>
        {infoCategories(t).map((cat) => {
          const items = child_info.filter((i) => i.category === cat.key);
          return (
            <View key={cat.key} style={{ gap: spacing.xs }}>
              <Text style={styles.section}>
                {cat.emoji} {cat.label}
              </Text>
              {items.length ? (
                <Card style={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
                  {items.map((i) => (
                    <Pressable
                      key={i.id}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/child-info-edit', params: { id: i.id } })}
                      style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.label}>{i.label}</Text>
                      <Text style={styles.value}>{i.value || '–'}</Text>
                      <Text style={styles.meta}>
                        {i.updated_by === userId ? t.common.youCap : otherName} · {formatTimestamp(i.updated_at)}
                      </Text>
                    </Pressable>
                  ))}
                </Card>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/child-info-edit', params: { category: cat.key } })}
              >
                <Text style={styles.add}>+ {fmt(t.family.childInfo.add, { category: cat.label })}</Text>
              </Pressable>
            </View>
          );
        })}
        <Text style={styles.privacy}>🔒 {t.family.childInfo.privacy}</Text>
      </ScrollView>
      <Fab label={t.family.childInfo.fab} onPress={() => router.push('/child-info-edit')} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  row: { gap: 2, paddingVertical: 4 },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  value: { fontSize: 16, color: colors.text },
  meta: { fontSize: 11, color: colors.textMuted },
  add: { fontSize: 14, color: colors.primary, fontWeight: '700', paddingVertical: 4 },
  privacy: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: spacing.md },
});
