import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, confirmDestructive, EmptyState, Fab, GradientHeader, tap } from '@/components/ui';
import { authorName, categoryEmoji } from '@/data/labels';
import { useStore } from '@/data/store';
import { Wish } from '@/data/types';
import { colors, radius, shadow, spacing } from '@/theme';

export default function Wishes() {
  const { state, toggleWish, removeWish } = useStore();
  const [filter, setFilter] = useState<'open' | 'done'>('open');
  const couple = state.couple!;

  const doneCount = state.wishes.filter((w) => w.done).length;
  const visible = state.wishes
    .filter((w) => (filter === 'open' ? !w.done : w.done))
    .sort((a, b) => (filter === 'open' ? b.createdAt - a.createdAt : (b.doneAt ?? 0) - (a.doneAt ?? 0)));

  const remove = (wish: Wish) =>
    confirmDestructive('Wunsch löschen?', `„${wish.title}“ wird entfernt.`, 'Löschen', () => removeWish(wish.id));

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader
        title="Wünsche"
        subtitle={
          state.wishes.length ? `${doneCount} von ${state.wishes.length} erfüllt` : 'Eure gemeinsame Bucket List'
        }
      />
      {state.wishes.length > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(doneCount / state.wishes.length) * 100}%` }]} />
        </View>
      ) : null}
      <View style={styles.filters}>
        <Chip label="Offen" selected={filter === 'open'} onPress={() => setFilter('open')} />
        <Chip label="Erfüllt ✓" tint="blue" selected={filter === 'done'} onPress={() => setFilter('done')} />
      </View>
      <FlatList
        data={visible}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              tap();
              toggleWish(item.id);
            }}
            onLongPress={() => remove(item)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.check, item.done && styles.checkDone]}>
              {item.done ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, item.done && styles.titleDone]}>
                {categoryEmoji(item.category)} {item.title}
              </Text>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
              <Text style={styles.author}>{authorName(couple, item.author)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          filter === 'open' ? (
            <EmptyState
              icon="sparkles-outline"
              title="Keine offenen Wünsche"
              text="Was wolltet ihr schon immer mal zusammen machen? Schreibt es auf!"
            />
          ) : (
            <EmptyState icon="checkmark-done-outline" title="Noch nichts erfüllt" text="Tippt einen Wunsch an, um ihn abzuhaken." />
          )
        }
        ListFooterComponent={
          visible.length ? <Text style={styles.hint}>Antippen zum Abhaken · Gedrückt halten zum Löschen</Text> : null
        }
      />
      <Fab label="Wunsch hinzufügen" onPress={() => router.push('/wish-new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    height: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bluePale,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: radius.pill },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { padding: spacing.lg, paddingBottom: 120, gap: spacing.sm },
  item: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'flex-start',
    ...shadow,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.blue, borderColor: colors.blue },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  note: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 },
  author: { fontSize: 12, color: colors.pink, fontWeight: '700', marginTop: 6 },
  hint: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.md },
});
