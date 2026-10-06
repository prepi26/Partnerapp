import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { DATE_IDEA_SUGGESTIONS } from '@/data/dateIdeas';
import { attempt, useCouple } from '@/data/store';
import { colors, radius, shadow, spacing } from '@/theme';

import { Card, confirmDestructive, PrimaryButton, SecondaryButton, tap } from './ui';

interface Idea {
  title: string;
  emoji: string;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function DateIdeas() {
  const { date_ideas, addIdea, toggleIdea, removeIdea } = useCouple();
  const [pick, setPick] = useState<Idea | null>(null);
  const [draft, setDraft] = useState('');

  const ours = [...date_ideas].sort(
    (a, b) => Number(a.done) - Number(b.done) || b.created_at.localeCompare(a.created_at),
  );
  const openOurs = ours.filter((i) => !i.done);
  const taken = new Set(date_ideas.map((i) => i.title.toLowerCase()));
  const suggestions = DATE_IDEA_SUGGESTIONS.filter((s) => !taken.has(s.title.toLowerCase()));

  const roll = () => {
    tap();
    // Eigene offene Ideen haben Vorrang vor den Vorschlägen.
    const pool: Idea[] = openOurs.length ? openOurs : DATE_IDEA_SUGGESTIONS;
    const candidates = pool.length > 1 ? pool.filter((i) => i.title !== pick?.title) : pool;
    setPick(randomItem(candidates));
  };

  const plan = (idea: Idea) =>
    router.push({ pathname: '/date-new', params: { title: idea.title, emoji: idea.emoji, yearly: '0' } });

  const add = async () => {
    const title = draft.trim();
    if (!title) return;
    if (await attempt(() => addIdea({ title, emoji: '💡' }))) setDraft('');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.random}>
        {pick ? (
          <>
            <Text style={styles.pickEmoji}>{pick.emoji}</Text>
            <Text style={styles.pickTitle}>{pick.title}</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <SecondaryButton title="Nochmal" icon="shuffle" onPress={roll} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Planen" icon="calendar" onPress={() => plan(pick)} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.pickEmoji}>🎲</Text>
            <Text style={styles.pickTitle}>Keine Idee für heute?</Text>
            <PrimaryButton title="Zufälliges Date" icon="shuffle" onPress={roll} />
          </>
        )}
      </Card>

      <Text style={styles.section}>Unsere Ideen</Text>
      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Neue Idee, z. B. Sushi-Abend"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Idee hinzufügen" onPress={add} style={styles.addBtn}>
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      </View>
      {ours.length === 0 ? (
        <Text style={styles.empty}>Noch keine eigenen Ideen. Schreibt eine auf oder übernehmt einen Vorschlag.</Text>
      ) : (
        ours.map((idea) => (
          <Pressable
            key={idea.id}
            onPress={() => attempt(() => toggleIdea(idea))}
            onLongPress={() =>
              confirmDestructive('Idee löschen?', `„${idea.title}“ wird entfernt.`, 'Löschen', () =>
                attempt(() => removeIdea(idea.id)),
              )
            }
            style={styles.idea}
          >
            <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
            <Text style={[styles.ideaTitle, idea.done && styles.done]}>{idea.title}</Text>
            {idea.done ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.blue} />
            ) : (
              <Pressable hitSlop={8} onPress={() => plan(idea)}>
                <Ionicons name="calendar-outline" size={22} color={colors.pink} />
              </Pressable>
            )}
          </Pressable>
        ))
      )}

      <Text style={styles.section}>Vorschläge</Text>
      {suggestions.map((s) => (
        <View key={s.title} style={styles.idea}>
          <Text style={styles.ideaEmoji}>{s.emoji}</Text>
          <Text style={styles.ideaTitle}>{s.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${s.title} zu unseren Ideen`}
            hitSlop={8}
            onPress={() => attempt(() => addIdea(s))}
          >
            <Ionicons name="add-circle" size={26} color={colors.pink} />
          </Pressable>
        </View>
      ))}
      <Text style={styles.hint}>Antippen = erledigt · Kalender = planen · Gedrückt halten = löschen</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 60, gap: spacing.sm },
  random: { alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  pickEmoji: { fontSize: 48 },
  pickTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  section: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.blue,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  addBtn: {
    width: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  idea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow,
  },
  ideaEmoji: { fontSize: 24 },
  ideaTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  done: { textDecorationLine: 'line-through', color: colors.textMuted },
  hint: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.md },
});
