import { Share, StyleSheet, Text } from 'react-native';

import { Card, SecondaryButton } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { fmt, useT } from '@/i18n';
import { colors, spacing } from '@/theme';

/** Code für den anderen Elternteil – solange er noch nicht verbunden ist. */
export function InviteCard({ code, otherName }: { code: string; otherName: string }) {
  const t = useT();
  const { solo, active } = usePlus();
  const share = () => Share.share({ message: fmt(t.home.invite.shareMessage, { code }) });
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{fmt(t.home.invite.title, { name: otherName })}</Text>
      <Text style={styles.code}>{code}</Text>
      <Text style={styles.text}>{fmt(t.home.invite.text, { name: otherName })}</Text>
      {solo && !active ? <Text style={styles.solo}>{fmt(t.home.invite.solo, { name: otherName })}</Text> : null}
      <SecondaryButton title={t.home.invite.share} icon="share-outline" onPress={share} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, alignItems: 'stretch' },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  code: { fontSize: 30, fontWeight: '900', letterSpacing: 8, color: colors.primary, textAlign: 'center' },
  text: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  solo: { fontSize: 14, color: colors.primary, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
});
