import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Card, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { errorMessage, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { shareDataExport } from '@/lib/exportData';
import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

const MIN_PASSWORD = 8;

export default function Account() {
  const t = useT();
  const a = t.settings.account;
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
    if (error) showError(a.emailNotChanged, errorMessage(error));
    else {
      setNewEmail('');
      showError(a.almostDone, fmt(a.confirmSent, { email: cleanEmail }));
    }
  };

  const changePassword = async () => {
    setBusy('password');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) showError(a.passwordNotChanged, errorMessage(error));
    else {
      setPassword('');
      showError(a.passwordChanged, a.passwordChangedText);
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
      showError(a.exportFailed, errorMessage(e));
    }
    setBusy(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.title}>{a.emailTitle}</Text>
          <Text style={styles.text}>{fmt(a.current, { email: email || '…' })}</Text>
          <Field
            label={a.newEmail}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder={a.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />
          <SecondaryButton
            title={busy === 'email' ? t.common.sending : a.changeEmail}
            icon="mail-outline"
            onPress={() => emailValid && !busy && changeEmail()}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>{a.passwordTitle}</Text>
          <Field
            label={fmt(a.newPassword, { n: MIN_PASSWORD })}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <SecondaryButton
            title={busy === 'password' ? t.common.saving : a.changePassword}
            icon="key-outline"
            onPress={() => password.length >= MIN_PASSWORD && !busy && changePassword()}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.title}>{a.myData}</Text>
          <Text style={styles.text}>{a.myDataText}</Text>
          <PrimaryButton
            title={busy === 'export' ? a.creatingFile : a.exportData}
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
