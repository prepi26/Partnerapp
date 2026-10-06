import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { DateField } from '@/components/DateField';
import { Field, PrimaryButton } from '@/components/ui';
import { attempt, NewPhoto, useStore } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

export default function NewMemory() {
  const { addMemory } = useStore();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(toISO(today()));
  const [photo, setPhoto] = useState<NewPhoto>();
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
    }
  };

  const save = async () => {
    setSaving(true);
    const ok = await attempt(() => addMemory({ title: title.trim(), text: text.trim(), date, photo }));
    if (ok) router.back();
    else setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.photoBox}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photo} />
          ) : (
            <>
              <Ionicons name="image-outline" size={36} color={colors.pink} />
              <Text style={styles.photoText}>Foto hinzufügen</Text>
            </>
          )}
        </Pressable>
        <Field label="Titel" value={title} onChangeText={setTitle} placeholder="z. B. Sonnenuntergang am Strand" />
        <DateField label="Datum" value={date} onChange={setDate} />
        <Field
          label="Was war besonders?"
          value={text}
          onChangeText={setText}
          placeholder="Erzählt euch die Geschichte…"
          multiline
        />
        <PrimaryButton
          title={saving ? (photo ? 'Lade Foto hoch…' : 'Speichere…') : 'Speichern'}
          icon="heart"
          disabled={!title.trim() || saving}
          onPress={save}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  photoBox: {
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.pinkSoft,
    backgroundColor: colors.pinkPale,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  photo: { width: '100%', height: '100%' },
  photoText: { color: colors.pink, fontWeight: '700', fontSize: 15 },
});
