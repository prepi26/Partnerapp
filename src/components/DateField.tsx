import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ISODate } from '@/data/types';
import { formatDate, parseISO, toISO } from '@/lib/dates';
import { colors, radius, spacing } from '@/theme';

import { Label } from './ui';

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function DateField({
  label,
  value,
  onChange,
  maximumDate,
}: {
  label: string;
  value: ISODate;
  onChange: (value: ISODate) => void;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  // Der native Picker existiert im Browser nicht – dort reicht ein Textfeld.
  if (Platform.OS === 'web') {
    return <WebDateInput label={label} value={value} onChange={onChange} />;
  }

  const show = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseISO(value),
        mode: 'date',
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISO(date));
        },
      });
    } else {
      setOpen((o) => !o);
    }
  };

  return (
    <View style={styles.wrap}>
      <Label>{label}</Label>
      <Pressable accessibilityRole="button" onPress={show} style={styles.row}>
        <Ionicons name="calendar-outline" size={20} color={colors.pink} />
        <Text style={styles.value}>{formatDate(value)}</Text>
        {Platform.OS === 'ios' ? (
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        ) : null}
      </Pressable>
      {Platform.OS === 'ios' && open ? (
        <DateTimePicker
          value={parseISO(value)}
          mode="date"
          display="inline"
          locale="de-DE"
          accentColor={colors.pink}
          maximumDate={maximumDate}
          onChange={(_, date) => date && onChange(toISO(date))}
        />
      ) : null}
    </View>
  );
}

function WebDateInput({ label, value, onChange }: { label: string; value: ISODate; onChange: (v: ISODate) => void }) {
  const [text, setText] = useState(value);
  return (
    <View style={styles.wrap}>
      <Label>{label}</Label>
      <TextInput
        value={text}
        placeholder="JJJJ-MM-TT"
        placeholderTextColor={colors.textMuted}
        onChangeText={(t) => {
          setText(t);
          if (ISO_PATTERN.test(t) && !Number.isNaN(parseISO(t).getTime())) onChange(t);
        }}
        style={[styles.row, styles.value]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  value: { flex: 1, fontSize: 16, color: colors.text },
});
