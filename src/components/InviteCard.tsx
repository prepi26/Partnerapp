import { Share, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Card, PrimaryButton } from './ui';

/** Zeigt den Einladungscode, solange der Partner noch nicht verbunden ist. */
export function InviteCard({ code, partnerName }: { code: string; partnerName: string }) {
  const share = () =>
    Share.share({
      message: `Lass uns „Wir zwei“ zusammen nutzen 💖 Lade dir die App, erstelle ein Konto, tippe auf „Ich habe einen Code“ und gib ein: ${code}`,
    }).catch(() => {});

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Lade {partnerName || 'deinen Schatz'} ein</Text>
      <Text style={styles.text}>
        {partnerName || 'Dein Schatz'} erstellt in der App ein eigenes Konto, tippt auf „Ich habe einen Code“ und gibt
        diesen Code ein:
      </Text>
      <Text selectable style={styles.code}>
        {code}
      </Text>
      <PrimaryButton title="Code teilen" icon="share-outline" onPress={share} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, borderWidth: 2, borderColor: colors.pinkSoft },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  text: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  code: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
    color: colors.pink,
    textAlign: 'center',
    backgroundColor: colors.pinkPale,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    marginVertical: spacing.xs,
    overflow: 'hidden',
  },
});
