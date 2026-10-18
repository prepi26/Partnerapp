import { Share, StyleSheet, Text } from 'react-native';

import { inviteLink } from '@/lib/invite';
import { colors, radius, spacing } from '@/theme';

import { Card, PrimaryButton } from './ui';

/** Zeigt den Einladungscode, solange der Partner noch nicht verbunden ist. */
export function InviteCard({ code, partnerName }: { code: string; partnerName: string }) {
  const share = () =>
    Share.share({
      // Der Code steht am Ende noch einmal einzeln – so lässt er sich auch ohne Link einfügen.
      message: `Lass uns „Wir zwei“ zusammen nutzen 💖 Tipp auf den Link, um dich mit mir zu verbinden: ${inviteLink(code)}\n\nUnser Code: ${code}`,
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
