import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Label } from '@/components/ui';
import { ISODate } from '@/data/types';
import { useT } from '@/i18n';
import { formatMonth, parseISO } from '@/lib/dates';
import { addMonths } from '@/lib/maintenance';
import { colors, radius, spacing } from '@/theme';

/** Monat wählen mit Pfeilen – Wert ist immer der Monatsanfang „YYYY-MM-01“. */
export function MonthField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ISODate;
  onChange: (month: ISODate) => void;
}) {
  const t = useT();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.calendar.calendar.prevMonth}
          hitSlop={10}
          onPress={() => onChange(addMonths(value, -1))}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.text}>{formatMonth(parseISO(value), t)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.calendar.calendar.nextMonth}
          hitSlop={10}
          onPress={() => onChange(addMonths(value, 1))}
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  text: { fontSize: 16, fontWeight: '700', color: colors.text },
});
