import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { InviteCard } from '@/components/InviteCard';
import { DateField } from '@/components/DateField';
import { Card, Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton } from '@/components/ui';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { attempt, useCouple } from '@/data/store';
import { RelationshipStatus } from '@/data/types';
import { toISO, today } from '@/lib/dates';
import { DEFAULT_REMINDERS, loadReminderSettings, ReminderSettings, saveReminderSettings } from '@/lib/reminders';
import { colors, spacing } from '@/theme';

export default function Settings() {
  const { couple, partnerJoined, partnerName, updateCouple, signOut, deleteAccount } = useCouple();
  const [nameA, setNameA] = useState(couple.name_a);
  const [nameB, setNameB] = useState(couple.name_b);
  const [startDate, setStartDate] = useState(couple.start_date);
  const [status, setStatus] = useState<RelationshipStatus>(couple.status ?? 'together');
  const [weddingDate, setWeddingDate] = useState(couple.wedding_date ?? toISO(today()));
  const [saving, setSaving] = useState(false);
  const { active: plus } = usePlus();
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);

  useEffect(() => {
    loadReminderSettings().then(setReminders);
  }, []);

  const toggleReminder = (key: keyof ReminderSettings, value: boolean) => {
    const next = { ...reminders, [key]: value };
    setReminders(next);
    saveReminderSettings(next);
  };

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    const ok = await attempt(() =>
      updateCouple({
        name_a: nameA.trim(),
        name_b: nameB.trim(),
        start_date: startDate,
        status,
        wedding_date: status === 'together' ? null : weddingDate,
      }),
    );
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {purchasesAvailable || plus ? (
          <SecondaryButton
            title={plus ? 'Wir zwei Plus ist aktiv 💖' : 'Wir zwei Plus entdecken ✨'}
            icon="sparkles"
            onPress={() => router.push('/plus')}
          />
        ) : null}
        {!partnerJoined ? <InviteCard code={couple.invite_code} partnerName={couple.name_b} /> : null}
        <Card style={styles.card}>
          <Field label="Name 1" value={nameA} onChangeText={setNameA} />
          <Field label="Name 2" value={nameB} onChangeText={setNameB} />
          <DateField label="Zusammen seit" value={startDate} onChange={setStartDate} maximumDate={today()} />
          <Label>Ihr seid</Label>
          <View style={styles.chips}>
            <Chip label="Zusammen" selected={status === 'together'} onPress={() => setStatus('together')} />
            <Chip label="Verlobt 💍" selected={status === 'engaged'} onPress={() => setStatus('engaged')} />
            <Chip label="Verheiratet 💒" selected={status === 'married'} onPress={() => setStatus('married')} />
          </View>
          {status === 'engaged' ? (
            <DateField label="Geplante Hochzeit" value={weddingDate} onChange={setWeddingDate} minimumDate={today()} />
          ) : null}
          {status === 'married' ? (
            <DateField label="Hochzeitstag" value={weddingDate} onChange={setWeddingDate} maximumDate={today()} />
          ) : null}
        </Card>
        <PrimaryButton
          title={saving ? 'Speichere…' : 'Speichern'}
          icon="checkmark"
          disabled={saving || !nameA.trim() || !nameB.trim()}
          onPress={save}
        />

        {Platform.OS !== 'web' ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Erinnerungen</Text>
            <ToggleRow
              title="Frage des Tages"
              text="Um 19 Uhr, falls du noch nicht geantwortet hast – und abends, bevor eure Serie abreißt."
              value={reminders.question}
              onChange={(v) => toggleReminder('question', v)}
            />
            <ToggleRow
              title="Liebes-Impulse"
              text={`Mittags eine kleine Idee, z. B. „Wann hast du ${partnerName} zuletzt umarmt?“`}
              value={reminders.nudges}
              onChange={(v) => toggleReminder('nudges', v)}
            />
          </Card>
        ) : null}

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

function ToggleRow({
  title,
  text,
  value,
  onChange,
}: {
  title: string;
  text: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleText}>{text}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.pink }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  card: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  toggleText: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
  footer: { marginTop: spacing.xl, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
