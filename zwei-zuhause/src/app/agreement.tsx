import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, EmptyState, PrimaryButton, SecondaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { formatTimestamp } from '@/lib/dates';
import { AGREEMENT_NOTE, AGREEMENT_SECTIONS } from '@/lib/agreement';
import { colors, spacing } from '@/theme';

export default function AgreementScreen() {
  const { agreements, me, otherKey, otherName, otherJoined, nameOf, acceptAgreement } = useFamily();
  const [versionId, setVersionId] = useState<string | null>(null);
  const latest = agreements[0];
  const shown = agreements.find((a) => a.id === versionId) ?? latest;

  if (!latest) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <EmptyState
          icon="document-text-outline"
          title="Eure Elternvereinbarung"
          text="Haltet fest, was für euch gilt: Rhythmus, Übergaben, Ferien, Kosten, Kommunikation. 17 Leitfragen helfen beim Formulieren."
        />
        <PrimaryButton title="Vereinbarung beginnen" icon="create-outline" onPress={() => router.push('/agreement-edit')} />
        <Text style={styles.note}>{AGREEMENT_NOTE}</Text>
      </ScrollView>
    );
  }

  const acceptedAt = (k: 'a' | 'b') => (k === 'a' ? shown.accepted_a_at : shown.accepted_b_at);
  const isLatest = shown.id === latest.id;
  const iAccepted = !!acceptedAt(me);
  const both = !!shown.accepted_a_at && !!shown.accepted_b_at;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {agreements.length > 1 ? (
        <View style={styles.chips}>
          {agreements.map((a) => (
            <Chip
              key={a.id}
              label={`Fassung ${a.version}`}
              selected={a.id === shown.id}
              onPress={() => setVersionId(a.id)}
            />
          ))}
        </View>
      ) : null}

      <Card style={[styles.status, both ? styles.ok : styles.open]}>
        <Text style={styles.statusTitle}>
          {both ? '✓ Von beiden angenommen' : isLatest ? 'Wartet auf Zustimmung' : 'Ältere Fassung'}
        </Text>
        {(['a', 'b'] as const).map((k) => (
          <Text key={k} style={styles.statusLine}>
            {nameOf(k)}: {acceptedAt(k) ? `zugestimmt am ${formatTimestamp(acceptedAt(k)!)}` : 'noch nicht zugestimmt'}
          </Text>
        ))}
        <Text style={styles.hash}>Fassung {shown.version} · Prüfsumme {shown.hash.slice(0, 16)}</Text>
      </Card>

      {isLatest && !iAccepted ? (
        <PrimaryButton title="Ich stimme dieser Fassung zu" icon="checkmark-done" onPress={() => attempt(() => acceptAgreement(shown.id))} />
      ) : null}
      {isLatest && iAccepted && !acceptedAt(otherKey) ? (
        <Text style={styles.note}>
          {otherJoined ? `${otherName} wurde benachrichtigt.` : `Sobald ${otherName} verbunden ist, kann er/sie zustimmen.`}
        </Text>
      ) : null}

      {AGREEMENT_SECTIONS.filter((s) => shown.content[s.key]?.trim()).map((s) => (
        <View key={s.key} style={{ gap: 4 }}>
          <Text style={styles.section}>{s.title}</Text>
          <Text style={styles.text}>{shown.content[s.key]}</Text>
        </View>
      ))}

      {isLatest ? (
        <SecondaryButton title="Änderung vorschlagen" icon="create-outline" onPress={() => router.push('/agreement-edit')} />
      ) : null}
      <Text style={styles.note}>
        Jede Änderung wird eine neue Fassung, der beide neu zustimmen. Ältere Fassungen bleiben unverändert erhalten.{'\n\n'}
        {AGREEMENT_NOTE}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  status: { gap: 4 },
  ok: { backgroundColor: colors.primaryPale },
  open: { backgroundColor: colors.parentBPale },
  statusTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  statusLine: { fontSize: 14, color: colors.text },
  hash: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  section: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
});
