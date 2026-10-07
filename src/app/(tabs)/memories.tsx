import { router } from 'expo-router';
import { Image, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState, Fab, GradientHeader } from '@/components/ui';
import { FREE_MEMORY_LIMIT, purchasesAvailable, usePlus } from '@/data/plus';
import { useStore } from '@/data/store';
import { Memory } from '@/data/types';
import { formatShort, monthYear } from '@/lib/dates';
import { colors, radius, shadow, spacing } from '@/theme';

export default function Memories() {
  const { memories, photoUrls } = useStore();
  const { active: plus } = usePlus();
  // Ohne kaufbares Abo (Version 1) gibt es kein Limit – sonst stünde man vor einer Sperre ohne Ausweg.
  const atLimit = purchasesAvailable && !plus && memories.length >= FREE_MEMORY_LIMIT;

  const sorted = [...memories].sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
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
        subtitle={
          plus || !purchasesAvailable
            ? `${memories.length} ${memories.length === 1 ? 'Moment' : 'Momente'} für die Ewigkeit`
            : `${memories.length} von ${FREE_MEMORY_LIMIT} Momenten · unbegrenzt mit Plus`
        }
      />
      <SectionList
        sections={sections}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.month}>{section.title}</Text>}
        renderItem={({ item }) => (
          <MemoryCard memory={item} photoUrl={item.photo_path ? photoUrls[item.photo_path] : undefined} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="camera-outline"
            title="Noch keine Erinnerungen"
            text="Haltet eure schönsten Momente fest – mit Foto, Datum und ein paar Worten."
          />
        }
      />
      <Fab label="Erinnerung hinzufügen" onPress={() => router.push(atLimit ? '/plus' : '/memory/new')} />
    </View>
  );
}

function MemoryCard({ memory, photoUrl }: { memory: Memory; photoUrl?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/memory/${memory.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      {memory.photo_path ? <Image source={photoUrl ? { uri: photoUrl } : undefined} style={styles.photo} /> : null}
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
