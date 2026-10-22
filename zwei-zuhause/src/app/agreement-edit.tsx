import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { WriteGate } from '@/components/SubscriptionBanner';
import { Field, PrimaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { AgreementContent } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { agreementSections } from '@/lib/agreement';
import { close } from '@/lib/nav';
import { handoverWhere, models } from '@/lib/schedule';
import { colors, spacing } from '@/theme';

export default function AgreementEdit() {
  const t = useT();
  const { agreements, family, otherName, saveAgreement } = useFamily();
  const sections = agreementSections(t);
  const latest = agreements[0];
  const [content, setContent] = useState<AgreementContent>(() => {
    if (latest) return { ...latest.content };
    // Erster Entwurf: das gewählte Umgangsmodell schon eintragen.
    const model = models(t).find((m) => m.key === family.schedule_model);
    const draft: AgreementContent = {};
    if (family.schedule_model !== 'none' && model) draft.betreuung = `${model.title}. ${model.text}`;
    if (handoverWhere(family, t)) draft.uebergabe = fmt(t.family.agreementEdit.handoverDraft, { where: handoverWhere(family, t) });
    return draft;
  });
  const [busy, setBusy] = useState(false);

  const changed = sections.some((s) => (content[s.key] ?? '').trim() !== (latest?.content[s.key] ?? '').trim());
  const filled = sections.filter((s) => content[s.key]?.trim()).length;

  const save = async () => {
    setBusy(true);
    const clean: AgreementContent = {};
    for (const s of sections) if (content[s.key]?.trim()) clean[s.key] = content[s.key].trim();
    const ok = await attempt(() => saveAgreement(clean));
    if (ok) close();
    else setBusy(false);
  };

  return (
    <WriteGate>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>{fmt(t.family.agreementEdit.intro, { name: otherName })}</Text>
          {sections.map((s) => (
            <Field
              key={s.key}
              label={s.title}
              value={content[s.key] ?? ''}
              onChangeText={(text) => setContent((c) => ({ ...c, [s.key]: text }))}
              placeholder={s.questions}
              multiline
              maxLength={3000}
            />
          ))}
          <PrimaryButton
            title={busy ? t.common.saving : latest ? t.family.agreementEdit.proposeNew : t.family.agreementEdit.saveAccept}
            icon="checkmark"
            disabled={busy || filled === 0 || !changed}
            onPress={save}
          />
          <Text style={styles.hint}>{fmt(t.family.agreementEdit.filled, { n: filled, total: sections.length })}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </WriteGate>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
