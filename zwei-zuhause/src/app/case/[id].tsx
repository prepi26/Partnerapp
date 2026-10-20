import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { parentColor } from '@/components/ParentTag';
import { Card, Chip, EmptyState, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { useCase } from '@/data/case';
import { attempt, errorMessage, useStore } from '@/data/store';
import { ParentKey } from '@/data/types';
import { AGREEMENT_SECTIONS } from '@/lib/agreement';
import { addDays, formatDate, formatTimestamp, formatWeekday, toISO, today } from '@/lib/dates';
import { decisionCategory } from '@/lib/decisions';
import { handoverLabel } from '@/lib/handovers';
import { balanceAB, formatMoney } from '@/lib/money';
import { acceptedChanges, dayInfo, MODELS } from '@/lib/schedule';
import { RANGES, shareReport } from '@/lib/shareReport';
import { colors, spacing } from '@/theme';

/** Fachkraft-Ansicht einer Familie: nur lesen, Berichte als PDF. */
export default function CaseView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { professional_access, userId, revokeProfessional } = useStore();
  const { data, loading, error, reload } = useCase(id);
  const [range, setRange] = useState<string>('90');
  const [busy, setBusy] = useState(false);
  const access = professional_access.find((p) => p.family_id === id && p.professional === userId && !p.revoked_at);

  const accepted = useMemo(() => acceptedChanges(data?.schedule_changes ?? []), [data]);

  if (loading && !data) return <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />;
  if (error || !data) {
    return (
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <EmptyState icon="lock-closed-outline" title="Kein Zugriff" text={error ?? 'Dieser Zugang ist nicht (mehr) aktiv.'} />
        <SecondaryButton title="Neu laden" icon="refresh" onPress={reload} />
      </View>
    );
  }

  const { family } = data;
  const name = (k: ParentKey) => (k === 'a' ? family.name_a : family.name_b);
  const now = today();
  const todayParent = dayInfo(family, accepted, new Map(), now).parent;
  const balance = balanceAB(data.expenses);
  const model = MODELS.find((m) => m.key === family.schedule_model);
  const agreement = data.agreements[0];

  const pdf = async (mode: 'kurz' | 'voll') => {
    setBusy(true);
    try {
      await shareReport({
        family,
        author: `Fachkraft (${access?.label ?? 'Lesezugang'})`,
        from: toISO(addDays(now, -(RANGES.find((r) => r.key === range)?.days ?? 90) + 1)),
        to: toISO(now),
        mode,
        sections: { schedule: true, handovers: true, decisions: true, agreement: true, expenses: true, messages: true },
        changes: data.schedule_changes,
        expenses: data.expenses,
        messages: data.messages,
        decisions: data.decisions,
        handovers: data.handovers,
        agreements: data.agreements,
        journal: [],
      });
    } catch (e) {
      showError('PDF nicht erstellt', errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `${family.name_a} & ${family.name_b}` }} />
      <Card style={{ gap: 4, backgroundColor: parentColor(todayParent).pale }}>
        <Text style={styles.big}>{family.children || 'Kind'}</Text>
        <Text style={styles.text}>
          Heute bei {todayParent ? name(todayParent) : '–'} · {model?.title ?? 'kein Plan'}
        </Text>
        <Text style={styles.meta}>{formatWeekday(now)}</Text>
      </Card>

      <Text style={styles.section}>Bericht als PDF</Text>
      <View style={styles.chips}>
        {RANGES.map((r) => (
          <Chip key={r.key} label={r.label} selected={range === r.key} onPress={() => setRange(r.key)} />
        ))}
      </View>
      <View style={styles.buttons}>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Kurzbericht" icon="document-outline" disabled={busy} onPress={() => pdf('kurz')} />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton title="Vollständig" icon="documents-outline" onPress={() => !busy && pdf('voll')} />
        </View>
      </View>

      <Text style={styles.section}>Übergaben</Text>
      <Card style={{ gap: 6 }}>
        {data.handovers.slice(0, 8).map((h) => (
          <Text key={h.id} style={styles.text}>
            {formatDate(h.day)}: {handoverLabel(h)}
            {h.reply ? ` · ${h.reply === 'confirmed' ? 'bestätigt' : 'widersprochen'}` : ''}
          </Text>
        ))}
        {data.handovers.length === 0 ? <Text style={styles.meta}>Keine erfasst.</Text> : null}
      </Card>

      <Text style={styles.section}>Entscheidungen</Text>
      <Card style={{ gap: 6 }}>
        {data.decisions.slice(0, 8).map((d) => (
          <Text key={d.id} style={styles.text}>
            {decisionCategory(d.category).emoji} {d.title} –{' '}
            {d.status === 'proposed' ? 'offen' : d.status === 'agreed' ? 'zugestimmt' : 'nicht zugestimmt'}
          </Text>
        ))}
        {data.decisions.length === 0 ? <Text style={styles.meta}>Keine erfasst.</Text> : null}
      </Card>

      <Text style={styles.section}>Elternvereinbarung</Text>
      <Card style={{ gap: 6 }}>
        {agreement ? (
          <>
            <Text style={styles.text}>
              Fassung {agreement.version} ·{' '}
              {agreement.accepted_a_at && agreement.accepted_b_at ? 'von beiden angenommen' : 'nicht von beiden angenommen'}
            </Text>
            {AGREEMENT_SECTIONS.filter((s) => agreement.content[s.key]).map((s) => (
              <Text key={s.key} style={styles.text}>
                <Text style={{ fontWeight: '700' }}>{s.title}: </Text>
                {agreement.content[s.key]}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.meta}>Keine Vereinbarung.</Text>
        )}
      </Card>

      <Text style={styles.section}>Kosten</Text>
      <Card style={{ gap: 4 }}>
        <Text style={styles.text}>
          {data.expenses.length} Einträge · Saldo:{' '}
          {balance === 0
            ? 'ausgeglichen'
            : balance > 0
              ? `${family.name_b} → ${family.name_a} ${formatMoney(balance)}`
              : `${family.name_a} → ${family.name_b} ${formatMoney(-balance)}`}
        </Text>
      </Card>

      <Text style={styles.section}>Letzte Nachrichten</Text>
      <Card style={{ gap: spacing.sm }}>
        {data.messages.slice(-10).map((m) => (
          <View key={m.id}>
            <Text style={styles.meta}>
              {name(m.sender_key)} · {formatTimestamp(m.created_at)}
            </Text>
            <Text style={styles.text}>{m.text}</Text>
          </View>
        ))}
        {data.messages.length === 0 ? <Text style={styles.meta}>Keine Nachrichten.</Text> : null}
        {data.messages.length > 10 ? (
          <Text style={styles.meta}>Den vollständigen Verlauf enthält der PDF-Bericht.</Text>
        ) : null}
      </Card>

      {data.child_info.length ? (
        <>
          <Text style={styles.section}>Infos zum Kind</Text>
          <Card style={{ gap: 4 }}>
            {data.child_info.map((i) => (
              <Text key={i.id} style={styles.text}>
                <Text style={{ fontWeight: '700' }}>{i.label}: </Text>
                {i.value}
              </Text>
            ))}
          </Card>
        </>
      ) : null}

      {access ? (
        <SecondaryButton
          title="Zugang beenden"
          icon="close-circle-outline"
          danger
          onPress={() => attempt(() => revokeProfessional(access.id))}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },
  big: { fontSize: 22, fontWeight: '800', color: colors.text },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
  meta: { fontSize: 12, color: colors.textMuted },
});
