import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientHeader, IconName } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

type Item = { icon: IconName; title: string; text: string; href: Parameters<typeof router.push>[0]; badge?: number };

export default function More() {
  const t = useT();
  const { decisions, handovers, agreements, professional_access, journal, userId, me } = useFamily();
  const { canWrite: plus } = usePlus();

  const openDecisions = decisions.filter((d) => d.status === 'proposed' && d.created_by !== userId).length;
  const openHandovers = handovers.filter((h) => !h.reply && h.created_by !== userId).length;
  const latest = agreements[0];
  const agreementOpen = latest && !(me === 'a' ? latest.accepted_a_at : latest.accepted_b_at) ? 1 : 0;
  const proOpen = professional_access.filter(
    (p) => !p.other_approved_at && !p.revoked_at && p.invited_key !== me && new Date(p.expires_at) > new Date(),
  ).length;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: t.home.more.together,
      items: [
        { icon: 'git-pull-request', title: t.home.more.decisions, text: t.home.more.decisionsText, href: '/decisions', badge: openDecisions },
        { icon: 'car', title: t.home.more.handovers, text: t.home.more.handoversText, href: '/handovers', badge: openHandovers },
        { icon: 'information-circle', title: t.home.more.childInfo, text: t.home.more.childInfoText, href: '/child-info' },
        { icon: 'folder-open', title: t.home.more.documents, text: t.home.more.documentsText, href: '/documents' },
        { icon: 'document-text', title: t.home.more.agreement, text: t.home.more.agreementText, href: '/agreement', badge: agreementOpen },
      ],
    },
    {
      title: t.home.more.onlyYou,
      items: [
        { icon: 'book', title: t.home.more.journal, text: fmt(journal.length === 1 ? t.home.more.journalTextOne : t.home.more.journalTextOther, { n: journal.length }), href: '/journal' },
        { icon: 'print', title: t.home.more.report, text: plus ? t.home.more.reportText : t.home.more.reportPlus, href: '/report' },
      ],
    },
    {
      title: t.home.more.support,
      items: [
        { icon: 'shield-checkmark', title: t.home.more.professionals, text: t.home.more.professionalsText, href: '/professionals', badge: proOpen },
        { icon: 'help-buoy', title: t.home.more.help, text: t.home.more.helpText, href: '/help' },
        { icon: 'settings', title: t.home.more.settings, text: t.home.more.settingsText, href: '/settings' },
      ],
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader title={t.home.more.title} />
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
