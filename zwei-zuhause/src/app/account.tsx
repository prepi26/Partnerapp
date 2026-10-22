import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Card, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { errorMessage, useFamily } from '@/data/store';
import { shareDataExport } from '@/lib/exportData';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

const MIN_PASSWORD = 8;

export default function Account() {
  const store = useFamily();
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'password' | 'export' | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
  }, []);

  const cleanEmail = newEmail.trim().toLowerCase();
  const emailValid = /^\S+@\S+\.\S+$/.test(cleanEmail) && cleanEmail !== email;

  const changeEmail = async () => {
    setBusy('email');
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    setBusy(null);
    if (error) showError('E-Mail nicht geändert', errorMessage(error));
    else {
      setNewEmail('');
      showError(
        'Fast geschafft',
        `Wir haben eine Bestätigung an ${cleanEmail} geschickt. Erst nach dem Klick auf den Link gilt die neue Adresse.`,
      );
    }
  };

  const changePassword = async () => {
    setBusy('password');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) showError('Passwort nicht geändert', errorMessage(error));
    else {
      setPassword('');
      showError('Passwort geändert', 'Ab jetzt meldest du dich mit dem neuen Passwort an.');
    }
  };

  const exportData = async () => {
    setBusy('export');
    try {
      const { family, ...rest } = store;
      await shareDataExport({
        konto: { id: store.userId, email, rolle: `Elternteil ${store.me.toUpperCase()}` },
        familie: { ...family, invite_code: undefined },
        umgangsaenderungen: rest.schedule_changes,
        kosten: rest.expenses,
        nachrichten: rest.messages,
        entscheidungen: rest.decisions,
        uebergaben: rest.handovers,
        elternvereinbarung: rest.agreements,
        infos_zum_kind: rest.child_info,
        dokumente: rest.documents.map((d) => ({ ...d, hinweis: 'Datei selbst in der App abrufbar' })),
        fachkraft_zugaenge: rest.professional_access.map((p) => ({ ...p, code: undefined })),
        mein_tagebuch: rest.journal,
      });
    } catch (e) {
      showError('Export fehlgeschlagen', errorMessage(e));
    }
    setBusy(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.title}>E-Mail-Adresse</Text>
          <Text style={styles.text}>Aktuell: {email || '…'}</Text>
          <Field
            label="Neue E-Mail"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="name@beispiel.de"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />
          <SecondaryButton
            title={busy === 'email' ? 'Sende…' : 'E-Mail ändern'}
            icon="mail-outline"
            onPress={() => emailValid && !busy && changeEmail()}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Passwort</Text>
          <Field
            label={`Neues Passwort (mind. ${MIN_PASSWORD} Zeichen)`}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <SecondaryButton
            title={busy === 'password' ? 'Speichere…' : 'Passwort ändern'}
            icon="key-outline"
            onPress={() => password.length >= MIN_PASSWORD && !busy && changePassword()}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>Meine Daten</Text>
          <Text style={styles.text}>
            Alles, was du in Zwei Zuhause sehen kannst – Kalender, Kosten, Nachrichten, Entscheidungen, Vereinbarung,
            Infos, Dokumentenliste und dein Tagebuch – als Datei (JSON). Das ist deine Auskunft nach DSGVO.
          </Text>
          <PrimaryButton
            title={busy === 'export' ? 'Erstelle Datei…' : 'Daten exportieren'}
            icon="download-outline"
            disabled={!!busy}
            onPress={exportData}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  card: { gap: spacing.md },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
