import { StyleSheet, Text, View } from 'react-native';

import { ParentKey } from '@/data/types';
import { colors, radius } from '@/theme';

export function parentColor(key: ParentKey | null) {
  if (key === 'a') return { main: colors.parentA, pale: colors.parentAPale };
  if (key === 'b') return { main: colors.parentB, pale: colors.parentBPale };
  return { main: colors.textMuted, pale: colors.muted };
}

/** Farbiger Name eines Elternteils – dieselbe Farbe wie im Kalender. */
export function ParentTag({ parent, name }: { parent: ParentKey | null; name: string }) {
  const c = parentColor(parent);
  return (
    <View style={[styles.tag, { backgroundColor: c.pale }]}>
      <View style={[styles.dot, { backgroundColor: c.main }]} />
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 13, fontWeight: '700', color: colors.text },
});
