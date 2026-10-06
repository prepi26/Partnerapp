import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { confirmDestructive, EmptyState, GradientHeader, tap } from '@/components/ui';
import { attempt, useCouple } from '@/data/store';
import { formatShort } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${formatShort(d)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Notes() {
  const { notes, userId, partnerName, addNote, removeNote } = useCouple();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    tap();
    setSending(true);
    if (await attempt(() => addNote(text))) setDraft('');
    setSending(false);
  };

  // Neueste Zettel unten, wie in einem Chat.
  const items = [...notes].reverse();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientHeader title="Liebeszettel" subtitle={`Kleine Botschaften für ${partnerName}`} />
      <FlatList
        data={items}
        inverted={items.length > 0}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mine = item.author_id === userId;
          return (
            <Pressable
              onLongPress={() =>
                mine &&
                confirmDestructive('Zettel löschen?', 'Er verschwindet für euch beide.', 'Löschen', () =>
                  attempt(() => removeNote(item.id)),
                )
              }
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}
            >
              <Text style={[styles.text, mine && styles.textMine]}>{item.text}</Text>
              <Text style={[styles.time, mine && styles.timeMine]}>{timeLabel(item.created_at)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="mail-unread-outline"
            title="Noch keine Zettel"
            text={`Schreib ${partnerName} etwas Liebes – es erscheint sofort auf dem anderen Handy.`}
          />
        }
      />
      <View style={styles.inputBar}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Schreib etwas Liebes…"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          multiline
          maxLength={2000}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Senden"
          onPress={send}
          disabled={!draft.trim() || sending}
          style={[styles.send, (!draft.trim() || sending) && { opacity: 0.4 }]}
        >
          <Ionicons name="heart" size={22} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubble: { maxWidth: '82%', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.pink, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.bluePale, borderBottomLeftRadius: 4 },
  text: { fontSize: 16, color: colors.text, lineHeight: 22 },
  textMine: { color: colors.white },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: colors.white, opacity: 0.85 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
