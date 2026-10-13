import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Chip, Field, PrimaryButton, showError } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, gradient, spacing } from '@/theme';

const MIN_PASSWORD = 8;

/** Übersetzt die Supabase-Fehler beim Anmelden in verständliche Sätze. */
function loginError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-Mail oder Passwort stimmen nicht.';
  if (/already registered|already exists/i.test(message)) {
    return 'Mit dieser E-Mail gibt es schon ein Konto. Wechsle zu „Anmelden“.';
  }
  if (/email not confirmed/i.test(message)) return 'Diese E-Mail ist noch nicht bestätigt.';
  if (/expired|invalid.*(token|otp)|(token|otp).*invalid/i.test(message)) {
    return 'Der Code stimmt nicht oder ist abgelaufen. Fordere einfach einen neuen an.';
  }
  if (/different from the old|same password/i.test(message)) return 'Nimm ein anderes Passwort als bisher.';
  if (/password/i.test(message)) return `Das Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.`;
  if (/rate|too many/i.test(message)) return 'Zu viele Versuche. Warte kurz und probier es dann nochmal.';
  if (/network|fetch/i.test(message)) return 'Keine Verbindung zum Server. Bist du online?';
  return message;
}

export default function Login() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signup' | 'signin' | 'reset'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  // Passwort vergessen: erst Code per E-Mail anfordern, dann Code und neues Passwort eingeben.
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = /^\S+@\S+\.\S+$/.test(cleanEmail);
  const valid = emailValid && password.length >= MIN_PASSWORD;
  const codeValid = /^\d{6,10}$/.test(code);

  const startReset = () => {
    setMode('reset');
    setCodeSent(false);
    setCode('');
    setPassword('');
  };

  const sendCode = async () => {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    setBusy(false);
    if (error) showError('Code konnte nicht gesendet werden', loginError(error.message));
    else setCodeSent(true);
  };

  const resetPassword = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code, type: 'recovery' });
    if (error) {
      setBusy(false);
      showError('Das hat nicht geklappt', loginError(error.message));
      return;
    }
    // Nach dem Code ist man angemeldet – jetzt das neue Passwort speichern.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      showError('Passwort nicht geändert', `${loginError(updateError.message)} Du bist trotzdem angemeldet.`);
    }
  };

  const submit = async () => {
    setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
      setBusy(false);
      if (error) showError('Konto konnte nicht erstellt werden', loginError(error.message));
      // Ohne Sitzung verlangt Supabase noch eine E-Mail-Bestätigung (Einstellung „Confirm email“).
      else if (!data.session) {
        showError('Fast geschafft', 'Bitte bestätige deine E-Mail über den Link, den du bekommen hast.');
      }
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setBusy(false);
    if (error) showError('Anmeldung fehlgeschlagen', loginError(error.message));
  };

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.hero}>
            <Text style={styles.emoji}>🌴💖🌊</Text>
            <Text style={styles.title}>Wir zwei</Text>
            <Text style={styles.subtitle}>Eure gemeinsame App – auf beiden Handys immer gleich.</Text>
          </View>

          <View style={styles.switch}>
            <Chip label="Neu hier" selected={mode === 'signup'} onPress={() => setMode('signup')} />
            <Chip
              label="Ich habe ein Konto"
              tint="blue"
              selected={mode === 'signin'}
              onPress={() => setMode('signin')}
            />
          </View>

          {mode === 'reset' ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Passwort vergessen</Text>
              <Field
                label="Deine E-Mail"
                value={email}
                onChangeText={setEmail}
                placeholder="name@beispiel.de"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                editable={!codeSent}
              />
              {codeSent ? (
                <>
                  <Field
                    label="Code aus der E-Mail"
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                    placeholder="123456"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={10}
                  />
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
                  <PrimaryButton
                    title={busy ? 'Einen Moment…' : 'Passwort ändern'}
                    icon="key"
                    disabled={busy || !codeValid || password.length < MIN_PASSWORD}
                    onPress={resetPassword}
                  />
                  <Text style={styles.hint}>
                    Kein Code da? Schau im Spam-Ordner nach oder{' '}
                    <Text style={styles.link} onPress={() => !busy && sendCode()}>
                      schick ihn nochmal
                    </Text>
                    .
                  </Text>
                </>
              ) : (
                <>
                  <PrimaryButton
                    title={busy ? 'Einen Moment…' : 'Code per E-Mail senden'}
                    icon="mail"
                    disabled={busy || !emailValid}
                    onPress={sendCode}
                  />
                  <Text style={styles.hint}>Wir schicken dir einen Code, mit dem du ein neues Passwort festlegst.</Text>
                </>
              )}
              <Pressable accessibilityRole="button" onPress={() => setMode('signin')} hitSlop={8}>
                <Text style={[styles.hint, styles.link]}>Zurück zur Anmeldung</Text>
              </Pressable>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Field
                label="Deine E-Mail"
                value={email}
                onChangeText={setEmail}
                placeholder="name@beispiel.de"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
              />
              <Field
                label={mode === 'signup' ? `Passwort (mind. ${MIN_PASSWORD} Zeichen)` : 'Passwort'}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                onSubmitEditing={() => valid && !busy && submit()}
              />
              <PrimaryButton
                title={busy ? 'Einen Moment…' : mode === 'signup' ? 'Konto erstellen' : 'Anmelden'}
                icon="heart"
                disabled={busy || !valid}
                onPress={submit}
              />
              <Text style={styles.hint}>
                {mode === 'signup'
                  ? 'Jeder von euch erstellt ein eigenes Konto. Danach verbindet ihr euch mit einem Code.'
                  : 'Mit derselben E-Mail und demselben Passwort kommst du auch auf einem neuen Handy an eure Daten.'}
              </Text>
              {mode === 'signin' ? (
                <Pressable accessibilityRole="button" onPress={startReset} hitSlop={8}>
                  <Text style={[styles.hint, styles.link]}>Passwort vergessen?</Text>
                </Pressable>
              ) : null}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  emoji: { fontSize: 44 },
  title: { fontSize: 44, fontWeight: '900', color: colors.white, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.white, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  switch: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  card: { gap: spacing.md, padding: spacing.lg },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  link: { color: colors.blue, fontWeight: '700' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
});
