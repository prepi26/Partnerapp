import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Chip, Field, PrimaryButton, showError } from '@/components/ui';
import { currentT, Dict, fmt, useT } from '@/i18n';
import { isProEntry } from '@/lib/proEntry';
import { supabase } from '@/lib/supabase';
import { colors, gradient, spacing } from '@/theme';

const MIN_PASSWORD = 8;

/** Übersetzt die Supabase-Fehler beim Anmelden in verständliche Sätze. */
function loginError(message: string, t: Dict = currentT()): string {
  const e = t.auth.login.errors;
  if (/invalid login credentials/i.test(message)) return e.invalidCredentials;
  if (/already registered|already exists/i.test(message)) {
    return e.alreadyRegistered;
  }
  if (/email not confirmed/i.test(message)) return e.notConfirmed;
  if (/expired|invalid.*(token|otp)|(token|otp).*invalid/i.test(message)) {
    return e.badCode;
  }
  if (/different from the old|same password/i.test(message)) return e.samePassword;
  if (/password/i.test(message)) return fmt(e.passwordTooShort, { min: MIN_PASSWORD });
  if (/rate|too many/i.test(message)) return e.tooManyAttempts;
  if (/network|fetch/i.test(message)) return t.common.errors.network;
  return message;
}

export default function Login() {
  const proEntry = isProEntry();
  const t = useT();
  const l = t.auth.login;
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
  // Satz mit antippbarem Link in der Mitte: an {link} aufteilen, damit der Satz als Ganzes übersetzbar bleibt.
  const [noCodeBefore, noCodeAfter = ''] = l.noCode.split('{link}');

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
    if (error) showError(l.codeNotSent, loginError(error.message, t));
    else setCodeSent(true);
  };

  const resetPassword = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code, type: 'recovery' });
    if (error) {
      setBusy(false);
      showError(t.common.failed, loginError(error.message, t));
      return;
    }
    // Nach dem Code ist man angemeldet – jetzt das neue Passwort speichern.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      showError(l.passwordNotChanged, fmt(l.passwordNotChangedText, { error: loginError(updateError.message, t) }));
    }
  };

  const submit = async () => {
    setBusy(true);
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
      setBusy(false);
      if (error) showError(l.accountNotCreated, loginError(error.message, t));
      // Ohne Sitzung verlangt Supabase noch eine E-Mail-Bestätigung (Einstellung „Confirm email“).
      else if (!data.session) {
        showError(l.almostDone, l.confirmEmail);
      }
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setBusy(false);
    if (error) showError(l.signInFailed, loginError(error.message, t));
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
            <Text style={styles.emoji}>🏠🏠</Text>
            <Text style={styles.title}>Zwei Zuhause</Text>
            <Text style={styles.subtitle}>{proEntry ? l.proSubtitle : l.subtitle}</Text>
            {proEntry ? <Text style={styles.subtitle}>{l.proIdle}</Text> : null}
          </View>

          <View style={styles.switch}>
            <Chip label={l.newHere} selected={mode === 'signup'} onPress={() => setMode('signup')} />
            <Chip
              label={l.haveAccount}
              tint="accent"
              selected={mode === 'signin'}
              onPress={() => setMode('signin')}
            />
          </View>

          {mode === 'reset' ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>{l.forgotTitle}</Text>
              <Field
                label={l.email}
                value={email}
                onChangeText={setEmail}
                placeholder={l.emailPlaceholder}
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
                    label={l.codeFromEmail}
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
                    placeholder="123456"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    maxLength={10}
                  />
                  <Field
                    label={fmt(l.newPassword, { min: MIN_PASSWORD })}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                  <PrimaryButton
                    title={busy ? l.oneMoment : l.changePassword}
                    icon="key"
                    disabled={busy || !codeValid || password.length < MIN_PASSWORD}
                    onPress={resetPassword}
                  />
                  <Text style={styles.hint}>
                    {noCodeBefore}
                    <Text style={styles.link} onPress={() => !busy && sendCode()}>
                      {l.resendLink}
                    </Text>
                    {noCodeAfter}
                  </Text>
                </>
              ) : (
                <>
                  <PrimaryButton
                    title={busy ? l.oneMoment : l.sendCode}
                    icon="mail"
                    disabled={busy || !emailValid}
                    onPress={sendCode}
                  />
                  <Text style={styles.hint}>{l.sendCodeHint}</Text>
                </>
              )}
              <Pressable accessibilityRole="button" onPress={() => setMode('signin')} hitSlop={8}>
                <Text style={[styles.hint, styles.link]}>{l.backToSignIn}</Text>
              </Pressable>
            </Card>
          ) : (
            <Card style={styles.card}>
              <Field
                label={l.email}
                value={email}
                onChangeText={setEmail}
                placeholder={l.emailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
              />
              <Field
                label={mode === 'signup' ? fmt(l.passwordWithMin, { min: MIN_PASSWORD }) : l.password}
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
                title={busy ? l.oneMoment : mode === 'signup' ? l.createAccount : l.signIn}
                icon="arrow-forward"
                disabled={busy || !valid}
                onPress={submit}
              />
              {/* Der Hinweis zum Verbinden der Eltern passt nicht für Fachkräfte. */}
              {mode === 'signup' && proEntry ? null : (
                <Text style={styles.hint}>{mode === 'signup' ? l.signupHint : l.signinHint}</Text>
              )}
              {mode === 'signin' ? (
                <Pressable accessibilityRole="button" onPress={startReset} hitSlop={8}>
                  <Text style={[styles.hint, styles.link]}>{l.forgotLink}</Text>
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
  title: { fontSize: 40, fontWeight: '900', color: colors.white, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.white, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  switch: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  card: { gap: spacing.md, padding: spacing.lg },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  link: { color: colors.accent, fontWeight: '700' },
  cardTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
});
