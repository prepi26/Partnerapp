import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InviteCard } from '@/components/InviteCard';
import { parentColor } from '@/components/ParentTag';
import { Card, GradientHeader, HeaderIcon, IconName } from '@/components/ui';
import { useFamily } from '@/data/store';
import { addDays, countdownLabel, daysBetween, formatWeekday, today } from '@/lib/dates';
import { balanceAB, formatMoney } from '@/lib/money';
import { acceptedChanges, dayInfo, handoverWhere, nextHandover } from '@/lib/schedule';
import { colors, radius, spacing } from '@/theme';

export default function Home() {
  const { family, me, myName, otherName, nameOf, otherJoined, schedule_changes, expenses, messages, decisions, userId } =
    useFamily();

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

  const kids = family.children.trim() || 'Das Kind';
  const todayColor = parentColor(todayInfo.parent);

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader
        title={`Hallo ${myName}`}
        subtitle={formatWeekday(now)}
        right={<HeaderIcon icon="settings-outline" label="Einstellungen" onPress={() => router.push('/settings')} />}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={[styles.today, { backgroundColor: todayColor.pale }]}>
          <Text style={styles.todayLabel}>Heute</Text>
          {todayInfo.parent ? (
            <Text style={styles.todayText}>
              {kids} {kids.includes(',') || kids.includes(' und ') ? 'sind' : 'ist'} bei{' '}
              <Text style={{ color: todayColor.main }}>{todayInfo.parent === me ? 'dir' : nameOf(todayInfo.parent)}</Text>
            </Text>
          ) : (
            <Text style={styles.todayText}>Noch kein Umgangsplan</Text>
          )}
          {handover ? (
            <Text style={styles.todaySub}>
              Nächste Übergabe {countdownLabel(daysBetween(now, handover.day))} ({formatWeekday(handover.day)}
              {where ? `, ${where}` : ''}) an {handover.to === me ? 'dich' : nameOf(handover.to)}
            </Text>
          ) : null}
          {family.schedule_model === 'none' ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/schedule')}>
              <Text style={styles.link}>Umgangsplan festlegen →</Text>
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
            <Text style={styles.bannerText}>Übergabe gerade? Kurz festhalten, wie es lief.</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        {!otherJoined ? <InviteCard code={family.invite_code} otherName={otherName} /> : null}

        <View style={styles.tiles}>
          <Tile
            icon="swap-horizontal"
            title="Tauschanfragen"
            value={openChanges.length ? `${openChanges.length} offen` : 'Keine offen'}
            highlight={openChanges.length > 0}
            onPress={() => router.navigate('/calendar')}
          />
          <Tile
            icon="chatbubbles"
            title="Nachrichten"
            value={unread ? `${unread} neu` : 'Alles gelesen'}
            highlight={unread > 0}
            onPress={() => router.navigate('/messages')}
          />
          <Tile
            icon="wallet"
            title={balance === 0 ? 'Kosten' : balance > 0 ? `${otherName} schuldet dir` : `Du schuldest ${otherName}`}
            value={formatMoney(Math.abs(balance))}
            highlight={openExpenses.length > 0}
            hint={openExpenses.length ? `${openExpenses.length} zu prüfen` : undefined}
            onPress={() => router.navigate('/expenses')}
          />
          <Tile
            icon="git-pull-request"
            title="Entscheidungen"
            value={openDecisions ? `${openDecisions} offen` : 'Keine offen'}
            highlight={openDecisions > 0}
            onPress={() => router.push('/decisions')}
          />
        </View>

        <Text style={styles.footer}>
          Alles hier ist für beide gleich sichtbar – außer deinem Tagebuch. Nachrichten lassen sich nicht löschen oder
          ändern.
        </Text>
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
  footer: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
