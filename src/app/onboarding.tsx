import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/DateField';
import { Card, Chip, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { errorMessage, useStore } from '@/data/store';
import { toISO, today } from '@/lib/dates';
import { colors, gradient, spacing } from '@/theme';

export default function Onboarding() {
  const { createCouple, joinCouple, signOut } = useStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [startDate, setStartDate] = useState(toISO(today()));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      showError('Das hat nicht geklappt', errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.title}>Verbindet euch</Text>
            <Text style={styles.subtitle}>
              Einer von euch legt euer Paar an und bekommt einen Code. Der andere gibt diesen Code ein.
            </Text>
          </View>

          <View style={styles.switch}>
            <Chip label="Paar anlegen" selected={mode === 'create'} onPress={() => setMode('create')} />
            <Chip label="Ich habe einen Code" tint="blue" selected={mode === 'join'} onPress={() => setMode('join')} />
          </View>

          <Card style={styles.card}>
            {mode === 'create' ? (
              <>
                <Field label="Dein Name" value={myName} onChangeText={setMyName} placeholder="z. B. Lena" />
                <Field
                  label="Name deines Schatzes"
                  value={partnerName}
                  onChangeText={setPartnerName}
                  placeholder="z. B. Max"
                />
                <DateField label="Zusammen seit" value={startDate} onChange={setStartDate} maximumDate={today()} />
                <PrimaryButton
                  title={busy ? 'Lege an…' : 'Paar anlegen'}
                  icon="heart"
                  disabled={busy || !myName.trim() || !partnerName.trim()}
                  onPress={() => run(() => createCouple(myName.trim(), partnerName.trim(), startDate))}
                />
              </>
            ) : (
              <>
                <Field
                  label="Code von deinem Schatz"
                  value={code}
                  onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="z. B. K7P2QX"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  style={styles.code}
                />
                <PrimaryButton
                  title={busy ? 'Verbinde…' : 'Verbinden'}
                  icon="link"
                  disabled={busy || code.length !== 6}
                  onPress={() => run(() => joinCouple(code))}
                />
              </>
            )}
          </Card>

          <SecondaryButton title="Abmelden" onPress={signOut} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 34, fontWeight: '900', color: colors.white, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.white, textAlign: 'center', opacity: 0.95, lineHeight: 22 },
  switch: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  card: { gap: spacing.md, padding: spacing.lg },
  code: { fontSize: 24, letterSpacing: 6, textAlign: 'center', fontWeight: '800' },
});
