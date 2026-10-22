import { useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExpenseStatus } from '@/components/ExpenseStatus';
import { Card, confirmDestructive, EmptyState, SecondaryButton } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { formatDate, formatTimestamp } from '@/lib/dates';
import { categoryOf, formatMoney, needOf, shareOf } from '@/lib/money';
import { close } from '@/lib/nav';
import { colors, radius, spacing } from '@/theme';

export default function ExpenseDetail() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenses, userId, me, nameOf, receiptUrls, answerExpense, removeExpense } = useFamily();
  const e = expenses.find((x) => x.id === id);
  if (!e)
    return <EmptyState icon="receipt-outline" title={t.money.detail.notFoundTitle} text={t.money.detail.notFoundText} />;

  const mine = e.created_by === userId;
  const url = e.receipt_path ? receiptUrls[e.receipt_path] : undefined;
  const who = (k: 'a' | 'b') => (k === me ? t.common.youCap : nameOf(k));

  const remove = () =>
    confirmDestructive(t.money.detail.deleteTitle, t.money.detail.deleteText, t.common.delete, () => {
      attempt(() => removeExpense(e)).then((ok) => ok && close());
    });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={{ gap: spacing.xs }}>
        <Text style={styles.amount}>{formatMoney(e.amount_cents)}</Text>
        <Text style={styles.title}>{e.title}</Text>
        <ExpenseStatus expense={e} mine={mine} />
      </Card>
      <Card style={{ gap: spacing.sm }}>
        <Line label={t.money.detail.date} value={formatDate(e.day)} />
        {e.kind === 'payment' ? (
          <Line label={t.money.detail.payment} value={`${who(e.paid_by)} → ${who(e.paid_by === 'a' ? 'b' : 'a')}`} />
        ) : (
          <>
            <Line label={t.money.detail.category} value={categoryOf(e.category, t).label} />
            {e.need && e.need !== 'regular' ? <Line label={t.money.detail.need} value={needOf(e.need, t).label} /> : null}
            <Line label={t.money.detail.paidBy} value={who(e.paid_by)} />
            <Line label={fmt(t.money.detail.shareOf, { name: nameOf('a') })} value={`${e.share_a} % · ${formatMoney(shareOf(e, 'a'))}`} />
            <Line label={fmt(t.money.detail.shareOf, { name: nameOf('b') })} value={`${100 - e.share_a} % · ${formatMoney(shareOf(e, 'b'))}`} />
          </>
        )}
        <Line label={t.money.detail.created} value={formatTimestamp(e.created_at)} />
        {e.answered_at ? <Line label={t.money.detail.answered} value={formatTimestamp(e.answered_at)} /> : null}
      </Card>
      {url ? <Image source={{ uri: url }} style={styles.receipt} resizeMode="contain" /> : null}

      {e.status === 'open' && !mine ? (
        <View style={styles.buttons}>
          <View style={{ flex: 1 }}>
            <SecondaryButton title={t.money.detail.confirm} icon="checkmark" onPress={() => attempt(() => answerExpense(e.id, true))} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              title={t.money.detail.reject}
              icon="close"
              danger
              onPress={() => attempt(() => answerExpense(e.id, false))}
            />
          </View>
        </View>
      ) : null}
      {mine && e.status !== 'confirmed' ? (
        <SecondaryButton title={t.money.detail.deleteButton} icon="trash-outline" danger onPress={remove} />
      ) : null}
      {e.status === 'disputed' ? (
        <Text style={styles.hint}>{t.money.detail.disputedHint}</Text>
      ) : null}
    </ScrollView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  amount: { fontSize: 32, fontWeight: '900', color: colors.text },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  lineLabel: { fontSize: 14, color: colors.textMuted },
  lineValue: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  receipt: { width: '100%', height: 360, borderRadius: radius.md, backgroundColor: colors.muted },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  hint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
