import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, Field, PrimaryButton, showError } from '@/components/ui';
import { errorMessage, useStore } from '@/data/store';
import { useT } from '@/i18n';
import { isProEntry } from '@/lib/proEntry';
import { colors, spacing } from '@/theme';

/**
 * Familie anlegen, mit Code beitreten oder (nur beim ersten Start) als Fachkraft einsteigen.
 * Beim ersten Start im Onboarding, später unter „Familie hinzufügen“ für Kinder mit einem anderen Elternteil.
 */
export function FamilyForm({ allowPro = false, onDone }: { allowPro?: boolean; onDone?: () => void }) {
  const t = useT();
  const o = t.auth.onboarding;
  const { createFamily, joinFamily, joinAsProfessional } = useStore();
  const [mode, setMode] = useState<'create' | 'join' | 'pro'>(allowPro && isProEntry() ? 'pro' : 'create');
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
      onDone?.();
    } catch (e) {
      showError(t.common.failed, errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <>
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
    </>
  );
}

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

const styles = StyleSheet.create({
  switch: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
  card: { gap: spacing.md, padding: spacing.lg },
  cardText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  code: { fontSize: 24, letterSpacing: 6, textAlign: 'center', fontWeight: '800' },
});
