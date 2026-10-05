import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, HeaderIcon } from '@/components/ui';
import { useStore } from '@/data/store';
import {
  countdownLabel,
  daysBetween,
  durationParts,
  formatDate,
  formatNumber,
  formatShort,
  nextYearly,
  parseISO,
  today,
  upcomingMilestones,
} from '@/lib/dates';
import { colors, gradient, radius, spacing } from '@/theme';

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Home() {
  const { state } = useStore();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const couple = state.couple!;

  const start = parseISO(couple.startDate);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalDays = Math.max(0, daysBetween(start, todayDate));
  const parts = durationParts(start, todayDate);
  const seconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);

  const milestones = upcomingMilestones(couple.startDate, 3, todayDate);
  const nextDate = state.dates
    .map((d) => ({ d, next: d.yearly ? nextYearly(d.date, today()) : null }))
    .map(({ d, next }) => ({ d, inDays: next ? next.inDays : daysBetween(today(), parseISO(d.date)) }))
    .filter((x) => x.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays)[0];
  const openWishes = state.wishes.filter((w) => !w.done).length;
  const lastMemory = [...state.memories].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.heroTop}>
          <Text style={styles.names}>
            {couple.partnerA} <Text style={styles.heart}>♥</Text> {couple.partnerB}
          </Text>
          <HeaderIcon icon="settings-outline" label="Einstellungen" onPress={() => router.push('/settings')} />
        </View>

        <Text style={styles.together}>zusammen seit</Text>
        <Text style={styles.days}>{formatNumber(totalDays)}</Text>
        <Text style={styles.daysLabel}>{totalDays === 1 ? 'Tag' : 'Tagen'}</Text>

        <View style={styles.partsRow}>
          <Part value={parts.years} label={parts.years === 1 ? 'Jahr' : 'Jahre'} />
          <Part value={parts.months} label={parts.months === 1 ? 'Monat' : 'Monate'} />
          <Part value={parts.days} label={parts.days === 1 ? 'Tag' : 'Tage'} />
        </View>

        <Text style={styles.clock}>
          {formatNumber(hours)} Stunden · {formatNumber(seconds)} Sekunden
        </Text>
        <Text style={styles.since}>seit dem {formatDate(couple.startDate)}</Text>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.section}>Nächste Meilensteine</Text>
        <Card style={{ gap: spacing.md }}>
          {milestones.map((m) => (
            <View key={m.label} style={styles.milestone}>
              <View style={styles.milestoneIcon}>
                <Ionicons name="trophy" size={18} color={colors.pink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                <Text style={styles.muted}>{formatDate(m.date)}</Text>
              </View>
              <Text style={[styles.badge, m.inDays === 0 && styles.badgeToday]}>{countdownLabel(m.inDays)}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.section}>Auf einen Blick</Text>
        <View style={styles.tiles}>
          <Tile
            inRow
            icon="calendar"
            tint="blue"
            title={nextDate ? `${nextDate.d.emoji} ${nextDate.d.title}` : 'Keine Termine'}
            text={nextDate ? countdownLabel(nextDate.inDays) : 'Leg wichtige Daten an'}
            onPress={() => router.push('/dates')}
          />
          <Tile
            inRow
            icon="sparkles"
            tint="pink"
            title={`${openWishes} ${openWishes === 1 ? 'Wunsch' : 'Wünsche'}`}
            text="noch offen"
            onPress={() => router.push('/wishes')}
          />
        </View>
        <Tile
          icon="images"
          tint="pink"
          title={lastMemory ? lastMemory.title : 'Noch keine Erinnerungen'}
          text={
            lastMemory
              ? `Letzte Erinnerung · ${formatShort(lastMemory.date)}`
              : `${state.memories.length} Erinnerungen gespeichert`
          }
          onPress={() => router.push(lastMemory ? `/memory/${lastMemory.id}` : '/memories')}
        />
      </View>
    </ScrollView>
  );
}

function Part({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.part}>
      <Text style={styles.partValue}>{value}</Text>
      <Text style={styles.partLabel}>{label}</Text>
    </View>
  );
}

function Tile({
  icon,
  tint,
  title,
  text,
  onPress,
  inRow,
}: {
  inRow?: boolean;
  icon: 'calendar' | 'sparkles' | 'images';
  tint: 'pink' | 'blue';
  title: string;
  text: string;
  onPress: () => void;
}) {
  const main = tint === 'pink' ? colors.pink : colors.blue;
  const pale = tint === 'pink' ? colors.pinkPale : colors.bluePale;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [inRow && { flex: 1 }, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: pale }]}>
        <Ionicons name={icon} size={20} color={main} />
      </View>
      <Text style={styles.tileTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.muted} numberOfLines={1}>
        {text}
      </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginBottom: spacing.lg },
  names: { flex: 1, color: colors.white, fontSize: 22, fontWeight: '800' },
  heart: { color: colors.white },
  together: { color: colors.white, opacity: 0.9, fontSize: 15, textTransform: 'uppercase', letterSpacing: 2 },
  days: { color: colors.white, fontSize: 84, fontWeight: '900', letterSpacing: -3, lineHeight: 92 },
  daysLabel: { color: colors.white, fontSize: 20, fontWeight: '700', marginTop: -4 },
  partsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  part: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    width: 92,
    alignItems: 'center',
  },
  partValue: { color: colors.white, fontSize: 26, fontWeight: '800' },
  partLabel: { color: colors.white, fontSize: 13, opacity: 0.9 },
  clock: { color: colors.white, marginTop: spacing.md, fontSize: 14, fontVariant: ['tabular-nums'], opacity: 0.95 },
  since: { color: colors.white, opacity: 0.85, fontSize: 13, marginTop: 2 },
  body: { padding: spacing.lg, gap: spacing.md },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  milestoneIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.blue,
    backgroundColor: colors.bluePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  badgeToday: { color: colors.white, backgroundColor: colors.pink },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: { gap: 6 },
  tileIcon: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
});
