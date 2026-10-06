import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InviteCard } from '@/components/InviteCard';
import { MoodCard } from '@/components/MoodCard';
import { Card, HeaderIcon } from '@/components/ui';
import { questionForDay } from '@/data/questions';
import { useCouple } from '@/data/store';
import {
  countdownLabel,
  daysBetween,
  durationParts,
  formatDate,
  formatNumber,
  formatShort,
  nextYearly,
  parseISO,
  toISO,
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
  const { couple, special_dates, wishes, memories, notes, answers, userId, partnerName, partnerJoined } = useCouple();
  const insets = useSafeAreaInsets();
  const now = useNow();

  const start = parseISO(couple.start_date);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalDays = Math.max(0, daysBetween(start, todayDate));
  const parts = durationParts(start, todayDate);
  const seconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);

  const milestones = upcomingMilestones(couple.start_date, 3, todayDate);
  const nextDate = special_dates
    .map((d) => ({ d, next: d.yearly ? nextYearly(d.date, today()) : null }))
    .map(({ d, next }) => ({ d, inDays: next ? next.inDays : daysBetween(today(), parseISO(d.date)) }))
    .filter((x) => x.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays)[0];
  const openWishes = wishes.filter((w) => !w.done).length;
  const lastMemory = [...memories].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastNote = notes[notes.length - 1];
  const day = toISO(todayDate);
  const answeredToday = answers.some((a) => a.user_id === userId && a.day === day);
  const partnerAnsweredToday = answers.some((a) => a.user_id !== userId && a.day === day);

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
            {couple.name_a} <Text style={styles.heart}>♥</Text> {couple.name_b}
          </Text>
          <HeaderIcon icon="settings-outline" label="Einstellungen" onPress={() => router.push('/settings')} />
        </View>

        <Text style={styles.together}>zusammen seit</Text>
        <Text style={styles.days}>{formatNumber(totalDays)}</Text>
        <Text style={styles.daysLabel}>{totalDays === 1 ? 'Tag' : 'Tagen'}</Text>

        {/* Bei frischen Paaren wäre „0 Jahre · 0 Monate“ nur Rauschen. */}
        {parts.years > 0 || parts.months > 0 ? (
          <View style={styles.partsRow}>
            {parts.years > 0 ? <Part value={parts.years} label={parts.years === 1 ? 'Jahr' : 'Jahre'} /> : null}
            <Part value={parts.months} label={parts.months === 1 ? 'Monat' : 'Monate'} />
            <Part value={parts.days} label={parts.days === 1 ? 'Tag' : 'Tage'} />
          </View>
        ) : null}

        <Text style={styles.clock}>
          {formatNumber(hours)} Stunden · {formatNumber(seconds)} Sekunden
        </Text>
        <Text style={styles.since}>seit dem {formatDate(couple.start_date)}</Text>
      </LinearGradient>

      <View style={styles.body}>
        {!partnerJoined ? <InviteCard code={couple.invite_code} partnerName={couple.name_b} /> : null}

        <Text style={styles.section}>Heute</Text>
        <MoodCard />
        <Pressable accessibilityRole="button" onPress={() => router.push('/question')}>
          {({ pressed }) => (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.questionCard, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.questionKicker}>Frage des Tages</Text>
              <Text style={styles.questionText}>{questionForDay(day)}</Text>
              <Text style={styles.questionStatus}>
                {/* Die Antwort des Partners ist vor der eigenen Antwort serverseitig unsichtbar. */}
                {!answeredToday
                  ? 'Jetzt antworten →'
                  : partnerAnsweredToday
                    ? 'Ihr habt beide geantwortet – ansehen →'
                    : `Du hast geantwortet · ${partnerName} noch nicht`}
              </Text>
            </LinearGradient>
          )}
        </Pressable>

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
          icon="mail"
          tint="blue"
          title={lastNote ? lastNote.text : 'Noch keine Liebeszettel'}
          text={
            lastNote
              ? `Letzter Zettel · ${lastNote.author_id === userId ? 'von dir' : `von ${partnerName}`}`
              : `Schreib ${partnerName} etwas Liebes`
          }
          onPress={() => router.push('/notes')}
        />
        <Tile
          icon="images"
          tint="pink"
          title={lastMemory ? lastMemory.title : 'Noch keine Erinnerungen'}
          text={
            lastMemory
              ? `Letzte Erinnerung · ${formatShort(lastMemory.date)}`
              : `${memories.length} Erinnerungen gespeichert`
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
  icon: 'calendar' | 'sparkles' | 'images' | 'mail';
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
  questionCard: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  questionKicker: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  questionText: { color: colors.white, fontSize: 20, fontWeight: '800', lineHeight: 26 },
  questionStatus: { color: colors.white, fontSize: 14, fontWeight: '600', opacity: 0.95 },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
});
