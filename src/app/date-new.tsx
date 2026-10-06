import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { dateEmojis } from '@/data/labels';
import { attempt, useStore } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function NewDate() {
  const { addDate } = useStore();
  // Vorbelegung, wenn ein Date aus den Ideen geplant wird.
  const params = useLocalSearchParams<{ title?: string; emoji?: string; yearly?: string }>();
  const [title, setTitle] = useState(params.title ?? '');
  const [date, setDate] = useState(toISO(today()));
  const [emoji, setEmoji] = useState(params.emoji ?? dateEmojis[0]);
  const [yearly, setYearly] = useState(params.yearly !== '0');
  const [saving, setSaving] = useState(false);
  const emojis = dateEmojis.includes(emoji) ? dateEmojis : [emoji, ...dateEmojis];

  const save = async () => {
    setSaving(true);
    const ok = await attempt(() => addDate({ title: title.trim(), date, emoji, yearly }));
    if (ok) router.back();
    else setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Anlass"
          value={title}
          onChangeText={setTitle}
          placeholder="z. B. Geburtstag von Max"
          autoFocus={!params.title}
        />
        <DateField label="Datum" value={date} onChange={setDate} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Jedes Jahr wiederholen</Text>
            <Text style={styles.switchText}>Für Geburtstage, Jahrestage & Co.</Text>
          </View>
          <Switch
            value={yearly}
            onValueChange={setYearly}
            trackColor={{ true: colors.pink, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
        <View style={{ gap: spacing.sm }}>
          <Label>Symbol</Label>
          <View style={styles.chips}>
            {emojis.map((e) => (
              <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
            ))}
          </View>
        </View>
        <PrimaryButton title="Datum speichern" icon="calendar" disabled={!title.trim() || saving} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  switchText: { fontSize: 13, color: colors.textMuted },
});
