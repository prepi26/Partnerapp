import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { attempt, errorMessage, useFamily } from '@/data/store';
import { ProfessionalAccess } from '@/data/types';
import { Dict, fmt, useT } from '@/i18n';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { colors, spacing } from '@/theme';

const DURATIONS = [
  { days: 14, labelKey: 'weeks2' },
  { days: 30, labelKey: 'month1' },
  { days: 90, labelKey: 'months3' },
  { days: 180, labelKey: 'months6' },
] as const;

function state(p: ProfessionalAccess, otherJoined: boolean, t: Dict) {
  const tp = t.pro.professionals;
  if (p.revoked_at) return { text: fmt(tp.revokedAt, { date: formatTimestamp(p.revoked_at) }), color: colors.textMuted, active: false };
  if (new Date(p.expires_at) < new Date()) return { text: tp.expired, color: colors.textMuted, active: false };
  if (!p.other_approved_at && otherJoined) return { text: tp.awaitingApproval, color: colors.warning, active: true };
  if (!p.professional) return { text: tp.codeNotRedeemed, color: colors.warning, active: true };
  return { text: fmt(tp.activeUntil, { date: formatDate(p.expires_at.slice(0, 10)) }), color: colors.primary, active: true };
}

export default function Professionals() {
  const { professional_access, me, otherName, otherJoined, nameOf, inviteProfessional, approveProfessional, revokeProfessional } =
    useFamily();
  const t = useT();
  const tp = t.pro.professionals;
  const [label, setLabel] = useState('');
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    setBusy(true);
    try {
      const code = await inviteProfessional(label.trim(), days);
      setLabel('');
      await Share.share({
        message: fmt(tp.shareMessage, { code }),
      });
    } catch (e) {
      showError(t.common.failed, errorMessage(e));
    }
    setBusy(false);
  };

  const revoke = (p: ProfessionalAccess) =>
    confirmDestructive(tp.revokeTitle, fmt(tp.revokeText, { label: p.label }), tp.revoke, () => {
      attempt(() => revokeProfessional(p.id));
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          {tp.intro}
          {otherJoined ? ` ${fmt(tp.introOtherMustApprove, { name: otherName })}` : ''} {tp.introBothCanRevoke}
        </Text>

        <Card style={{ gap: spacing.md }}>
          <Field
            label={tp.whoLabel}
            value={label}
            onChangeText={setLabel}
            placeholder={tp.whoPlaceholder}
            maxLength={200}
          />
          <Label>{tp.howLong}</Label>
          <View style={styles.chips}>
            {DURATIONS.map((d) => (
              <Chip key={d.days} label={tp.durations[d.labelKey]} selected={days === d.days} onPress={() => setDays(d.days)} />
            ))}
          </View>
          <PrimaryButton
            title={busy ? tp.creatingCode : tp.createCode}
            icon="key-outline"
            disabled={busy || !label.trim()}
            onPress={invite}
          />
        </Card>

        {professional_access.map((p) => {
          const s = state(p, otherJoined, t);
          const needsMyApproval = s.active && !p.other_approved_at && p.invited_key !== me && !p.revoked_at;
          return (
            <Card key={p.id} style={{ gap: 4 }}>
              <Text style={styles.title}>{p.label}</Text>
              <Text style={[styles.state, { color: s.color }]}>● {s.text}</Text>
              <Text style={styles.meta}>
                {p.invited_key === me
                  ? fmt(tp.invitedByMe, { date: formatTimestamp(p.created_at) })
                  : fmt(tp.invitedBy, { name: nameOf(p.invited_key), date: formatTimestamp(p.created_at) })}
                {p.joined_at ? ` · ${fmt(tp.redeemed, { date: formatTimestamp(p.joined_at) })}` : ''}
              </Text>
              {!p.professional && s.active ? <Text style={styles.code}>{fmt(tp.code, { code: p.code })}</Text> : null}
              {needsMyApproval ? (
                <View style={styles.buttons}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton title={tp.approve} icon="checkmark" onPress={() => attempt(() => approveProfessional(p.id))} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton title={tp.decline} icon="close" danger onPress={() => revoke(p)} />
                  </View>
                </View>
              ) : s.active ? (
                <SecondaryButton title={tp.revoke} icon="close-circle-outline" danger onPress={() => revoke(p)} />
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
