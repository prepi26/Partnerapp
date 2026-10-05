import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { authorName, wishCategories } from '@/data/labels';
import { useStore } from '@/data/store';
import { PartnerKey, WishCategory } from '@/data/types';
import { spacing } from '@/theme';

const authors: (PartnerKey | 'both')[] = ['both', 'a', 'b'];

export default function NewWish() {
  const { state, addWish } = useStore();
  const couple = state.couple!;
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<WishCategory>('erlebnis');
  const [author, setAuthor] = useState<PartnerKey | 'both'>('both');

  const save = () => {
    addWish({ title: title.trim(), note: note.trim(), category, author });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Wunsch" value={title} onChangeText={setTitle} placeholder="z. B. Roadtrip durch Florida" autoFocus />
        <Field label="Notiz (optional)" value={note} onChangeText={setNote} placeholder="Details, Ideen, Links…" multiline />
        <View style={styles.group}>
          <Label>Kategorie</Label>
          <View style={styles.chips}>
            {wishCategories.map((c) => (
              <Chip
                key={c.key}
                label={`${c.emoji} ${c.label}`}
                selected={category === c.key}
                onPress={() => setCategory(c.key)}
              />
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <Label>Wessen Wunsch?</Label>
          <View style={styles.chips}>
            {authors.map((a) => (
              <Chip
                key={a}
                tint="blue"
                label={authorName(couple, a)}
                selected={author === a}
                onPress={() => setAuthor(a)}
              />
            ))}
          </View>
        </View>
        <PrimaryButton title="Wunsch speichern" icon="sparkles" disabled={!title.trim()} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
