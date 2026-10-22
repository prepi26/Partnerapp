import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FamiliesOverview, FamilySwitcher } from '@/components/FamilySwitcher';
import { InviteCard } from '@/components/InviteCard';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { parentColor } from '@/components/ParentTag';
import { Card, GradientHeader, HeaderIcon, IconName } from '@/components/ui';
import { useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { addDays, countdownLabel, daysBetween, formatWeekday, parseISO, toISO, today } from '@/lib/dates';
import { holidayName, upcomingHolidays } from '@/lib/holidays';
import { balanceAB, formatMoney } from '@/lib/money';
import { acceptedChanges, dayInfo, handoverWhere, nextHandover } from '@/lib/schedule';
import { colors, radius, spacing } from '@/theme';

export default function Home() {
  const t = useT();
  const {
    family,
    me,
    myName,
    otherName,
    nameOf,
    otherJoined,
    schedule_changes,
    expenses,
    messages,
    decisions,
    packing_items,
    userId,
  } = useFamily();

  const accepted = useMemo(() => acceptedChanges(schedule_changes), [schedule_changes]);
  const now = today();
  const todayInfo = dayInfo(family, accepted, new Map(), now);
  const handover = nextHandover(family, accepted, now);
  const where = handoverWhere(family);

  const openChanges = schedule_changes.filter((c) => c.status === 'proposed' && c.created_by !== userId);
  const openExpenses = expenses.filter((e) => e.status === 'open' && e.created_by !== userId);
  const unread = messages.filter((m) => m.sender_key !== me && !m.read_at).length;
  const openDecisions = decisions.filter((d) => d.status === 'proposed' && d.created_by !== userId).length;
  // Heute oder gestern war Wechsel: kurz festhalten, wie die Übergabe lief.
  const handoverRecent = [0, -1].some((offset) => {
    const day = addDays(now, offset);
    const before = dayInfo(family, accepted, new Map(), addDays(day, -1)).parent;
    const after = dayInfo(family, accepted, new Map(), day).parent;
    return !!before && !!after && before !== after;
  });

  // Positiv: der andere schuldet mir.
  const raw = balanceAB(expenses);
  const balance = me === 'a' ? raw : -raw;

  // Nächste Ferien in den kommenden 8 Wochen – Anstoß, sie früh abzusprechen.
  const nextHoliday = family.school_state ? upcomingHolidays(family.school_state, toISO(now))[0] : undefined;
  const holidayIn = nextHoliday ? daysBetween(now, parseISO(nextHoliday.start)) : -1;
  const packed = packing_items.filter((i) => i.packed).length;

  const kids = family.children.trim() || t.common.theChild;
  const todayColor = parentColor(todayInfo.parent);
  // Satz als Ganzes übersetzen, der Name wird farbig dazwischen gesetzt.
  const [todayBefore, todayAfter = ''] = fmt(
    kids.includes(',') || kids.includes(' und ') ? t.home.today.kidsAreWith : t.home.today.kidIsWith,
    { kids },
  ).split('{who}');

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader
        title={fmt(t.home.today.hello, { name: myName })}
        subtitle={formatWeekday(now)}
        right={<HeaderIcon icon="settings-outline" label={t.home.today.settings} onPress={() => router.push('/settings')} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <FamilySwitcher />
        <SubscriptionBanner />
        <Card style={[styles.today, { backgroundColor: todayColor.pale }]}>
          <Text style={styles.todayLabel}>{t.home.today.label}</Text>
          {todayInfo.parent ? (
            <Text style={styles.todayText}>
              {todayBefore}
              <Text style={{ color: todayColor.main }}>
                {todayInfo.parent === me ? t.home.today.withYou : nameOf(todayInfo.parent)}
              </Text>
              {todayAfter}
            </Text>
          ) : (
            <Text style={styles.todayText}>{t.home.today.noSchedule}</Text>
          )}
          {handover ? (
            <Text style={styles.todaySub}>
              {fmt(t.home.today.nextHandover, {
                countdown: countdownLabel(daysBetween(now, handover.day)),
                weekday: formatWeekday(handover.day),
                where: where ? `, ${where}` : '',
                who: handover.to === me ? t.home.today.toYou : nameOf(handover.to),
              })}
            </Text>
          ) : null}
          {handover ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/packing')}>
              <Text style={styles.link}>
                {packing_items.length
                  ? fmt(t.family.packing.homeLine, { packed, total: packing_items.length })
                  : t.family.packing.homeEmpty}
              </Text>
            </Pressable>
          ) : null}
          {family.schedule_model === 'none' ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/schedule')}>
              <Text style={styles.link}>{t.home.today.setSchedule}</Text>
            </Pressable>
          ) : null}
        </Card>

        {handoverRecent ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/handover-new')}
            style={({ pressed }) => [styles.banner, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="car" size={20} color={colors.primary} />
            <Text style={styles.bannerText}>{t.home.today.handoverBanner}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        {!otherJoined ? <InviteCard code={family.invite_code} otherName={otherName} /> : null}

        <FamiliesOverview />

        {nextHoliday && holidayIn > 0 && holidayIn <= 56 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/holidays')}
            style={({ pressed }) => [styles.banner, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerText}>
                {fmt(t.calendar.holidays.homeCard, {
                  name: holidayName(nextHoliday.kind, t),
                  countdown: holidayIn < 14 ? countdownLabel(holidayIn) : fmt(t.calendar.holidays.inWeeks, { n: Math.round(holidayIn / 7) }),
                })}
              </Text>
              <Text style={styles.bannerSub}>{t.calendar.holidays.homeCardText}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        <View style={styles.tiles}>
          <Tile
            icon="swap-horizontal"
            title={t.home.today.swapRequests}
            value={openChanges.length ? fmt(t.home.today.nOpen, { n: openChanges.length }) : t.home.today.noneOpen}
            highlight={openChanges.length > 0}
            onPress={() => router.navigate('/calendar')}
          />
          <Tile
            icon="chatbubbles"
            title={t.home.today.messages}
            value={unread ? fmt(t.home.today.nNew, { n: unread }) : t.home.today.allRead}
            highlight={unread > 0}
            onPress={() => router.navigate('/messages')}
          />
          <Tile
            icon="wallet"
            title={
              balance === 0
                ? t.home.today.costs
                : fmt(balance > 0 ? t.home.today.owesYou : t.home.today.youOwe, { name: otherName })
            }
            value={formatMoney(Math.abs(balance))}
            highlight={openExpenses.length > 0}
            hint={openExpenses.length ? fmt(t.home.today.nToReview, { n: openExpenses.length }) : undefined}
            onPress={() => router.navigate('/expenses')}
          />
          <Tile
            icon="git-pull-request"
            title={t.home.today.decisions}
            value={openDecisions ? fmt(t.home.today.nOpen, { n: openDecisions }) : t.home.today.noneOpen}
            highlight={openDecisions > 0}
            onPress={() => router.push('/decisions')}
          />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/help')} style={styles.helpRow}>
          <Ionicons name="help-buoy-outline" size={18} color={colors.primary} />
          <Text style={styles.helpText}>{t.home.today.help}</Text>
        </Pressable>

        <Text style={styles.footer}>{t.home.today.footer}</Text>
      </ScrollView>
    </View>
  );
}

function Tile({
  icon,
  title,
  value,
  hint,
  highlight,
  onPress,
}: {
  icon: IconName;
  title: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, highlight && styles.tileHighlight, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={22} color={highlight ? colors.primary : colors.textMuted} />
      <Text style={styles.tileTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.tileValue}>{value}</Text>
      {hint ? <Text style={styles.tileHint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  today: { gap: spacing.xs, padding: spacing.lg },
  todayLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  todayText: { fontSize: 24, fontWeight: '800', color: colors.text },
  todaySub: { fontSize: 15, color: colors.text, lineHeight: 21 },
  link: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tileHighlight: { borderColor: colors.primary },
  tileTitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tileValue: { fontSize: 18, color: colors.text, fontWeight: '800' },
  tileHint: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryPale,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  bannerSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  helpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  helpText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  footer: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
