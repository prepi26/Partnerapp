import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, gradient, spacing } from '@/theme';

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  const sendCode = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
    setBusy(false);
    if (error) {
      const tooMany = /rate|seconds|too many/i.test(error.message);
      showError(
        'Code konnte nicht gesendet werden',
        tooMany ? 'Zu viele Versuche. Warte kurz und probier es dann nochmal.' : error.message,
      );
      return;
    }
    setStep('code');
  };

  const verify = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: cleanEmail, token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) showError('Anmeldung fehlgeschlagen', 'Der Code stimmt nicht oder ist abgelaufen.');
  };

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.emoji}>🌴💖🌊</Text>
            <Text style={styles.title}>Wir zwei</Text>
            <Text style={styles.subtitle}>Eure gemeinsame App – auf beiden Handys immer gleich.</Text>
          </View>

          <Card style={styles.card}>
            {step === 'email' ? (
              <>
                <Field
                  label="Deine E-Mail"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@beispiel.de"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
                <PrimaryButton
                  title={busy ? 'Sende…' : 'Code per E-Mail senden'}
                  icon="mail"
                  disabled={busy || !/^\S+@\S+\.\S+$/.test(cleanEmail)}
                  onPress={sendCode}
                />
                <Text style={styles.hint}>Kein Passwort nötig – du bekommst einen Code per E-Mail.</Text>
              </>
            ) : (
              <>
                <Text style={styles.info}>Wir haben dir einen Code an {cleanEmail} geschickt.</Text>
                <Field
                  label="Code aus der E-Mail"
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={10}
                  autoFocus
                />
                <PrimaryButton
                  title={busy ? 'Prüfe…' : 'Anmelden'}
                  icon="heart"
                  disabled={busy || code.trim().length < 6}
                  onPress={verify}
                />
                <SecondaryButton
                  title="Andere E-Mail"
                  onPress={() => {
                    setCode('');
                    setStep('email');
                  }}
                />
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 44 },
  title: { fontSize: 44, fontWeight: '900', color: colors.white, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.white, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  card: { gap: spacing.md, padding: spacing.lg },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  info: { fontSize: 15, color: colors.text, lineHeight: 21 },
});
