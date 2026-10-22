import { StyleSheet, Text } from 'react-native';

import { Expense } from '@/data/types';
import { useT } from '@/i18n';
import { colors } from '@/theme';

export function ExpenseStatus({ expense: e, mine }: { expense: Expense; mine: boolean }) {
  const t = useT();
  if (e.status === 'confirmed')
    return <Text style={[styles.status, { color: colors.primary }]}>✓ {t.money.status.confirmed}</Text>;
  if (e.status === 'disputed')
    return <Text style={[styles.status, { color: colors.danger }]}>✗ {t.money.status.disputed}</Text>;
  return (
    <Text style={[styles.status, { color: colors.warning }]}>
      {mine ? `⏳ ${t.money.status.waiting}` : `● ${t.money.status.check}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: 12, fontWeight: '700', marginTop: 3 },
});
