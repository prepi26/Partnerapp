import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, confirmDestructive, EmptyState, Fab } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { formatTimestamp, formatWeekday } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function Journal() {
  const t = useT();
  const { journal, removeJournal } = useFamily();

  const remove = (id: string) =>
    confirmDestructive(t.messages.journal.deleteTitle, t.messages.journal.deleteText, t.common.delete, () => {
      attempt(() => removeJournal(id));
    });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={journal}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          journal.length ? (
            <Text style={styles.intro}>{t.messages.journal.intro}</Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title={t.messages.journal.emptyTitle}
            text={t.messages.journal.emptyText}
          />
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onLongPress={() => remove(item.id)}>
            <Card style={{ gap: 6 }}>
              <Text style={styles.day}>{formatWeekday(item.day)}</Text>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.meta}>
                {fmt(t.messages.journal.meta, { time: formatTimestamp(item.created_at) })}
              </Text>
            </Card>
          </Pressable>
        )}
      />
      <Fab label={t.messages.journal.add} onPress={() => router.push('/journal-new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  day: { fontSize: 15, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
  meta: { fontSize: 11, color: colors.textMuted },
});
