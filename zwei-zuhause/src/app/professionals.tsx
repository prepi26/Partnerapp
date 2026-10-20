import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { attempt, errorMessage, useFamily } from '@/data/store';
import { ProfessionalAccess } from '@/data/types';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { colors, spacing } from '@/theme';

const DURATIONS = [
  { days: 14, label: '2 Wochen' },
  { days: 30, label: '1 Monat' },
  { days: 90, label: '3 Monate' },
  { days: 180, label: '6 Monate' },
];

function state(p: ProfessionalAccess, otherJoined: boolean) {
  if (p.revoked_at) return { text: `Widerrufen am ${formatTimestamp(p.revoked_at)}`, color: colors.textMuted, active: false };
  if (new Date(p.expires_at) < new Date()) return { text: 'Abgelaufen', color: colors.textMuted, active: false };
  if (!p.other_approved_at && otherJoined) return { text: 'Wartet auf Zustimmung', color: colors.warning, active: true };
  if (!p.professional) return { text: 'Code noch nicht eingelöst', color: colors.warning, active: true };
  return { text: `Aktiv bis ${formatDate(p.expires_at.slice(0, 10))}`, color: colors.primary, active: true };
}

export default function Professionals() {
  const { professional_access, me, otherName, otherJoined, nameOf, inviteProfessional, approveProfessional, revokeProfessional } =
    useFamily();
  const [label, setLabel] = useState('');
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    setBusy(true);
    try {
      const code = await inviteProfessional(label.trim(), days);
      setLabel('');
      await Share.share({
        message:
          `Zugang zu unserer Familie in „Zwei Zuhause“ (nur lesen, ohne mein privates Tagebuch): ` +
          `App laden, Konto erstellen, „Ich bin Fachkraft“ wählen und diesen Code eingeben: ${code}`,
      });
    } catch (e) {
      showError('Das hat nicht geklappt', errorMessage(e));
    }
    setBusy(false);
  };

  const revoke = (p: ProfessionalAccess) =>
    confirmDestructive('Zugang widerrufen?', `${p.label} sieht danach nichts mehr.`, 'Widerrufen', () => {
      attempt(() => revokeProfessional(p.id));
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Jugendamt, Beratungsstelle, Mediation, Verfahrensbeistand oder Anwalt können eure Familie lesen – Kalender,
          Übergaben, Kosten, Entscheidungen, Vereinbarung und Nachrichten. Euer privates Tagebuch nie.
          {otherJoined ? ` ${otherName} muss jedem Zugang zustimmen.` : ''} Beide können jederzeit widerrufen.
        </Text>

        <Card style={{ gap: spacing.md }}>
          <Field
            label="Wer bekommt Zugang?"
            value={label}
            onChangeText={setLabel}
            placeholder="z. B. Jugendamt Köln, Frau Schmidt"
            maxLength={200}
          />
          <Label>Für wie lange?</Label>
          <View style={styles.chips}>
            {DURATIONS.map((d) => (
              <Chip key={d.days} label={d.label} selected={days === d.days} onPress={() => setDays(d.days)} />
            ))}
          </View>
          <PrimaryButton
            title={busy ? 'Erstelle Code…' : 'Code erstellen & teilen'}
            icon="key-outline"
            disabled={busy || !label.trim()}
            onPress={invite}
          />
        </Card>

        {professional_access.map((p) => {
          const s = state(p, otherJoined);
          const needsMyApproval = s.active && !p.other_approved_at && p.invited_key !== me && !p.revoked_at;
          return (
            <Card key={p.id} style={{ gap: 4 }}>
              <Text style={styles.title}>{p.label}</Text>
              <Text style={[styles.state, { color: s.color }]}>● {s.text}</Text>
              <Text style={styles.meta}>
                Eingeladen von {p.invited_key === me ? 'dir' : nameOf(p.invited_key)} am {formatTimestamp(p.created_at)}
                {p.joined_at ? ` · eingelöst ${formatTimestamp(p.joined_at)}` : ''}
              </Text>
              {!p.professional && s.active ? <Text style={styles.code}>Code: {p.code}</Text> : null}
              {needsMyApproval ? (
                <View style={styles.buttons}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton title="Zustimmen" icon="checkmark" onPress={() => attempt(() => approveProfessional(p.id))} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton title="Ablehnen" icon="close" danger onPress={() => revoke(p)} />
                  </View>
                </View>
              ) : s.active ? (
                <SecondaryButton title="Widerrufen" icon="close-circle-outline" danger onPress={() => revoke(p)} />
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  state: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 12, color: colors.textMuted },
  code: { fontSize: 18, fontWeight: '800', letterSpacing: 3, color: colors.primary, marginVertical: 4 },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
