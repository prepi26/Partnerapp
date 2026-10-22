import { useState } from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Card, confirmDestructive, PrimaryButton, SecondaryButton, showError } from '@/components/ui';
import { SUPABASE_URL } from '@/config';
import { attempt, errorMessage, useFamily } from '@/data/store';
import { currentLanguage, fmt, useT } from '@/i18n';
import { colors, spacing } from '@/theme';

/** Adresse des Kalender-Abos (Edge Function „calendar“). webcal:// öffnet auf dem iPhone direkt den Abo-Dialog. */
function feedUrl(token: string) {
  return `${SUPABASE_URL}/functions/v1/calendar?token=${token}`;
}

export default function CalendarSync() {
  const t = useT();
  const s = t.calendar.sync;
  const { family, calendarToken, stopCalendarFeed } = useFamily();
  const [busy, setBusy] = useState(false);
  const [stopped, setStopped] = useState(false);

  const withToken = async (action: (url: string) => Promise<unknown>, renew = false) => {
    setBusy(true);
    try {
      await action(feedUrl(await calendarToken(currentLanguage(), renew)));
      setStopped(false);
    } catch (e) {
      showError(t.common.failed, errorMessage(e));
    }
    setBusy(false);
  };

  const subscribe = () =>
    withToken(async (url) => {
      const webcal = url.replace(/^https?:/, 'webcal:');
      // Android kennt webcal:// meist nicht – dann den Link teilen.
      if (Platform.OS === 'android' || !(await Linking.canOpenURL(webcal))) await Share.share({ message: url });
      else await Linking.openURL(webcal);
    });

  const share = () => withToken((url) => Share.share({ message: fmt(s.shareMessage, { url }) }));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>{s.intro}</Text>
      {family.schedule_model === 'none' ? <Text style={styles.warning}>{s.noPlan}</Text> : null}
      <PrimaryButton title={s.open} icon="calendar" disabled={busy} onPress={subscribe} />
      <SecondaryButton title={s.share} icon="share-outline" onPress={() => !busy && share()} />

      <Card style={{ gap: spacing.sm }}>
        <View style={{ gap: 2 }}>
          <Text style={styles.title}>{s.iphoneTitle}</Text>
          <Text style={styles.text}>{s.iphoneText}</Text>
        </View>
        <View style={{ gap: 2 }}>
          <Text style={styles.title}>{s.googleTitle}</Text>
          <Text style={styles.text}>{s.googleText}</Text>
        </View>
      </Card>

      <Text style={styles.small}>{s.privacy}</Text>
      {stopped ? <Text style={styles.small}>{s.stopped}</Text> : null}

      <SecondaryButton
        title={s.renew}
        icon="refresh"
        onPress={() =>
          !busy && confirmDestructive(s.renewTitle, s.renewText, s.renew, () => withToken(async () => {}, true))
        }
      />
      <SecondaryButton
        title={s.stop}
        icon="close-circle-outline"
        danger
        onPress={() =>
          confirmDestructive(s.stopTitle, s.stopText, s.stop, async () => {
            if (await attempt(stopCalendarFeed)) setStopped(true);
          })
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  intro: { fontSize: 15, color: colors.text, lineHeight: 21 },
  warning: { fontSize: 14, color: colors.danger, fontWeight: '600', lineHeight: 20 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  text: { fontSize: 14, color: colors.text, lineHeight: 20 },
  small: { fontSize: 12, color: colors.textMuted, lineHeight: 17, textAlign: 'center' },
});
