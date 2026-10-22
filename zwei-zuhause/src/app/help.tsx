import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, IconName } from '@/components/ui';
import { Dict, fmt, useT } from '@/i18n';
import { colors, spacing } from '@/theme';

type HelpTexts = Dict['settings']['help'];

const URGENT: { key: keyof HelpTexts['urgent']; number: string }[] = [
  { key: 'emergency', number: '110' },
  { key: 'women', number: '116016' },
  { key: 'men', number: '08001239900' },
  { key: 'kids', number: '116111' },
  { key: 'parents', number: '08001110550' },
];

const PLACES: { key: keyof HelpTexts['places']; icon: IconName; url?: string }[] = [
  { key: 'youthOffice', icon: 'business-outline' },
  { key: 'counseling', icon: 'people-outline', url: 'https://www.bke-beratung.de' },
  { key: 'mediation', icon: 'git-merge-outline' },
  { key: 'lawyer', icon: 'briefcase-outline' },
];

export default function Help() {
  const h = useT().settings.help;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.section}>{h.urgentTitle}</Text>
      {URGENT.map((u) => (
        <Pressable
          key={u.number}
          accessibilityRole="button"
          accessibilityLabel={fmt(h.call, { label: h.urgent[u.key].label })}
          onPress={() => Linking.openURL(`tel:${u.number}`)}
          style={({ pressed }) => [styles.call, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="call" size={20} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={styles.callTitle}>{h.urgent[u.key].label}</Text>
            <Text style={styles.callText}>{h.urgent[u.key].text}</Text>
          </View>
          <Text style={styles.callNumber}>{u.number.replace(/^0800(\d{3})(\d+)$/, '0800 $1 $2')}</Text>
        </Pressable>
      ))}

      <Text style={styles.section}>{h.afraidTitle}</Text>
      <Card style={{ gap: spacing.sm }}>
        {h.afraidTips.map((tip) => (
          <Tip key={tip} text={tip} />
        ))}
      </Card>

      <Text style={styles.section}>{h.placesTitle}</Text>
      {PLACES.map((p) => (
        <Card key={p.key} style={styles.place}>
          <Ionicons name={p.icon} size={24} color={colors.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.placeTitle}>{h.places[p.key].title}</Text>
            <Text style={styles.placeText}>{h.places[p.key].text}</Text>
            {p.url ? (
              <Text style={styles.link} onPress={() => Linking.openURL(p.url!)}>
                {p.url.replace('https://', '')}
              </Text>
            ) : null}
          </View>
        </Card>
      ))}

      <Text style={styles.section}>{h.goodToKnowTitle}</Text>
      <Card style={{ gap: spacing.sm }}>
        {h.goodToKnowTips.map((tip) => (
          <Tip key={tip} text={tip} />
        ))}
      </Card>

      <Text style={styles.disclaimer}>{h.disclaimer}</Text>
    </ScrollView>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipDot}>•</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginTop: spacing.md },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: spacing.md,
  },
  callTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  callText: { fontSize: 12, color: colors.white, opacity: 0.9 },
  callNumber: { fontSize: 15, fontWeight: '800', color: colors.white },
  place: { flexDirection: 'row', gap: spacing.md },
  placeTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  placeText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  link: { fontSize: 14, color: colors.primary, fontWeight: '700', marginTop: 2 },
  tip: { flexDirection: 'row', gap: spacing.sm },
  tipDot: { fontSize: 15, color: colors.primary, fontWeight: '900' },
  tipText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 17, marginTop: spacing.lg },
});
