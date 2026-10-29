import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MonthField } from '@/components/MonthField';
import { PlusGate } from '@/components/SubscriptionBanner';
import { Chip, Field, Label, PrimaryButton, showError } from '@/components/ui';
import { attempt, useFamily } from '@/data/store';
import { ParentKey } from '@/data/types';
import { fmt, useT } from '@/i18n';
import { today } from '@/lib/dates';
import { monthStart, termFor } from '@/lib/maintenance';
import { formatMoney, parseMoney } from '@/lib/money';
import { close } from '@/lib/nav';
import { colors, spacing } from '@/theme';

export default function MaintenanceTerms() {
  const t = useT();
  const m = t.money.maintenanceTerms;
  const { nameOf, otherName, maintenance_terms, setMaintenance } = useFamily();
  const current = termFor(maintenance_terms, monthStart(today()));
  const [payer, setPayer] = useState<ParentKey | null>(current?.payer ?? null);
  const [amount, setAmount] = useState(current ? formatMoney(current.amount_cents).replace(' €', '') : '');
  const [from, setFrom] = useState(monthStart(today()));
  const [basis, setBasis] = useState(current?.basis ?? '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    // 0 € ist erlaubt (z. B. Wechselmodell ohne Zahlung) – parseMoney kennt nur positive Beträge.
    const cents = amount.trim().replace(/[,.]0*$/, '') === '0' ? 0 : parseMoney(amount);
    if (cents === null || !payer) {
      showError(t.common.failed, t.money.maintenanceNew.invalidAmount);
      return;
    }
    setBusy(true);
    const ok = await attempt(() =>
      setMaintenance({
        payer,
        amount_cents: cents,
        valid_from: from,
        basis: basis.trim(),
      }),
    );
    if (ok) close();
    else setBusy(false);
  };

  return (
    <PlusGate>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Label>{m.whoPays}</Label>
          <View style={styles.chips}>
            {(['a', 'b'] as const).map((k) => (
              <Chip key={k} label={nameOf(k)} selected={payer === k} onPress={() => setPayer(k)} />
            ))}
          </View>
          <Field
            label={m.amount}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
          <MonthField label={m.from} value={from} onChange={setFrom} />
          <Field
            label={m.basis}
            value={basis}
            onChangeText={setBasis}
            placeholder={m.basisPlaceholder}
            maxLength={300}
          />
          <Text style={styles.hint}>{fmt(m.sharedHint, { name: otherName })}</Text>
          <PrimaryButton
            title={busy ? t.common.saving : m.save}
            icon="checkmark"
            disabled={busy || !payer}
            onPress={save}
          />
          <Text style={styles.hint}>{t.money.maintenance.hint}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </PlusGate>
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
