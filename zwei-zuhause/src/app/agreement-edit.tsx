import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Field, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { AgreementContent } from '@/data/types';
import { AGREEMENT_SECTIONS } from '@/lib/agreement';
import { MODELS } from '@/lib/schedule';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

export default function AgreementEdit() {
  const { agreements, family, otherName, saveAgreement } = useFamily();
  const latest = agreements[0];
  const [content, setContent] = useState<AgreementContent>(() => {
    if (latest) return { ...latest.content };
    // Erster Entwurf: das gewählte Umgangsmodell schon eintragen.
    const model = MODELS.find((m) => m.key === family.schedule_model);
    return family.schedule_model !== 'none' && model ? { betreuung: `${model.title}. ${model.text}` } : {};
  });
  const [busy, setBusy] = useState(false);

  const changed = AGREEMENT_SECTIONS.some((s) => (content[s.key] ?? '').trim() !== (latest?.content[s.key] ?? '').trim());
  const filled = AGREEMENT_SECTIONS.filter((s) => content[s.key]?.trim()).length;

  const save = async () => {
    setBusy(true);
    const clean: AgreementContent = {};
    for (const s of AGREEMENT_SECTIONS) if (content[s.key]?.trim()) clean[s.key] = content[s.key].trim();
    const ok = await attempt(() => saveAgreement(clean));
    if (ok) close();
    else setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Schreib in eigenen Worten, was gelten soll. Leere Abschnitte bleiben einfach weg. Mit dem Speichern stimmst du
          dieser Fassung zu; {otherName} stimmt danach zu oder schlägt eine Änderung vor.
        </Text>
        {AGREEMENT_SECTIONS.map((s) => (
          <Field
            key={s.key}
            label={s.title}
            value={content[s.key] ?? ''}
            onChangeText={(t) => setContent((c) => ({ ...c, [s.key]: t }))}
            placeholder={s.questions}
            multiline
            maxLength={3000}
          />
        ))}
        <PrimaryButton
          title={busy ? 'Speichere…' : latest ? 'Neue Fassung vorschlagen' : 'Speichern & zustimmen'}
          icon="checkmark"
          disabled={busy || filled === 0 || !changed}
          onPress={save}
        />
        <Text style={styles.hint}>{filled} von {AGREEMENT_SECTIONS.length} Abschnitten ausgefüllt</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
