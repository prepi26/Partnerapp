import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientHeader, IconName } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { useFamily } from '@/data/store';
import { colors, radius, spacing } from '@/theme';

type Item = { icon: IconName; title: string; text: string; href: Parameters<typeof router.push>[0]; badge?: number };

export default function More() {
  const { decisions, handovers, agreements, professional_access, journal, userId, me } = useFamily();
  const { active: plus } = usePlus();

  const openDecisions = decisions.filter((d) => d.status === 'proposed' && d.created_by !== userId).length;
  const openHandovers = handovers.filter((h) => !h.reply && h.created_by !== userId).length;
  const latest = agreements[0];
  const agreementOpen = latest && !(me === 'a' ? latest.accepted_a_at : latest.accepted_b_at) ? 1 : 0;
  const proOpen = professional_access.filter(
    (p) => !p.other_approved_at && !p.revoked_at && p.invited_key !== me && new Date(p.expires_at) > new Date(),
  ).length;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: 'Gemeinsam',
      items: [
        { icon: 'git-pull-request', title: 'Entscheidungen', text: 'Schule, Gesundheit, Reisen – gemeinsam klären', href: '/decisions', badge: openDecisions },
        { icon: 'car', title: 'Übergaben', text: 'Wie lief es? Kurz festhalten', href: '/handovers', badge: openHandovers },
        { icon: 'information-circle', title: 'Infos zum Kind', text: 'Ärzte, Schule, Größen', href: '/child-info' },
        { icon: 'folder-open', title: 'Dokumente', text: 'Zeugnisse, Arztbriefe, Bescheide', href: '/documents' },
        { icon: 'document-text', title: 'Elternvereinbarung', text: 'Eure Absprachen, von beiden angenommen', href: '/agreement', badge: agreementOpen },
      ],
    },
    {
      title: 'Nur für dich',
      items: [
        { icon: 'book', title: 'Tagebuch', text: `${journal.length} ${journal.length === 1 ? 'Eintrag' : 'Einträge'} · privat`, href: '/journal' },
        { icon: 'print', title: 'Bericht als PDF', text: plus ? 'Für Beratung, Jugendamt oder Anwalt' : 'Mit Plus', href: '/report' },
      ],
    },
    {
      title: 'Unterstützung',
      items: [
        { icon: 'shield-checkmark', title: 'Fachkräfte', text: 'Jugendamt, Beratung, Verfahrensbeistand einladen', href: '/professionals', badge: proOpen },
        { icon: 'help-buoy', title: 'Hilfe & Beratung', text: 'Notfallnummern, Jugendamt, Beratungsstellen', href: '/help' },
        { icon: 'settings', title: 'Einstellungen', text: 'Namen, Kosten-Anteil, Konto', href: '/settings' },
      ],
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader title="Mehr" />
      <ScrollView contentContainerStyle={styles.content}>
        {groups.map((g) => (
          <View key={g.title} style={{ gap: spacing.sm }}>
            <Text style={styles.section}>{g.title}</Text>
            <View style={styles.group}>
              {g.items.map((item, i) => (
                <Pressable
                  key={item.title}
                  accessibilityRole="button"
                  onPress={() => router.push(item.href)}
                  style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && { opacity: 0.6 }]}
                >
                  <View style={styles.icon}>
                    <Ionicons name={item.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.text}>{item.text}</Text>
                  </View>
                  {item.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: 60 },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', paddingHorizontal: 4 },
  group: { backgroundColor: colors.card, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  text: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.white },
});
