import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { confirmDestructive, Fab, GradientHeader } from '@/components/ui';
import { useStore } from '@/data/store';
import { countdownLabel, daysBetween, formatDate, nextYearly, parseISO, today } from '@/lib/dates';
import { colors, radius, shadow, spacing } from '@/theme';

interface Row {
  id: string;
  title: string;
  emoji: string;
  date: Date;
  inDays: number;
  detail: string;
  removable: boolean;
}

export default function Dates() {
  const { state, removeDate } = useStore();
  const couple = state.couple!;
  const now = today();

  const anniversary = nextYearly(couple.startDate, now);
  const rows: Row[] = [
    {
      id: 'anniversary',
      title: 'Unser Jahrestag',
      emoji: '💞',
      date: anniversary.date,
      inDays: anniversary.inDays,
      detail: anniversary.years > 0 ? `${anniversary.years}. Jahrestag` : 'Euer erster Tag',
      removable: false,
    },
    ...state.dates.map((d): Row => {
      if (d.yearly) {
        const next = nextYearly(d.date, now);
        return {
          id: d.id,
          title: d.title,
          emoji: d.emoji,
          date: next.date,
          inDays: next.inDays,
          detail: `jährlich · seit ${parseISO(d.date).getFullYear()}`,
          removable: true,
        };
      }
      const date = parseISO(d.date);
      return {
        id: d.id,
        title: d.title,
        emoji: d.emoji,
        date,
        inDays: daysBetween(now, date),
        detail: 'einmalig',
        removable: true,
      };
    }),
  ];

  const upcoming = rows.filter((r) => r.inDays >= 0).sort((a, b) => a.inDays - b.inDays);
  const past = rows.filter((r) => r.inDays < 0).sort((a, b) => b.inDays - a.inDays);

  const remove = (row: Row) => {
    if (!row.removable) return;
    confirmDestructive('Datum löschen?', `„${row.title}“ wird entfernt.`, 'Löschen', () => removeDate(row.id));
  };

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader title="Wichtige Daten" subtitle="Nie wieder einen Jahrestag vergessen" />
      <FlatList
        data={[...upcoming, ...past]}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <>
            {index === upcoming.length && past.length ? <Text style={styles.section}>Vergangen</Text> : null}
            <Pressable
              onLongPress={() => remove(item)}
              style={[styles.item, item.inDays < 0 && { opacity: 0.55 }, item.inDays === 0 && styles.itemToday]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.muted}>
                  {formatDate(item.date)} · {item.detail}
                </Text>
              </View>
              <View style={styles.countdown}>
                {item.inDays > 1 ? (
                  <>
                    <Text style={styles.countdownNum}>{item.inDays}</Text>
                    <Text style={styles.countdownLabel}>Tage</Text>
                  </>
                ) : (
                  <Text style={styles.countdownWord}>
                    {item.inDays < 0 ? `vor ${-item.inDays} T.` : countdownLabel(item.inDays)}
                  </Text>
                )}
              </View>
            </Pressable>
          </>
        )}
        ListFooterComponent={<Text style={styles.hint}>Gedrückt halten zum Löschen</Text>}
      />
      <Fab label="Datum hinzufügen" onPress={() => router.push('/date-new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 120, gap: spacing.sm },
  section: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow,
  },
  itemToday: { borderWidth: 2, borderColor: colors.pink },
  emoji: { fontSize: 30 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  countdown: {
    minWidth: 64,
    alignItems: 'center',
    backgroundColor: colors.bluePale,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  countdownNum: { fontSize: 22, fontWeight: '900', color: colors.blue },
  countdownLabel: { fontSize: 11, fontWeight: '700', color: colors.blue, textTransform: 'uppercase' },
  countdownWord: { fontSize: 14, fontWeight: '800', color: colors.pink },
  hint: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.md },
});
