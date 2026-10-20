import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Chip, Label, PrimaryButton, showError } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { errorMessage, useFamily } from '@/data/store';
import { addDays, formatDate, toISO, today } from '@/lib/dates';
import { ReportSection } from '@/lib/report';
import { RANGES, shareReport } from '@/lib/shareReport';
import { colors, spacing } from '@/theme';

const SECTIONS: { key: ReportSection; title: string; text: string }[] = [
  { key: 'schedule', title: 'Umgang', text: 'Tage je Elternteil, Tauschwünsche' },
  { key: 'handovers', title: 'Übergaben', text: 'Pünktlich, verspätet, ausgefallen' },
  { key: 'decisions', title: 'Entscheidungen', text: 'Fragen und Antworten' },
  { key: 'agreement', title: 'Elternvereinbarung', text: 'Aktuelle Fassung mit Zustimmungen' },
  { key: 'expenses', title: 'Kosten', text: 'Ausgaben, Anteile, Saldo' },
  { key: 'messages', title: 'Nachrichten', text: 'Vollständiger Verlauf mit Prüfsummen' },
  { key: 'journal', title: 'Mein Tagebuch', text: 'Nur deine eigenen Notizen' },
];

export default function Report() {
  const store = useFamily();
  const { active: plus } = usePlus();
  const [mode, setMode] = useState<'kurz' | 'voll'>('kurz');
  const [range, setRange] = useState<string>('90');
  const [sections, setSections] = useState<Record<ReportSection, boolean>>({
    schedule: true,
    handovers: true,
    decisions: true,
    agreement: true,
    expenses: true,
    messages: true,
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
        journal: store.journal,
      });
    } catch (e) {
      showError('PDF nicht erstellt', errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Für Beratungsstelle, Jugendamt, Mediation oder Anwalt – mit Datum und Uhrzeit zu jedem Eintrag, vollständig und
        chronologisch.
      </Text>
      <View style={styles.chips}>
        <Chip label="Kurzbericht (1 Seite)" selected={mode === 'kurz'} onPress={() => setMode('kurz')} />
        <Chip label="Vollständig" tint="accent" selected={mode === 'voll'} onPress={() => setMode('voll')} />
      </View>
      <Text style={styles.small}>
        {mode === 'kurz'
          ? 'Zahlen auf einen Blick: Betreuungstage, Übergaben, Antwortzeiten, Kosten, offene Entscheidungen. Ideal fürs Erstgespräch.'
          : 'Alle Einträge im Detail.'}
      </Text>

      <Label>Zeitraum</Label>
      <View style={styles.chips}>
        {RANGES.map((r) => (
          <Chip key={r.key} label={r.label} selected={range === r.key} onPress={() => setRange(r.key)} />
        ))}
      </View>
      <Text style={styles.small}>
        {formatDate(from)} bis {formatDate(to)}
      </Text>

      {mode === 'voll' ? (
        <Card style={{ gap: spacing.md }}>
          {SECTIONS.map((s) => (
            <Toggle key={s.key} title={s.title} text={s.text} value={sections[s.key]} onChange={() => toggle(s.key)} />
          ))}
        </Card>
      ) : null}

      <PrimaryButton
        title={busy ? 'Erstelle PDF…' : plus ? 'PDF erstellen' : 'PDF erstellen (Plus)'}
        icon="document-text"
        disabled={busy || (mode === 'voll' && !Object.values(sections).some(Boolean))}
        onPress={create}
      />
      <Text style={styles.small}>Der Bericht entsteht auf deinem Handy. Du entscheidest, an wen du ihn weitergibst.</Text>
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
