import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DrawingCanvas, DrawingView } from '@/components/Drawing';
import { Card, Chip, confirmDestructive, PrimaryButton, SecondaryButton, tap } from '@/components/ui';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { attempt, useCouple } from '@/data/store';
import { Stroke } from '@/data/types';
import { formatShort } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

const PALETTE = ['#FF5FA2', '#C58BF2', '#38C8F2', '#E5484D', '#FFB020', '#2E1F47'];
const WIDTHS = [
  { label: 'Fein', value: 8 },
  { label: 'Mittel', value: 16 },
  { label: 'Dick', value: 30 },
];

/** Kleines Herz als Beispiel für die Plus-Vorschau. */
const SAMPLE: Stroke[] = [
  {
    c: '#FF5FA2',
    w: 28,
    p: [
      [500, 820],
      [260, 590],
      [200, 420],
      [260, 280],
      [380, 240],
      [500, 340],
      [620, 240],
      [740, 280],
      [800, 420],
      [740, 590],
      [500, 820],
    ],
  },
];

function timeLabel(iso: string) {
  const d = new Date(iso);
  return `${formatShort(d)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Draw() {
  const { drawings, userId, partnerName, sendDrawing, removeDrawing } = useCouple();
  const { active: plus } = usePlus();
  const locked = purchasesAvailable && !plus;
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(PALETTE[0]);
  const [width, setWidth] = useState(WIDTHS[1].value);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    tap();
    setSending(true);
    if (await attempt(() => sendDrawing(strokes))) {
      setStrokes([]);
      setSent(true);
    }
    setSending(false);
  };

  if (locked) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <DrawingView strokes={SAMPLE} style={styles.sample} />
        <Text style={styles.title}>Malt euch etwas 🎨</Text>
        <Text style={styles.text}>
          Mit Wir zwei Plus erscheint deine Zeichnung bei {partnerName} direkt auf dem Home- und Sperrbildschirm.
        </Text>
        <PrimaryButton title="Wir zwei Plus ansehen" icon="sparkles" onPress={() => router.push('/plus')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <DrawingCanvas
        strokes={strokes}
        onChange={(next) => {
          setSent(false);
          setStrokes(next);
        }}
        color={color}
        width={width}
      />

      <View style={styles.palette}>
        {PALETTE.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Farbe ${c}`}
            onPress={() => setColor(c)}
            style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
          />
        ))}
      </View>
      <View style={styles.row}>
        {WIDTHS.map((w) => (
          <Chip key={w.value} label={w.label} selected={width === w.value} onPress={() => setWidth(w.value)} />
        ))}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <SecondaryButton title="Rückgängig" icon="arrow-undo" onPress={() => setStrokes(strokes.slice(0, -1))} />
        </View>
        <View style={{ flex: 1 }}>
          <SecondaryButton title="Leeren" icon="trash-outline" onPress={() => setStrokes([])} />
        </View>
      </View>
      <PrimaryButton
        title={sending ? 'Sende…' : `An ${partnerName} senden`}
        icon="send"
        disabled={sending || strokes.length === 0}
        onPress={send}
      />
      {sent ? <Text style={styles.sent}>Gesendet! 💌 {partnerName} sieht sie gleich auf dem Widget.</Text> : null}

      {drawings.length > 0 ? <Text style={styles.section}>Eure Zeichnungen</Text> : null}
      <View style={styles.gallery}>
        {drawings.map((d) => {
          const mine = d.from_id === userId;
          return (
            <Pressable
              key={d.id}
              onLongPress={() =>
                mine &&
                confirmDestructive('Zeichnung löschen?', 'Sie verschwindet für euch beide.', 'Löschen', () =>
                  attempt(() => removeDrawing(d.id)),
                )
              }
              style={styles.thumbWrap}
            >
              <Card style={styles.thumbCard}>
                <DrawingView strokes={d.strokes} style={styles.thumb} />
                <Text style={styles.thumbLabel}>
                  {mine ? 'Von dir' : `Von ${partnerName}`} · {timeLabel(d.created_at)}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        Tipp: Leg das Widget „Wir zwei · Zeichnung“ auf deinen Home- oder Sperrbildschirm.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  palette: { flexDirection: 'row', justifyContent: 'space-between' },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  sent: { fontSize: 14, fontWeight: '700', color: colors.pink, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  thumbWrap: { width: '47%', flexGrow: 1 },
  thumbCard: { padding: spacing.sm, gap: 6 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  thumbLabel: { fontSize: 12, color: colors.textMuted },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  sample: { width: 220, height: 220, alignSelf: 'center', borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
