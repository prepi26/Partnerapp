import { StyleSheet, Text } from 'react-native';

import { Expense } from '@/data/types';
import { colors } from '@/theme';

export function ExpenseStatus({ expense: e, mine }: { expense: Expense; mine: boolean }) {
  if (e.status === 'confirmed') return <Text style={[styles.status, { color: colors.primary }]}>✓ bestätigt</Text>;
  if (e.status === 'disputed') return <Text style={[styles.status, { color: colors.danger }]}>✗ abgelehnt</Text>;
  return (
    <Text style={[styles.status, { color: colors.warning }]}>{mine ? '⏳ wartet auf Bestätigung' : '● bitte prüfen'}</Text>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: 12, fontWeight: '700', marginTop: 3 },
});
