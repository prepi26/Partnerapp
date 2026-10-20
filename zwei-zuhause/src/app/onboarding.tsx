import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Chip, Field, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { errorMessage, useStore } from '@/data/store';
import { colors, gradient, spacing } from '@/theme';

export default function Onboarding() {
  const { createFamily, joinFamily, joinAsProfessional, signOut } = useStore();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'create' | 'join' | 'pro'>('create');
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
          keyboardDismissMode="on-drag"
        >
          <View style={styles.hero}>
            <Text style={styles.title}>Eure Familie</Text>
            <Text style={styles.subtitle}>
              Ein Elternteil legt die Familie an und bekommt einen Code für den anderen. Du kannst auch erst einmal
              allein starten – Kalender, Kosten und Tagebuch funktionieren sofort.
            </Text>
          </View>

          <View style={styles.switch}>
            <Chip label="Familie anlegen" selected={mode === 'create'} onPress={() => setMode('create')} />
            <Chip label="Ich habe einen Code" tint="accent" selected={mode === 'join'} onPress={() => setMode('join')} />
            <Chip label="Ich bin Fachkraft" tint="accent" selected={mode === 'pro'} onPress={() => setMode('pro')} />
          </View>

          <Card style={styles.card}>
            {mode === 'create' ? (
              <>
                <Field label="Dein Name" value={myName} onChangeText={setMyName} placeholder="z. B. Sandra" />
                <Field
                  label="Name des anderen Elternteils"
                  value={otherName}
                  onChangeText={setOtherName}
                  placeholder="z. B. Thomas"
                />
                <Field
                  label="Kind / Kinder (Vornamen)"
                  value={kids}
                  onChangeText={setKids}
                  placeholder="z. B. Mia, Paul"
                />
                <PrimaryButton
                  title={busy ? 'Lege an…' : 'Familie anlegen'}
                  icon="home"
                  disabled={busy || !myName.trim() || !otherName.trim()}
                  onPress={() => run(() => createFamily(myName.trim(), otherName.trim(), kids.trim()))}
                />
              </>
            ) : mode === 'pro' ? (
              <>
                <Text style={styles.cardText}>
                  Für Jugendamt, Beratungsstelle, Mediation, Verfahrensbeistand oder Anwalt: Die Eltern erstellen in der
                  App einen 8-stelligen Code für dich. Der Zugang ist kostenlos und nur lesend.
                </Text>
                <Field
                  label="Code der Familie"
                  value={proCode}
                  onChangeText={(t) => setProCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder="8 Zeichen"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  style={styles.code}
                />
                <PrimaryButton
                  title={busy ? 'Prüfe…' : 'Zugang öffnen'}
                  icon="key-outline"
                  disabled={busy || proCode.length !== 8}
                  onPress={() => run(() => joinAsProfessional(proCode))}
                />
              </>
            ) : (
              <>
                <Field
                  label="Code vom anderen Elternteil"
                  value={code}
                  onChangeText={(t) => setCode(normalizeCode(t))}
                  placeholder="z. B. KMPQXT"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
                  style={styles.code}
                />
                <PrimaryButton
                  title={busy ? 'Verbinde…' : 'Verbinden'}
                  icon="link"
                  disabled={busy || code.length !== 6}
                  onPress={() => run(() => joinFamily(code))}
                />
              </>
            )}
          </Card>

          <Text style={styles.privacy}>
            🔒 Nur ihr beide seht Kalender, Kosten und Nachrichten. Dein Tagebuch sieht niemand außer dir.
          </Text>

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
