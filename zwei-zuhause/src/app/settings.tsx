import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { InviteCard } from '@/components/InviteCard';
import { Card, Chip, confirmDestructive, Field, Label, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { PRIVACY_URL, TERMS_URL } from '@/config';
import { purchasesAvailable, usePlus } from '@/data/plus';
import { attempt, useFamily } from '@/data/store';
import { fmt, Lang, LANGUAGES, useLanguage, useT } from '@/i18n';
import { loadAppLock, lockAvailable, saveAppLock, unlock } from '@/lib/appLock';
import { close } from '@/lib/nav';
import { loadHandoverReminder, saveHandoverReminder } from '@/lib/reminders';
import { colors, spacing } from '@/theme';

const SHARES = [50, 60, 70, 80, 100, 40, 30, 20, 0];

export default function Settings() {
  const t = useT();
  const s = t.settings.settings;
  const { lang, setLang } = useLanguage();
  const {
    family,
    me,
    otherJoined,
    otherName,
    updateFamily,
    signOut,
    deleteAccount,
    setReadReceipts,
  } = useFamily();
  const myReceipts = me === 'a' ? family.read_receipts_a : family.read_receipts_b;
  const [lockOn, setLockOn] = useState(false);
  const [reminderOn, setReminderOn] = useState(true);

  useEffect(() => {
    loadAppLock().then(setLockOn);
    loadHandoverReminder().then(setReminderOn);
  }, []);

  const toggleLock = async (on: boolean) => {
    if (on) {
      if (!(await lockAvailable())) {
        showError(s.noLockTitle, s.noLockText);
        return;
      }
      // Einmal bestätigen – so ist sicher, dass das Entsperren klappt.
      if (!(await unlock())) return;
    }
    setLockOn(on);
    await saveAppLock(on);
  };

  const toggleReminder = async (on: boolean) => {
    setReminderOn(on);
    // Neu geplant wird in HandoverReminders – für alle Familien.
    await saveHandoverReminder(on);
  };
  const [nameA, setNameA] = useState(family.name_a);
  const [nameB, setNameB] = useState(family.name_b);
  const [kids, setKids] = useState(family.children);
  // Angezeigt wird immer mein Anteil, gespeichert der Anteil von Elternteil a.
  const [myShare, setMyShare] = useState(me === 'a' ? family.default_share_a : 100 - family.default_share_a);
  const [saving, setSaving] = useState(false);
  const { active: plus } = usePlus();

  const save = async () => {
    Keyboard.dismiss();
    setSaving(true);
    const ok = await attempt(() =>
      updateFamily({
        name_a: nameA.trim(),
        name_b: nameB.trim(),
        children: kids.trim(),
        default_share_a: me === 'a' ? myShare : 100 - myShare,
      }),
    );
    if (ok) close();
    else setSaving(false);
  };

  const chooseLanguage = async (code: Lang) => {
    const needsRestart = await setLang(code);
    if (needsRestart) showError(t.common.restartTitle, t.common.restartText);
  };

  const logout = () =>
    confirmDestructive(s.logoutTitle, s.logoutText, s.logout, () => {
      router.dismissAll();
      signOut();
    });

  const removeAccount = () =>
    confirmDestructive(
      s.deleteTitle,
      otherJoined ? fmt(s.deleteTextJoined, { name: otherName }) : s.deleteTextAlone,
      s.deleteConfirm,
      () => {
        attempt(deleteAccount).then((ok) => ok && router.dismissAll());
      },
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Label>{t.common.language.title}</Label>
          <View style={styles.chips}>
            {LANGUAGES.map((l) => (
              <Chip key={l.code} label={l.name} selected={lang === l.code} onPress={() => chooseLanguage(l.code)} />
            ))}
          </View>
          <Text style={styles.note}>{t.common.language.hint}</Text>
        </Card>

        {purchasesAvailable || plus ? (
          <SecondaryButton
            title={plus ? s.plusActive : s.plus}
            icon="shield-checkmark"
            onPress={() => router.push('/plus')}
          />
        ) : null}
        {!otherJoined ? <InviteCard code={family.invite_code} otherName={otherName} /> : null}

        <Card style={styles.card}>
          <Field label={s.parent1} value={nameA} onChangeText={setNameA} />
          <Field label={s.parent2} value={nameB} onChangeText={setNameB} />
          <Field label={s.children} value={kids} onChangeText={setKids} placeholder={s.childrenPlaceholder} />
        </Card>

        <Card style={styles.card}>
          <Label>{s.myShare}</Label>
          <View style={styles.chips}>
            {SHARES.map((s) => (
              <Chip key={s} label={`${s} %`} selected={myShare === s} onPress={() => setMyShare(s)} />
            ))}
          </View>
          <Text style={styles.note}>{s.shareNote}</Text>
        </Card>

        <SecondaryButton title={s.changeSchedule} icon="calendar-outline" onPress={() => router.push('/schedule')} />

        <Card style={styles.card}>
          <ToggleRow
            title={s.readReceipts}
            text={fmt(s.readReceiptsText, { name: otherName })}
            value={myReceipts}
            onChange={(on) => attempt(() => setReadReceipts(on))}
          />
        </Card>

        {Platform.OS !== 'web' ? (
          <Card style={styles.card}>
            <ToggleRow
              title={s.appLock}
              text={s.appLockText}
              value={lockOn}
              onChange={toggleLock}
            />
            <ToggleRow
              title={s.reminder}
              text={s.reminderText}
              value={reminderOn}
              onChange={toggleReminder}
            />
          </Card>
        ) : null}

        <PrimaryButton
          title={saving ? t.common.saving : t.common.save}
          icon="checkmark"
          disabled={saving || !nameA.trim() || !nameB.trim()}
          onPress={save}
        />

        <View style={styles.footer}>
          <Text style={styles.note}>{s.disclaimer}</Text>
          {PRIVACY_URL ? (
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
              {s.privacy}
            </Text>
          ) : null}
          {TERMS_URL ? (
            <Text style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
              {s.terms}
            </Text>
          ) : null}
          <SecondaryButton title={s.account} icon="person-circle-outline" onPress={() => router.push('/account')} />
          <SecondaryButton title={s.intro} icon="play-circle-outline" onPress={() => router.push('/intro')} />
          <SecondaryButton title={s.logout} icon="log-out-outline" onPress={logout} />
          <SecondaryButton title={s.deleteAccount} icon="trash-outline" danger onPress={removeAccount} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ToggleRow({
  title,
  text,
  value,
  onChange,
}: {
  title: string;
  text: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleText}>{text}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  toggleText: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  card: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { marginTop: spacing.xl, gap: spacing.md },
  note: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  link: { fontSize: 14, color: colors.primary, textAlign: 'center', fontWeight: '600' },
});
