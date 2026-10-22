import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmDestructive, EmptyState, Fab } from '@/components/ui';
import { formatSize } from '@/data/documents';
import { attempt, useFamily } from '@/data/store';
import { FamilyDocument } from '@/data/types';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { DOCUMENT_CATEGORIES } from '@/lib/documentCategories';
import { openDocument } from '@/lib/openDocument';
import { colors, radius, spacing } from '@/theme';

export default function Documents() {
  const { documents, userId, otherName, removeDocument } = useFamily();
  const [opening, setOpening] = useState<string | null>(null);

  const open = async (doc: FamilyDocument) => {
    setOpening(doc.id);
    await openDocument(doc);
    setOpening(null);
  };

  const remove = (doc: FamilyDocument) =>
    confirmDestructive('Dokument löschen?', `„${doc.title}“ wird für euch beide gelöscht.`, 'Löschen', () => {
      attempt(() => removeDocument(doc));
    });

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Zeugnisse, Arztbriefe, Bescheide – beide Eltern sehen dieselben Dokumente. Löschen kann nur, wer ein Dokument
          hochgeladen hat.
        </Text>
        {documents.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title="Noch keine Dokumente"
            text="Fotografiere ein Zeugnis oder lade ein PDF hoch – dann muss niemand mehr nach Kopien fragen."
          />
        ) : null}
        {DOCUMENT_CATEGORIES.map((cat) => {
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
                      accessibilityLabel={`${d.title} öffnen`}
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
                          {d.doc_date ? `vom ${formatDate(d.doc_date)} · ` : ''}
                          {mine ? 'von dir' : `von ${otherName}`} · {formatTimestamp(d.created_at)} ·{' '}
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
          <Text style={styles.hint}>Eigene Dokumente: lange drücken zum Löschen.</Text>
        ) : null}
      </ScrollView>
      <Fab label="Dokument hinzufügen" onPress={() => router.push('/document-new')} />
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
