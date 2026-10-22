import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Chip, Label, PrimaryButton, showError } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { errorMessage, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { addDays, formatDate, toISO, today } from '@/lib/dates';
import { ReportSection } from '@/lib/report';
import { RANGES, ranges, shareReport } from '@/lib/shareReport';
import { colors, spacing } from '@/theme';

const SECTIONS: ReportSection[] = [
  'schedule',
  'handovers',
  'decisions',
  'agreement',
  'expenses',
  'messages',
  'documents',
  'journal',
];

export default function Report() {
  const store = useFamily();
  const { active: plus } = usePlus();
  const t = useT();
  const tr = t.pro.report;
  const [mode, setMode] = useState<'kurz' | 'voll'>('kurz');
  const [range, setRange] = useState<string>('90');
  const [sections, setSections] = useState<Record<ReportSection, boolean>>({
    schedule: true,
    handovers: true,
    decisions: true,
    agreement: true,
    expenses: true,
    messages: true,
    documents: true,
    journal: false,
  });
  const [busy, setBusy] = useState(false);

  const to = toISO(today());
  const from = toISO(addDays(today(), -(RANGES.find((r) => r.key === range)?.days ?? 90) + 1));
  const toggle = (key: ReportSection) => setSections((s) => ({ ...s, [key]: !s[key] }));

  const create = async () => {
    if (!plus) {
      router.push('/plus');
      return;
    }
    setBusy(true);
    try {
      await shareReport({
        family: store.family,
        author: store.myName,
        journalOwner: store.me,
        from,
        to,
        mode,
        sections,
        changes: store.schedule_changes,
        expenses: store.expenses,
        messages: store.messages,
        decisions: store.decisions,
        handovers: store.handovers,
        agreements: store.agreements,
        documents: store.documents,
        journal: store.journal,
      });
    } catch (e) {
      showError(t.pro.pdfFailed, errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        {tr.intro}
      </Text>
      <View style={styles.chips}>
        <Chip label={tr.shortReport} selected={mode === 'kurz'} onPress={() => setMode('kurz')} />
        <Chip label={tr.fullReport} tint="accent" selected={mode === 'voll'} onPress={() => setMode('voll')} />
      </View>
      <Text style={styles.small}>
        {mode === 'kurz'
          ? tr.shortHint
          : tr.fullHint}
      </Text>

      <Label>{tr.period}</Label>
      <View style={styles.chips}>
        {ranges(t).map((r) => (
          <Chip key={r.key} label={r.label} selected={range === r.key} onPress={() => setRange(r.key)} />
        ))}
      </View>
      <Text style={styles.small}>
        {fmt(tr.fromTo, { from: formatDate(from), to: formatDate(to) })}
      </Text>

      {mode === 'voll' ? (
        <Card style={{ gap: spacing.md }}>
          {SECTIONS.map((key) => (
            <Toggle
              key={key}
              title={tr.sections[key].title}
              text={tr.sections[key].text}
              value={sections[key]}
              onChange={() => toggle(key)}
            />
          ))}
        </Card>
      ) : null}

      <PrimaryButton
        title={busy ? tr.creatingPdf : plus ? tr.createPdf : tr.createPdfPlus}
        icon="document-text"
        disabled={busy || (mode === 'voll' && !Object.values(sections).some(Boolean))}
        onPress={create}
      />
      <Text style={styles.small}>{tr.footer}</Text>
    </ScrollView>
  );
}

function Toggle({ title, text, value, onChange }: { title: string; text: string; value: boolean; onChange: () => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleText}>{text}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 15, color: colors.text, lineHeight: 22 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  small: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  toggleText: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
