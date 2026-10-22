import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { MonthField } from '@/components/MonthField';
import { WriteGate } from '@/components/SubscriptionBanner';
import { Chip, Field, Label, PrimaryButton, showError } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ParentKey } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { toISO, today } from '@/lib/dates';
import { monthStart, termFor } from '@/lib/maintenance';
import { formatMoney, parseMoney } from '@/lib/money';
import { close } from '@/lib/nav';
import { other } from '@/lib/schedule';
import { colors, spacing } from '@/theme';

export default function MaintenanceNew() {
  const t = useT();
  const m = t.money.maintenanceNew;
  const { me, nameOf, otherName, maintenance_terms, addMaintenancePayment } = useFamily();
  const [month, setMonth] = useState(monthStart(today()));
  const term = termFor(maintenance_terms, month);
  const [payer, setPayer] = useState<ParentKey>(termFor(maintenance_terms, monthStart(today()))?.payer ?? other(me));
  // Vorschlag: der vereinbarte Betrag – ohne Euro-Zeichen, damit man ihn direkt ändern kann.
  const [amount, setAmount] = useState(term ? formatMoney(term.amount_cents).replace(' €', '') : '');
  const [paidOn, setPaidOn] = useState(toISO(today()));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const cents = parseMoney(amount);
    if (!cents) {
      showError(t.common.failed, m.invalidAmount);
      return;
    }
    setBusy(true);
    const ok = await attempt(() =>
      addMaintenancePayment({
        payer,
        month,
        amount_cents: cents,
        paid_on: paidOn,
        note: note.trim(),
      }),
    );
    if (ok) close();
    else setBusy(false);
  };

  return (
    <WriteGate>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Label>{m.whoPays}</Label>
          <View style={styles.chips}>
            {(['a', 'b'] as const).map((k) => (
              <Chip key={k} label={nameOf(k)} selected={payer === k} onPress={() => setPayer(k)} />
            ))}
          </View>
          <MonthField label={m.month} value={month} onChange={setMonth} />
          <Field
            label={m.amount}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <DateField label={m.paidOn} value={paidOn} onChange={setPaidOn} maximumDate={today()} />
          <Field label={m.note} value={note} onChangeText={setNote} placeholder={m.notePlaceholder} maxLength={500} />
          <Text style={styles.hint}>{payer === me ? fmt(m.payerHint, { name: otherName }) : m.receiverHint}</Text>
          <PrimaryButton title={busy ? t.common.saving : m.save} icon="checkmark" disabled={busy} onPress={save} />
        </ScrollView>
      </KeyboardAvoidingView>
    </WriteGate>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    textAlign: 'center',
  },
});
