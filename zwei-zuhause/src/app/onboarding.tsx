import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Chip, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { errorMessage, useStore } from '@/data/store';
import { useT } from '@/i18n';
import { isProEntry } from '@/lib/proEntry';
import { colors, gradient, spacing } from '@/theme';

export default function Onboarding() {
  const t = useT();
  const o = t.auth.onboarding;
  const { createFamily, joinFamily, joinAsProfessional, signOut } = useStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'create' | 'join' | 'pro'>(isProEntry() ? 'pro' : 'create');
  const [myName, setMyName] = useState('');
  const [otherName, setOtherName] = useState('');
  const [kids, setKids] = useState('');
  const [code, setCode] = useState('');
  const [proCode, setProCode] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (e) {
      showError(t.common.failed, errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.hero}>
            <Text style={styles.title}>{o.title}</Text>
            <Text style={styles.subtitle}>{o.subtitle}</Text>
          </View>

          <View style={styles.switch}>
            <Chip label={o.createFamily} selected={mode === 'create'} onPress={() => setMode('create')} />
            <Chip label={o.haveCode} tint="accent" selected={mode === 'join'} onPress={() => setMode('join')} />
            <Chip label={o.imProfessional} tint="accent" selected={mode === 'pro'} onPress={() => setMode('pro')} />
          </View>

          <Card style={styles.card}>
            {mode === 'create' ? (
              <>
                <Field label={o.yourName} value={myName} onChangeText={setMyName} placeholder={o.yourNamePlaceholder} />
                <Field
                  label={o.otherName}
                  value={otherName}
                  onChangeText={setOtherName}
                  placeholder={o.otherNamePlaceholder}
                />
                <Field
                  label={o.kids}
                  value={kids}
                  onChangeText={setKids}
                  placeholder={o.kidsPlaceholder}
                />
                <PrimaryButton
                  title={busy ? o.creating : o.createFamily}
                  icon="home"
                  disabled={busy || !myName.trim() || !otherName.trim()}
                  onPress={() => run(() => createFamily(myName.trim(), otherName.trim(), kids.trim()))}
                />
              </>
            ) : mode === 'pro' ? (
              <>
                <Text style={styles.cardText}>{o.proText}</Text>
                <Field
                  label={o.familyCode}
                  value={proCode}
                  onChangeText={(text) => setProCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder={o.familyCodePlaceholder}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  style={styles.code}
                />
                <PrimaryButton
                  title={busy ? o.checking : o.openAccess}
                  icon="key-outline"
                  disabled={busy || proCode.length !== 8}
                  onPress={() => run(() => joinAsProfessional(proCode))}
                />
              </>
            ) : (
              <>
                <Field
                  label={o.otherParentCode}
                  value={code}
                  onChangeText={(text) => setCode(normalizeCode(text))}
                  placeholder={o.otherParentCodePlaceholder}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
                  style={styles.code}
                />
                <PrimaryButton
                  title={busy ? o.connecting : o.connect}
                  icon="link"
                  disabled={busy || code.length !== 6}
                  onPress={() => run(() => joinFamily(code))}
                />
              </>
            )}
          </Card>

          <Text style={styles.privacy}>🔒 {o.privacy}</Text>

          <SecondaryButton title={o.signOut} onPress={signOut} />
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
  cardText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  code: { fontSize: 24, letterSpacing: 6, textAlign: 'center', fontWeight: '800' },
  privacy: { fontSize: 14, color: colors.white, textAlign: 'center', lineHeight: 20, opacity: 0.95 },
});

/**
 * Bereinigt die Eingabe. Wird die ganze geteilte Nachricht eingefügt, nehmen wir das letzte
 * 6-stellige Wort daraus – das ist der Code. Kein maxLength am Feld, sonst kappt iOS das Einfügen.
 */
function normalizeCode(text: string) {
  const upper = text.toUpperCase();
  if (/\s/.test(upper.trim())) {
    const words = upper.match(/\b[A-Z0-9]{6}\b/g);
    if (words) return words[words.length - 1];
  }
  return upper.replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
