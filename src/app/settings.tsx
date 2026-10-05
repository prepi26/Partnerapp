import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Card, confirmDestructive, Field, PrimaryButton, SecondaryButton } from '@/components/ui';
import { useStore } from '@/data/store';
import { today } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function Settings() {
  const { state, setCouple, resetAll } = useStore();
  const couple = state.couple!;
  const [partnerA, setPartnerA] = useState(couple.partnerA);
  const [partnerB, setPartnerB] = useState(couple.partnerB);
  const [startDate, setStartDate] = useState(couple.startDate);

  const save = () => {
    setCouple({ partnerA: partnerA.trim(), partnerB: partnerB.trim(), startDate });
    router.back();
  };

  const reset = () =>
    confirmDestructive(
      'Alles löschen?',
      'Alle Erinnerungen, Wünsche und Daten werden von diesem Gerät entfernt.',
      'Alles löschen',
      () => {
        router.dismissAll();
        resetAll();
      },
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Field label="Name 1" value={partnerA} onChangeText={setPartnerA} />
          <Field label="Name 2" value={partnerB} onChangeText={setPartnerB} />
          <DateField label="Zusammen seit" value={startDate} onChange={setStartDate} maximumDate={today()} />
        </Card>
        <PrimaryButton
          title="Speichern"
          icon="checkmark"
          disabled={!partnerA.trim() || !partnerB.trim()}
          onPress={save}
        />

        <View style={styles.danger}>
          <Text style={styles.note}>
            Eure Daten liegen aktuell nur auf diesem Gerät. Synchronisation zwischen zwei Handys kommt in einer
            späteren Version.
          </Text>
          <SecondaryButton title="Alle Daten löschen" icon="trash-outline" danger onPress={reset} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  card: { gap: spacing.md },
  danger: { marginTop: spacing.xl, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
