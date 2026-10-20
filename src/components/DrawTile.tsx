import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCouple } from '@/data/store';
import { colors, spacing } from '@/theme';

import { DrawingView } from './Drawing';
import { Card } from './ui';

/** Startseite: zum Malen – mit Vorschau der letzten Zeichnung vom Partner. */
export function DrawTile() {
  const { drawings, userId, partnerName } = useCouple();
  const latest = drawings.find((d) => d.from_id !== userId);

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/draw')}>
      {({ pressed }) => (
        <Card style={[styles.tile, pressed && { opacity: 0.7 }]}>
          {latest ? (
            <DrawingView strokes={latest.strokes} style={styles.preview} />
          ) : (
            <Text style={styles.emoji}>🎨</Text>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mal {partnerName} etwas</Text>
            <Text style={styles.text} numberOfLines={1}>
              {latest ? `Neueste Zeichnung von ${partnerName}` : 'Erscheint auf dem Widget deines Schatzes'}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 30 },
  preview: { width: 52, height: 52, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 13, color: colors.textMuted },
  chevron: { fontSize: 28, color: colors.textMuted },
});
