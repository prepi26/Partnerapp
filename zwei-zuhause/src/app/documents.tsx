import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmDestructive, EmptyState, Fab } from '@/components/ui';
import { formatSize } from '@/data/documents';
import { attempt, useFamily } from '@/data/store';
import { FamilyDocument } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { documentCategories } from '@/lib/documentCategories';
import { openDocument } from '@/lib/openDocument';
import { colors, radius, spacing } from '@/theme';

export default function Documents() {
  const t = useT();
  const { documents, userId, otherName, removeDocument } = useFamily();
  const [opening, setOpening] = useState<string | null>(null);

  const open = async (doc: FamilyDocument) => {
    setOpening(doc.id);
    await openDocument(doc);
    setOpening(null);
  };

  const remove = (doc: FamilyDocument) =>
    confirmDestructive(
      t.family.documents.deleteTitle,
      fmt(t.family.documents.deleteText, { title: doc.title }),
      t.common.delete,
      () => {
        attempt(() => removeDocument(doc));
      },
    );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{t.family.documents.intro}</Text>
        {documents.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title={t.family.documents.emptyTitle}
            text={t.family.documents.emptyText}
          />
        ) : null}
        {documentCategories(t).map((cat) => {
          const list = documents.filter((d) => d.category === cat.key);
          if (!list.length) return null;
          return (
            <View key={cat.key} style={{ gap: spacing.xs }}>
              <Text style={styles.section}>
                {cat.emoji} {cat.label}
              </Text>
              <View style={styles.group}>
                {list.map((d, i) => {
                  const mine = d.created_by === userId;
                  return (
                    <Pressable
                      key={d.id}
                      accessibilityRole="button"
                      accessibilityLabel={fmt(t.family.documents.open, { title: d.title })}
                      onPress={() => open(d)}
                      onLongPress={mine ? () => remove(d) : undefined}
                      style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && { opacity: 0.6 }]}
                    >
                      <Ionicons
                        name={d.mime_type === 'application/pdf' ? 'document-text-outline' : 'image-outline'}
                        size={24}
                        color={colors.primary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={2}>
                          {d.title}
                        </Text>
                        <Text style={styles.meta}>
                          {d.doc_date ? `${fmt(t.family.documents.dated, { date: formatDate(d.doc_date) })} · ` : ''}
                          {mine ? t.family.documents.byYou : fmt(t.family.documents.byOther, { name: otherName })} · {formatTimestamp(d.created_at)} ·{' '}
                          {formatSize(d.size_bytes)}
                        </Text>
                      </View>
                      {opening === d.id ? <ActivityIndicator color={colors.primary} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
        {documents.some((d) => d.created_by === userId) ? (
          <Text style={styles.hint}>{t.family.documents.longPressHint}</Text>
        ) : null}
      </ScrollView>
      <Fab label={t.family.documents.fab} onPress={() => router.push('/document-new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', paddingHorizontal: 4 },
  group: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
