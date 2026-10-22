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
import { fmt, useT } from '@/i18n';
import { toISO, today } from '@/lib/dates';
import { categories, formatMoney, needs, parseMoney } from '@/lib/money';
import { other } from '@/lib/schedule';
import { close } from '@/lib/nav';
import { colors, radius, spacing } from '@/theme';

export default function ExpenseNew() {
  const t = useT();
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
  const needList = needs(t);

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
        title: title.trim() || (kind === 'payment' ? t.money.new.defaultPayment : t.money.new.defaultExpense),
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
          <Chip label={t.money.new.kindExpense} selected={kind === 'expense'} onPress={() => setKind('expense')} />
          <Chip label={t.money.new.kindPayment} tint="accent" selected={kind === 'payment'} onPress={() => setKind('payment')} />
        </View>

        <Field
          label={t.money.new.amount}
          value={amount}
          onChangeText={setAmount}
          placeholder={t.money.new.amountPlaceholder}
          keyboardType="decimal-pad"
          style={styles.amount}
        />
        <Field
          label={kind === 'payment' ? t.money.new.note : t.money.new.what}
          value={title}
          onChangeText={setTitle}
          placeholder={kind === 'payment' ? t.money.new.notePlaceholder : t.money.new.whatPlaceholder}
          maxLength={200}
        />
        <DateField label={t.money.new.date} value={day} onChange={setDay} maximumDate={today()} />

        <Label>{kind === 'payment' ? t.money.new.whoPaidPayment : t.money.new.whoPaidExpense}</Label>
        <View style={styles.chips}>
          <Chip label={t.money.new.me} selected={paidBy === me} onPress={() => setPaidBy(me)} />
          <Chip label={otherName} tint="accent" selected={paidBy !== me} onPress={() => setPaidBy(other(me))} />
        </View>
        {kind === 'payment' ? (
          <Text style={styles.hint}>
            {fmt(
              paidBy === me
                ? cents
                  ? t.money.new.paymentHintMe
                  : t.money.new.paymentHintMeNoAmount
                : cents
                  ? t.money.new.paymentHintOther
                  : t.money.new.paymentHintOtherNoAmount,
              { name: otherName, amount: cents ? formatMoney(cents) : '' },
            )}
          </Text>
        ) : (
          <>
            <Label>{t.money.new.myShare}</Label>
            <View style={styles.chips}>
              {shares.map((s) => (
                <Chip key={s} label={`${s} %`} selected={myShare === s} onPress={() => setMyShare(s)} />
              ))}
            </View>
            <Text style={styles.hint}>
              {cents
                ? fmt(t.money.new.shareHint, {
                    mine: formatMoney(Math.round((cents * myShare) / 100)),
                    name: otherName,
                    theirs: formatMoney(cents - Math.round((cents * myShare) / 100)),
                  })
                : t.money.new.shareDefaultHint}
            </Text>

            <Label>{t.money.new.category}</Label>
            <View style={styles.chips}>
              {categories(t).map((c) => (
                <Chip
                  key={c.key}
                  label={`${c.emoji} ${c.label}`}
                  selected={category === c.key}
                  onPress={() => setCategory(c.key)}
                />
              ))}
            </View>

            <Label>{t.money.new.need}</Label>
            <View style={styles.chips}>
              {needList.map((n) => (
                <Chip key={n.key} label={n.label} tint="accent" selected={need === n.key} onPress={() => setNeed(n.key)} />
              ))}
            </View>
            <Text style={styles.hint}>{needList.find((n) => n.key === need)?.text}</Text>
          </>
        )}

        <Label>{plus ? t.money.new.receipt : t.money.new.receiptPlus}</Label>
        {receipt ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t.money.new.removeReceipt} onPress={() => setReceipt(null)}>
            <Image source={{ uri: receipt.uri }} style={styles.receipt} />
            <Text style={styles.hint}>{t.money.new.tapToRemove}</Text>
          </Pressable>
        ) : (
          <View style={styles.chips}>
            {Platform.OS !== 'web' ? (
              <Pressable accessibilityRole="button" onPress={() => pickReceipt(true)} style={styles.receiptButton}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.receiptText}>{t.money.new.takePhoto}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => pickReceipt(false)} style={styles.receiptButton}>
              <Ionicons name="image-outline" size={20} color={colors.primary} />
              <Text style={styles.receiptText}>{t.money.new.fromPhotos}</Text>
            </Pressable>
          </View>
        )}

        <PrimaryButton title={busy ? t.common.saving : t.common.save} icon="checkmark" disabled={busy || !cents} onPress={save} />
        <Text style={styles.hint}>
          {otherJoined
            ? fmt(t.money.new.confirmHint, { name: otherName })
            : fmt(t.money.new.notJoinedHint, { name: otherName })}
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
