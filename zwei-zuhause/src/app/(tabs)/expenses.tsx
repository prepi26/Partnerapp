import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ExpenseStatus } from '@/components/ExpenseStatus';
import { Card, EmptyState, Fab, GradientHeader } from '@/components/ui';
import { useFamily } from '@/data/store';
import { Expense } from '@/data/types';
import { formatShort } from '@/lib/dates';
import { balanceAB, categoryOf, formatMoney, shareOf } from '@/lib/money';
import { colors, spacing } from '@/theme';

export default function Expenses() {
  const { expenses, me, otherName, nameOf, userId } = useFamily();
  const raw = balanceAB(expenses);
  const balance = me === 'a' ? raw : -raw;
  const open = expenses.filter((e) => e.status === 'open').length;

  return (
    <View style={{ flex: 1 }}>
      <GradientHeader title="Kosten" subtitle="Ausgaben fürs Kind teilen" />
      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Card style={styles.balance}>
            <Text style={styles.balanceLabel}>
              {balance === 0 ? 'Ihr seid quitt' : balance > 0 ? `${otherName} schuldet dir` : `Du schuldest ${otherName}`}
            </Text>
            <Text style={styles.balanceValue}>{formatMoney(Math.abs(balance))}</Text>
            <Text style={styles.balanceHint}>
              {open ? `Davon ${open} noch nicht bestätigt. ` : ''}Abgelehnte Einträge zählen nicht.
            </Text>
          </Card>
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Noch keine Ausgaben"
            text="Trag ein, was du fürs Kind bezahlt hast – Schuhe, Klassenfahrt, Kita. Der Saldo rechnet sich selbst."
          />
        }
        renderItem={({ item }) => (
          <Row expense={item} mine={item.created_by === userId} me={me} nameOf={nameOf} />
        )}
      />
      <Fab label="Neue Ausgabe" onPress={() => router.push('/expense-new')} />
    </View>
  );
}

function Row({
  expense: e,
  mine,
  me,
  nameOf,
}: {
  expense: Expense;
  mine: boolean;
  me: 'a' | 'b';
  nameOf: (k: 'a' | 'b') => string;
}) {
  const cat = categoryOf(e.category);
  const payer = e.paid_by === me ? 'Du' : nameOf(e.paid_by);
  const detail =
    e.kind === 'payment'
      ? `${payer} ${e.paid_by === me ? 'hast' : 'hat'} ausgeglichen`
      : `${payer} ${e.paid_by === me ? 'hast' : 'hat'} bezahlt · dein Anteil ${formatMoney(shareOf(e, me))}`;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/expense/[id]', params: { id: e.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.emoji}>{e.kind === 'payment' ? '💶' : cat.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {e.title}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {formatShort(e.day)} · {detail}
        </Text>
        <ExpenseStatus expense={e} mine={mine} />
      </View>
      <Text style={[styles.amount, e.status === 'disputed' && styles.struck]}>{formatMoney(e.amount_cents)}</Text>
      {e.receipt_path ? <Ionicons name="attach" size={16} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  balance: { alignItems: 'center', gap: 2, marginBottom: spacing.sm, padding: spacing.lg },
  balanceLabel: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
  balanceValue: { fontSize: 34, fontWeight: '900', color: colors.text },
  balanceHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
  },
  emoji: { fontSize: 26 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: colors.text },
  struck: { textDecorationLine: 'line-through', color: colors.textMuted },
});
