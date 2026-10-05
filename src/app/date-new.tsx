import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { dateEmojis } from '@/data/labels';
import { useStore } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function NewDate() {
  const { addDate } = useStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(toISO(today()));
  const [emoji, setEmoji] = useState(dateEmojis[0]);
  const [yearly, setYearly] = useState(true);

  const save = () => {
    addDate({ title: title.trim(), date, emoji, yearly });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Anlass" value={title} onChangeText={setTitle} placeholder="z. B. Geburtstag von Max" autoFocus />
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
            {dateEmojis.map((e) => (
              <Chip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
            ))}
          </View>
        </View>
        <PrimaryButton title="Datum speichern" icon="calendar" disabled={!title.trim()} onPress={save} />
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
