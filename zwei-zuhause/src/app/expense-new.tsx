import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { Chip, Field, Label, PrimaryButton } from '@/components/ui';
import { usePlus } from '@/data/plus';
import { attempt, NewPhoto, useFamily } from '@/data/store';
import { ExpenseKind, NeedType, ParentKey } from '@/data/types';
import { toISO, today } from '@/lib/dates';
import { CATEGORIES, formatMoney, NEEDS, parseMoney } from '@/lib/money';
import { other } from '@/lib/schedule';
import { close } from '@/lib/nav';
import { colors, radius, spacing } from '@/theme';

export default function ExpenseNew() {
  const { family, me, otherName, otherJoined, addExpense } = useFamily();
  const { active: plus } = usePlus();
  const [kind, setKind] = useState<ExpenseKind>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(toISO(today()));
  const [category, setCategory] = useState('sonstiges');
  const [paidBy, setPaidBy] = useState<ParentKey>(me);
  // Mein Anteil in Prozent – gespeichert wird der Anteil von Elternteil a.
  const defaultMine = me === 'a' ? family.default_share_a : 100 - family.default_share_a;
  const [myShare, setMyShare] = useState(defaultMine);
  const [need, setNeed] = useState<NeedType>('regular');
  const [receipt, setReceipt] = useState<NewPhoto | null>(null);
  const [busy, setBusy] = useState(false);

  const cents = parseMoney(amount);
  const shares = [...new Set([50, defaultMine, 100 - defaultMine, 0, 100])];

  const pickReceipt = async (camera: boolean) => {
    if (!plus) {
      router.push('/plus');
      return;
    }
    if (camera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) {
      const asset = result.assets[0];
      setReceipt({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' });
    }
  };

  const save = async () => {
    if (!cents) return;
    setBusy(true);
    const ok = await attempt(() =>
      addExpense({
        kind,
        title: title.trim() || (kind === 'payment' ? 'Ausgleichszahlung' : 'Ausgabe'),
        category: kind === 'payment' ? 'ausgleich' : category,
        amount_cents: cents,
        day,
        paid_by: paidBy,
        share_a: me === 'a' ? myShare : 100 - myShare,
        need: kind === 'payment' ? 'regular' : need,
        receipt: receipt ?? undefined,
      }),
    );
    if (ok) close();
    else setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          <Chip label="Ausgabe" selected={kind === 'expense'} onPress={() => setKind('expense')} />
          <Chip label="Ausgleichszahlung" tint="accent" selected={kind === 'payment'} onPress={() => setKind('payment')} />
        </View>

        <Field
          label="Betrag in €"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
          style={styles.amount}
        />
        <Field
          label={kind === 'payment' ? 'Notiz (optional)' : 'Wofür?'}
          value={title}
          onChangeText={setTitle}
          placeholder={kind === 'payment' ? 'z. B. Überweisung Oktober' : 'z. B. Winterjacke'}
          maxLength={200}
        />
        <DateField label="Datum" value={day} onChange={setDay} maximumDate={today()} />

        <Label>{kind === 'payment' ? 'Wer hat gezahlt?' : 'Wer hat bezahlt?'}</Label>
        <View style={styles.chips}>
          <Chip label="Ich" selected={paidBy === me} onPress={() => setPaidBy(me)} />
          <Chip label={otherName} tint="accent" selected={paidBy !== me} onPress={() => setPaidBy(other(me))} />
        </View>
        {kind === 'payment' ? (
          <Text style={styles.hint}>
            {paidBy === me ? `Du hast ${otherName}` : `${otherName} hat dir`} {cents ? formatMoney(cents) : 'den Betrag'}{' '}
            gezahlt, um den Saldo auszugleichen.
          </Text>
        ) : (
          <>
            <Label>Mein Anteil</Label>
            <View style={styles.chips}>
              {shares.map((s) => (
                <Chip key={s} label={`${s} %`} selected={myShare === s} onPress={() => setMyShare(s)} />
              ))}
            </View>
            <Text style={styles.hint}>
              {cents
                ? `Du trägst ${formatMoney(Math.round((cents * myShare) / 100))}, ${otherName} ${formatMoney(cents - Math.round((cents * myShare) / 100))}.`
                : 'Den Standard-Anteil stellst du in den Einstellungen ein.'}
            </Text>

            <Label>Kategorie</Label>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.key}
                  label={`${c.emoji} ${c.label}`}
                  selected={category === c.key}
                  onPress={() => setCategory(c.key)}
                />
              ))}
            </View>

            <Label>Art der Ausgabe</Label>
            <View style={styles.chips}>
              {NEEDS.map((n) => (
                <Chip key={n.key} label={n.label} tint="accent" selected={need === n.key} onPress={() => setNeed(n.key)} />
              ))}
            </View>
            <Text style={styles.hint}>{NEEDS.find((n) => n.key === need)?.text}</Text>
          </>
        )}

        <Label>Beleg {plus ? '' : '(Plus)'}</Label>
        {receipt ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Beleg entfernen" onPress={() => setReceipt(null)}>
            <Image source={{ uri: receipt.uri }} style={styles.receipt} />
            <Text style={styles.hint}>Tippen zum Entfernen</Text>
          </Pressable>
        ) : (
          <View style={styles.chips}>
            {Platform.OS !== 'web' ? (
              <Pressable accessibilityRole="button" onPress={() => pickReceipt(true)} style={styles.receiptButton}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.receiptText}>Foto machen</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => pickReceipt(false)} style={styles.receiptButton}>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={styles.receiptText}>Aus Fotos</Text>
            </Pressable>
          </View>
        )}

        <PrimaryButton title={busy ? 'Speichere…' : 'Speichern'} icon="checkmark" disabled={busy || !cents} onPress={save} />
        <Text style={styles.hint}>
          {otherJoined
            ? `${otherName} kann den Eintrag bestätigen oder ablehnen. Bestätigte Einträge lassen sich nicht mehr löschen.`
            : `Sobald ${otherName} verbunden ist, kann er/sie deine Einträge bestätigen.`}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  amount: { fontSize: 28, fontWeight: '800' },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  receipt: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.muted },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  receiptText: { fontSize: 15, fontWeight: '600', color: colors.primary },
});
