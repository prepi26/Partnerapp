import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ExpenseStatus } from '@/components/ExpenseStatus';
import { PlusCard } from '@/components/SubscriptionBanner';
import { Card, Fab, PrimaryButton, SecondaryButton } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { attempt, useFamily } from '@/data/store';
import { fmt, useT } from '@/i18n';
import { formatDate, formatMonth, formatTimestamp, parseISO, today } from '@/lib/dates';
import { MonthRow, monthRows, monthStart, statusLabel, termFor } from '@/lib/maintenance';
import { formatMoney } from '@/lib/money';
import { colors, spacing } from '@/theme';

const STATUS_COLOR = {
  paid: colors.primary,
  more: colors.primary,
  partial: colors.warning,
  open: colors.danger,
};

export default function Maintenance() {
  const t = useT();
  const m = t.money.maintenance;
  const {
    maintenance_terms,
    maintenance_payments,
    me,
    nameOf,
    otherName,
    userId,
    answerMaintenance,
    removeMaintenancePayment,
  } = useFamily();
  const { hasPlus } = usePlus();
  const now = today();
  const current = termFor(maintenance_terms, monthStart(now));
  const rows = monthRows(maintenance_terms, maintenance_payments, now);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={maintenance_payments}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <Text style={styles.intro}>{m.intro}</Text>
            {hasPlus ? null : <PlusCard />}
            {current ? (
              <Card style={{ gap: 4 }}>
                <Text style={styles.big}>
                  {current.payer === me
                    ? fmt(m.agreedYou, {
                        amount: formatMoney(current.amount_cents),
                      })
                    : fmt(m.agreed, {
                        amount: formatMoney(current.amount_cents),
                        name: nameOf(current.payer),
                      })}
                </Text>
                <Text style={styles.meta}>
                  {fmt(m.since, {
                    month: formatMonth(parseISO(current.valid_from), t),
                  })}
                </Text>
                {current.basis ? <Text style={styles.meta}>{fmt(m.basis, { basis: current.basis })}</Text> : null}
                <Pressable accessibilityRole="button" onPress={() => router.push('/maintenance-terms')}>
                  <Text style={styles.link}>{m.changeTerms}</Text>
                </Pressable>
              </Card>
            ) : (
              <Card style={{ gap: spacing.sm }}>
                <Text style={styles.big}>{m.emptyTitle}</Text>
                <Text style={styles.text}>{m.emptyText}</Text>
                <PrimaryButton
                  title={m.setTerms}
                  icon="create-outline"
                  onPress={() => router.push('/maintenance-terms')}
                />
              </Card>
            )}
            {rows.some((r) => r.status) ? (
              <>
                <Text style={styles.section}>{m.months}</Text>
                <Card style={{ gap: spacing.sm }}>
                  {rows
                    .filter((r) => r.status)
                    .map((r) => (
                      <MonthLine key={r.month} row={r} />
                    ))}
                </Card>
              </>
            ) : null}
            <Text style={styles.section}>{m.payments}</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.intro}>{m.emptyPayments}</Text>}
        renderItem={({ item: p }) => {
          const mine = p.created_by === userId;
          return (
            <Card style={{ gap: 4 }}>
              <View style={styles.paymentHead}>
                <Text style={styles.amount}>{formatMoney(p.amount_cents)}</Text>
                <Text style={styles.text}>{nameOf(p.payer)}</Text>
              </View>
              <Text style={styles.text}>
                {fmt(m.paymentLine, {
                  date: formatDate(p.paid_on, t),
                  month: formatMonth(parseISO(p.month), t),
                })}
              </Text>
              {p.note ? <Text style={styles.text}>{p.note}</Text> : null}
              <Text style={styles.meta}>
                {mine ? m.enteredByYou : fmt(m.enteredBy, { name: otherName })} · {formatTimestamp(p.created_at)}
              </Text>
              <ExpenseStatus expense={p} mine={mine} />
              {p.status === 'open' ? (
                <View style={styles.buttons}>
                  {!mine ? (
                    <>
                      <View style={{ flex: 1 }}>
                        <SecondaryButton
                          title={m.confirm}
                          icon="checkmark"
                          onPress={() => attempt(() => answerMaintenance(p.id, true))}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <SecondaryButton
                          title={m.dispute}
                          icon="close"
                          danger
                          onPress={() => attempt(() => answerMaintenance(p.id, false))}
                        />
                      </View>
                    </>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <SecondaryButton
                        title={m.withdraw}
                        icon="arrow-undo"
                        danger
                        onPress={() => attempt(() => removeMaintenancePayment(p.id))}
                      />
                    </View>
                  )}
                </View>
              ) : null}
            </Card>
          );
        }}
        ListFooterComponent={<Text style={styles.hint}>{m.hint}</Text>}
      />
      <Fab label={m.add} onPress={() => router.push('/maintenance-new')} />
    </View>
  );
}

function MonthLine({ row }: { row: MonthRow }) {
  const t = useT();
  const m = t.money.maintenance;
  if (!row.status) return null;
  return (
    <View style={styles.monthRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.monthName}>{formatMonth(parseISO(row.month), t)}</Text>
        <Text style={styles.meta}>
          {fmt(m.paidOfDue, {
            paid: formatMoney(row.confirmed),
            due: formatMoney(row.due),
          })}
          {row.open ? ` · ${fmt(m.unconfirmed, { amount: formatMoney(row.open) })}` : ''}
        </Text>
      </View>
      <Text style={[styles.badge, { color: STATUS_COLOR[row.status] }]}>{statusLabel(row.status, t)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 120 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  big: { fontSize: 17, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.text, lineHeight: 21 },
  meta: { fontSize: 12, color: colors.textMuted },
  link: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  monthName: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { fontSize: 13, fontWeight: '800' },
  paymentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  amount: { fontSize: 18, fontWeight: '800', color: colors.text },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
