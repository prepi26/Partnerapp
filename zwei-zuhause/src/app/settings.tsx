import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InviteCard } from '@/components/InviteCard';
import { Card, Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/config';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { attempt, useFamily } from '@/data/store';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

const SHARES = [50, 60, 70, 80, 100, 40, 30, 20, 0];

export default function Settings() {
  const { family, me, otherJoined, otherName, updateFamily, signOut, deleteAccount } = useFamily();
  const [nameA, setNameA] = useState(family.name_a);
  const [nameB, setNameB] = useState(family.name_b);
  const [kids, setKids] = useState(family.children);
  // Angezeigt wird immer mein Anteil, gespeichert der Anteil von Elternteil a.
  const [myShare, setMyShare] = useState(me === 'a' ? family.default_share_a : 100 - family.default_share_a);
  const [saving, setSaving] = useState(false);
  const { active: plus } = usePlus();

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    const ok = await attempt(() =>
      updateFamily({
        name_a: nameA.trim(),
        name_b: nameB.trim(),
        children: kids.trim(),
        default_share_a: me === 'a' ? myShare : 100 - myShare,
      }),
    );
    if (ok) close();
    else setSaving(false);
  };

  const logout = () =>
    confirmDestructive('Abmelden?', 'Deine Daten bleiben gespeichert.', 'Abmelden', () => {
      router.dismissAll();
      signOut();
    });

  const removeAccount = () =>
    confirmDestructive(
      'Konto endgültig löschen?',
      otherJoined
        ? `Dein Konto und dein Tagebuch werden gelöscht. Kalender, Kosten und Nachrichten bleiben für ${otherName} erhalten – sie sind auch seine/ihre Dokumentation.`
        : 'Dein Konto, dein Tagebuch und alle Daten der Familie werden gelöscht.',
      'Endgültig löschen',
      () => {
        attempt(deleteAccount).then((ok) => ok && router.dismissAll());
      },
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {purchasesAvailable || plus ? (
          <SecondaryButton
            title={plus ? 'Plus ist aktiv ✓' : 'Zwei Zuhause Plus'}
            icon="shield-checkmark"
            onPress={() => router.push('/plus')}
          />
        ) : null}
        {!otherJoined ? <InviteCard code={family.invite_code} otherName={otherName} /> : null}

        <Card style={styles.card}>
          <Field label="Elternteil 1" value={nameA} onChangeText={setNameA} />
          <Field label="Elternteil 2" value={nameB} onChangeText={setNameB} />
          <Field label="Kind / Kinder" value={kids} onChangeText={setKids} placeholder="z. B. Mia, Paul" />
        </Card>

        <Card style={styles.card}>
          <Label>Mein üblicher Anteil an Kosten</Label>
          <View style={styles.chips}>
            {SHARES.map((s) => (
              <Chip key={s} label={`${s} %`} selected={myShare === s} onPress={() => setMyShare(s)} />
            ))}
          </View>
          <Text style={styles.note}>Vorschlag beim Eintragen – pro Ausgabe änderbar.</Text>
        </Card>

        <SecondaryButton title="Umgangsplan ändern" icon="calendar-outline" onPress={() => router.push('/schedule')} />

        <PrimaryButton
          title={saving ? 'Speichere…' : 'Speichern'}
          icon="checkmark"
          disabled={saving || !nameA.trim() || !nameB.trim()}
          onPress={save}
        />

        <View style={styles.footer}>
          <Text style={styles.note}>
            Zwei Zuhause ersetzt keine Rechtsberatung. Bei Fragen zu Umgang, Sorgerecht oder Unterhalt helfen
            Jugendamt, Beratungsstellen und Fachanwälte für Familienrecht.
          </Text>
          {PRIVACY_URL ? (
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
              Datenschutz
            </Text>
          ) : null}
          {TERMS_URL ? (
            <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
              Nutzungsbedingungen & Impressum
            </Text>
          ) : null}
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { marginTop: spacing.xl, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  link: { fontSize: 14, color: colors.primary, textAlign: 'center', fontWeight: '600' },
});
