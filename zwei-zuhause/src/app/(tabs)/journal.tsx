import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, confirmDestructive, EmptyState, Fab, GradientHeader } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { formatTimestamp, formatWeekday } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function Journal() {
  const { journal, removeJournal } = useFamily();

  const remove = (id: string) =>
    confirmDestructive('Eintrag löschen?', 'Der Eintrag wird endgültig gelöscht.', 'Löschen', () => {
      attempt(() => removeJournal(id));
    });

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader title="Tagebuch" subtitle="🔒 Nur für dich" />
      <FlatList
        data={journal}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          journal.length ? (
            <Text style={styles.intro}>
              Halte fest, was passiert ist: Übergaben, Absagen, Stimmung des Kindes. Sachlich, mit Datum – das hilft im
              Gespräch mit Jugendamt, Beratung oder Anwalt.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="Dein privates Protokoll"
            text="Was du hier schreibst, sieht der andere Elternteil nie. Mit Plus kannst du es als PDF für Beratung oder Anwalt exportieren."
          />
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onLongPress={() => remove(item.id)}>
            <Card style={{ gap: 6 }}>
              <Text style={styles.day}>{formatWeekday(item.day)}</Text>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.meta}>Notiert am {formatTimestamp(item.created_at)} · lange drücken zum Löschen</Text>
            </Card>
          </Pressable>
        )}
      />
      <Fab label="Neuer Eintrag" onPress={() => router.push('/journal-new')} />
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
