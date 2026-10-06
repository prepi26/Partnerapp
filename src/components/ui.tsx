import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradient, radius, shadow, spacing } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
}

interface DialogRequest {
  title: string;
  message: string;
  action?: string;
  onConfirm?: () => void;
}

// Im Browser (und im Claude-Artefakt, das alert/confirm blockiert) zeigt die App eigene Dialoge.
let openDialog: ((request: DialogRequest) => void) | null = null;

/** Sicherheitsabfrage vor destruktiven Aktionen – auch im Browser. */
export function confirmDestructive(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (openDialog) openDialog({ title, message, action, onConfirm });
    else if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Fehler verständlich anzeigen. */
export function showError(title: string, message: string) {
  if (Platform.OS !== 'web') Alert.alert(title, message);
  else if (openDialog) openDialog({ title, message });
  else window.alert(`${title}\n${message}`);
}

/** Einmal im Root-Layout einbinden; rendert die Web-Dialoge. */
export function DialogHost() {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  useEffect(() => {
    openDialog = setRequest;
    return () => {
      openDialog = null;
    };
  }, []);
  if (!request) return null;
  const close = () => setRequest(null);
  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{request.title}</Text>
          <Text style={styles.dialogText}>{request.message}</Text>
          <View style={styles.dialogButtons}>
            {request.onConfirm ? (
              <>
                <Pressable accessibilityRole="button" onPress={close} style={styles.dialogButton}>
                  <Text style={styles.dialogCancel}>Abbrechen</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    close();
                    request.onConfirm?.();
                  }}
                  style={styles.dialogButton}
                >
                  <Text style={styles.dialogDanger}>{request.action}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable accessibilityRole="button" onPress={close} style={styles.dialogButton}>
                <Text style={styles.dialogOk}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function GradientHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </LinearGradient>
  );
}

export function HeaderIcon({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.headerIcon, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
        {icon ? <Ionicons name={icon} size={20} color={colors.white} /> : null}
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  danger,
  icon,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
  icon?: IconName;
}) {
  const color = danger ? colors.danger : colors.pink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, { borderColor: color, opacity: pressed ? 0.6 : 1 }]}
    >
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <Text style={[styles.secondaryText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.fabWrap, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
        <Ionicons name="add" size={32} color={colors.white} />
      </LinearGradient>
    </Pressable>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={40} color={colors.pink} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, props.multiline && styles.inputMultiline, style]}
        {...props}
      />
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Chip({
  label,
  selected,
  onPress,
  tint = 'pink',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tint?: 'pink' | 'blue';
}) {
  const main = tint === 'pink' ? colors.pink : colors.blue;
  const pale = tint === 'pink' ? colors.pinkPale : colors.bluePale;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, { backgroundColor: selected ? main : pale }]}
    >
      <Text style={[styles.chipText, { color: selected ? colors.white : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(46,31,71,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 8,
  },
  dialogTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  dialogText: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  dialogButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  dialogButton: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill },
  dialogCancel: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
  dialogDanger: { fontSize: 16, fontWeight: '800', color: colors.danger },
  dialogOk: { fontSize: 16, fontWeight: '800', color: colors.pink },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headerTitle: { color: colors.white, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { color: colors.white, opacity: 0.9, fontSize: 15, marginTop: 2 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow,
  },
  button: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondary: {
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  secondaryText: { fontSize: 16, fontWeight: '600' },
  fabWrap: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.pill, ...shadow },
  fab: { width: 62, height: 62, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 60, gap: spacing.sm },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.pinkPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  field: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill },
  chipText: { fontSize: 14, fontWeight: '600' },
});
