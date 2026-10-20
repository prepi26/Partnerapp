import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Chip, Label, PrimaryButton, showError } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { errorMessage, useFamily } from '@/data/store';
import { addDays, formatDate, toISO, today } from '@/lib/dates';
import { buildReportHtml } from '@/lib/report';
import { colors, spacing } from '@/theme';

const RANGES = [
  { key: '30', label: '30 Tage', days: 30 },
  { key: '90', label: '3 Monate', days: 90 },
  { key: '365', label: '12 Monate', days: 365 },
] as const;

export default function Report() {
  const store = useFamily();
  const { active: plus } = usePlus();
  const [range, setRange] = useState<string>('90');
  const [sections, setSections] = useState({ schedule: true, expenses: true, messages: true, journal: false });
  const [busy, setBusy] = useState(false);

  const to = toISO(today());
  const from = toISO(addDays(today(), -(RANGES.find((r) => r.key === range)?.days ?? 90) + 1));
  const toggle = (key: keyof typeof sections) => setSections((s) => ({ ...s, [key]: !s[key] }));

  const create = async () => {
    if (!plus) {
      router.push('/plus');
      return;
    }
    setBusy(true);
    try {
      const html = buildReportHtml({
        family: store.family,
        me: store.me,
        from,
        to,
        sections,
        changes: store.schedule_changes,
        expenses: store.expenses,
        messages: store.messages,
        journal: store.journal,
      });
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Bericht teilen' });
      }
    } catch (e) {
      showError('PDF nicht erstellt', errorMessage(e));
    }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Ein sachlicher Überblick für Beratungsstelle, Jugendamt, Mediation oder Anwalt – mit Datum und Uhrzeit zu jedem
        Eintrag.
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

      <Card style={{ gap: spacing.md }}>
        <Toggle title="Umgang" text="Tage je Elternteil, Tauschwünsche" value={sections.schedule} onChange={() => toggle('schedule')} />
        <Toggle title="Kosten" text="Ausgaben, Anteile, Saldo" value={sections.expenses} onChange={() => toggle('expenses')} />
        <Toggle title="Nachrichten" text="Vollständiger Verlauf mit Prüfsummen" value={sections.messages} onChange={() => toggle('messages')} />
        <Toggle title="Mein Tagebuch" text="Nur deine eigenen Notizen" value={sections.journal} onChange={() => toggle('journal')} />
      </Card>

      <PrimaryButton
        title={busy ? 'Erstelle PDF…' : plus ? 'PDF erstellen' : 'PDF erstellen (Plus)'}
        icon="document-text"
        disabled={busy || !Object.values(sections).some(Boolean)}
        onPress={create}
      />
      <Text style={styles.small}>
        Der Bericht entsteht auf deinem Handy. Du entscheidest, an wen du ihn weitergibst.
      </Text>
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
