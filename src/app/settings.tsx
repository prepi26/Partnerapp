import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InviteCard } from '@/components/InviteCard';
import { DateField } from '@/components/DateField';
import { Card, confirmDestructive, Field, PrimaryButton, SecondaryButton } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { attempt, useCouple } from '@/data/store';
import { today } from '@/lib/dates';
import { colors, spacing } from '@/theme';

export default function Settings() {
  const { couple, partnerJoined, partnerName, updateCouple, signOut, deleteAccount } = useCouple();
  const [nameA, setNameA] = useState(couple.name_a);
  const [nameB, setNameB] = useState(couple.name_b);
  const [startDate, setStartDate] = useState(couple.start_date);
  const [saving, setSaving] = useState(false);
  const { active: plus } = usePlus();

  const save = async () => {
    setSaving(true);
    const ok = await attempt(() => updateCouple({ name_a: nameA.trim(), name_b: nameB.trim(), start_date: startDate }));
    if (ok) router.back();
    else setSaving(false);
  };

  const logout = () =>
    confirmDestructive(
      'Abmelden?',
      'Eure Daten bleiben gespeichert. Du kannst dich jederzeit wieder anmelden.',
      'Abmelden',
      () => {
        router.dismissAll();
        signOut();
      },
    );

  const removeAccount = () =>
    confirmDestructive(
      'Konto endgültig löschen?',
      `Dein Konto und alle gemeinsamen Daten – Erinnerungen, Fotos, Zettel, Wünsche – werden gelöscht, auch für ${partnerName}. Das kann nicht rückgängig gemacht werden.`,
      'Endgültig löschen',
      () => {
        attempt(deleteAccount).then((ok) => ok && router.dismissAll());
      },
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SecondaryButton
          title={plus ? 'Wir zwei Plus ist aktiv 💖' : 'Wir zwei Plus entdecken ✨'}
          icon="sparkles"
          onPress={() => router.push('/plus')}
        />
        {!partnerJoined ? <InviteCard code={couple.invite_code} partnerName={couple.name_b} /> : null}
        <Card style={styles.card}>
          <Field label="Name 1" value={nameA} onChangeText={setNameA} />
          <Field label="Name 2" value={nameB} onChangeText={setNameB} />
          <DateField label="Zusammen seit" value={startDate} onChange={setStartDate} maximumDate={today()} />
        </Card>
        <PrimaryButton
          title={saving ? 'Speichere…' : 'Speichern'}
          icon="checkmark"
          disabled={saving || !nameA.trim() || !nameB.trim()}
          onPress={save}
        />

        <View style={styles.footer}>
          <Text style={styles.note}>
            {partnerJoined
              ? 'Ihr seid verbunden – alles, was ihr eintragt, seht ihr beide.'
              : 'Sobald dein Schatz den Code eingibt, seht ihr beide dieselben Daten.'}
          </Text>
          <SecondaryButton title="Abmelden" icon="log-out-outline" onPress={logout} />
          <SecondaryButton title="Konto löschen" icon="trash-outline" danger onPress={removeAccount} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  card: { gap: spacing.md },
  footer: { marginTop: spacing.xl, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
