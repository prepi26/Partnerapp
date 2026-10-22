import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Card, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { errorMessage, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { shareDataExport } from '@/lib/exportData';
import { must, supabase } from '@/lib/supabase';
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
      // Alle eigenen Familien (bei Kindern mit verschiedenen Eltern) – je Familie mit ihren Einträgen.
      const all = async (table: string) => must(await supabase.from(table).select('*')) as { family_id: string }[];
      const tables = {
        umgangsaenderungen: 'schedule_changes',
        kosten: 'expenses',
        nachrichten: 'messages',
        entscheidungen: 'decisions',
        uebergaben: 'handovers',
        elternvereinbarung: 'agreements',
        infos_zum_kind: 'child_info',
        unterhalt_vereinbart: 'maintenance_terms',
        unterhalt_zahlungen: 'maintenance_payments',
        packliste: 'packing_items',
        dokumente: 'documents',
        fachkraft_zugaenge: 'professional_access',
        mein_tagebuch: 'journal',
      };
      const rows = await Promise.all(Object.values(tables).map(all));
      const byTable = Object.fromEntries(Object.keys(tables).map((key, i) => [key, rows[i]]));
      await shareDataExport({
        konto: { id: store.userId, email },
        familien: store.families.map((f) => ({
          ...f,
          invite_code: undefined,
          meine_rolle: `Elternteil ${(f.parent_b === store.userId ? 'b' : 'a').toUpperCase()}`,
          ...Object.fromEntries(
            Object.entries(byTable).map(([key, list]) => [
              key,
              list
                .filter((r) => r.family_id === f.id)
                .map((r) =>
                  key === 'dokumente'
                    ? { ...r, hinweis: 'Datei selbst in der App abrufbar' }
                    : key === 'fachkraft_zugaenge'
                      ? { ...r, code: undefined }
                      : r,
                ),
            ]),
          ),
        })),
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
