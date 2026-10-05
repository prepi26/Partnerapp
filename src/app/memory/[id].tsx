import { router, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmDestructive, EmptyState, SecondaryButton } from '@/components/ui';
import { useStore } from '@/data/store';
import { daysBetween, formatDate, parseISO } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, removeMemory } = useStore();
  const memory = state.memories.find((m) => m.id === id);

  if (!memory) {
    return <EmptyState icon="help-circle-outline" title="Nicht gefunden" text="Diese Erinnerung gibt es nicht mehr." />;
  }

  const dayNumber = state.couple ? daysBetween(parseISO(state.couple.startDate), parseISO(memory.date)) : null;

  const confirmDelete = () =>
    confirmDestructive('Erinnerung löschen?', 'Das kann nicht rückgängig gemacht werden.', 'Löschen', () => {
      removeMemory(memory.id);
      router.back();
    });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {memory.photoUri ? <Image source={{ uri: memory.photoUri }} style={styles.photo} /> : null}
      <View style={{ gap: spacing.xs }}>
        <Text style={styles.title}>{memory.title}</Text>
        <Text style={styles.date}>
          {formatDate(memory.date)}
          {dayNumber !== null && dayNumber >= 0 ? `  ·  Tag ${dayNumber + 1} eurer Beziehung` : ''}
        </Text>
      </View>
      {memory.text ? <Text style={styles.text}>{memory.text}</Text> : null}
      <View style={{ marginTop: spacing.lg }}>
        <SecondaryButton title="Löschen" icon="trash-outline" danger onPress={confirmDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.pinkPale },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  date: { fontSize: 14, color: colors.blue, fontWeight: '600' },
  text: { fontSize: 17, color: colors.text, lineHeight: 25 },
});
