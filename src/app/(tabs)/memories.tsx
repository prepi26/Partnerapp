import { router } from 'expo-router';
import { Image, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState, Fab, GradientHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { Memory } from '@/data/types';
import { formatShort, monthYear } from '@/lib/dates';
import { colors, radius, shadow, spacing } from '@/theme';

export default function Memories() {
  const { state } = useStore();

  const sorted = [...state.memories].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const sections: { title: string; data: Memory[] }[] = [];
  for (const m of sorted) {
    const title = monthYear(m.date);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(m);
    else sections.push({ title, data: [m] });
  }

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader
        title="Erinnerungen"
        subtitle={`${state.memories.length} ${state.memories.length === 1 ? 'Moment' : 'Momente'} für die Ewigkeit`}
      />
      <SectionList
        sections={sections}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.month}>{section.title}</Text>}
        renderItem={({ item }) => <MemoryCard memory={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="camera-outline"
            title="Noch keine Erinnerungen"
            text="Haltet eure schönsten Momente fest – mit Foto, Datum und ein paar Worten."
          />
        }
      />
      <Fab label="Erinnerung hinzufügen" onPress={() => router.push('/memory/new')} />
    </View>
  );
}

function MemoryCard({ memory }: { memory: Memory }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/memory/${memory.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      {memory.photoUri ? <Image source={{ uri: memory.photoUri }} style={styles.photo} /> : null}
      <View style={styles.cardBody}>
        <View style={styles.dot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{memory.title}</Text>
          <Text style={styles.date}>{formatShort(memory.date)}</Text>
          {memory.text ? (
            <Text style={styles.text} numberOfLines={3}>
              {memory.text}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  month: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  card: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden', ...shadow },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.pinkPale },
  cardBody: { flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink, marginTop: 7 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  text: { fontSize: 15, color: colors.text, marginTop: spacing.sm, lineHeight: 21 },
});
