import { Share, StyleSheet, Text } from 'react-native';

import { Card, SecondaryButton } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Code für den anderen Elternteil – solange er noch nicht verbunden ist. */
export function InviteCard({ code, otherName }: { code: string; otherName: string }) {
  const share = () =>
    Share.share({
      message:
        `Ich nutze „Zwei Zuhause“ für Umgang, Kosten und Absprachen. ` +
        `Lade dir die App, erstelle ein Konto und gib diesen Code ein: ${code}`,
    });
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{otherName} ist noch nicht verbunden</Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.text}>
        Mit diesem Code sieht {otherName} denselben Kalender und dieselben Kosten und kann dir schreiben. Bis dahin
        kannst du alles allein nutzen.
      </Text>
      <SecondaryButton title="Code teilen" icon="share-outline" onPress={share} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, alignItems: 'stretch' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  code: { fontSize: 30, fontWeight: '900', letterSpacing: 8, color: colors.primary, textAlign: 'center' },
  text: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
