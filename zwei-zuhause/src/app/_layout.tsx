import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLock } from '@/components/AppLock';
import { HandoverReminders } from '@/components/HandoverReminders';
import { IntroGate } from '@/components/Intro';
import { DialogHost, PrimaryButton } from '@/components/ui';
import { isConfigured } from '@/config';
import { LanguageProvider, useT } from '@/i18n';
import { AuthProvider, useAuth } from '@/data/auth';
import { PlusProvider } from '@/data/plus';
import { StoreProvider, useStore } from '@/data/store';
import { registerForPush, urlFromResponse } from '@/lib/push';
import { colors, spacing } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="light" />
        {isConfigured ? (
          <IntroGate>
            <AuthProvider>
              <Gate />
            </AuthProvider>
          </IntroGate>
        ) : (
          <NotConfigured />
        )}
        <DialogHost />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function Gate() {
  const { loading, session } = useAuth();
  if (loading) return <Blank />;
  if (!session) return <RootStack signedIn={false} hasFamily={false} professional={false} />;
  return (
    // key: beim Kontowechsel wird aller Zustand verworfen.
    <AppLock>
      <StoreProvider key={session.user.id} userId={session.user.id}>
        <SignedIn />
      </StoreProvider>
    </AppLock>
  );
}

function SignedIn() {
  const t = useT();
  const { loading, loadFailed, family, isProfessional, retry } = useStore();
  if (loading) return <Blank />;
  if (loadFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t.settings.root.offlineTitle}</Text>
        <Text style={styles.text}>{t.settings.root.offlineText}</Text>
        <PrimaryButton title={t.settings.root.retry} icon="refresh" onPress={retry} />
      </View>
    );
  }
  return (
    <PlusProvider>
      <RootStack signedIn hasFamily={family !== null} professional={isProfessional} />
      {(family || isProfessional) && Platform.OS !== 'web' ? <PushSetup /> : null}
      {family && Platform.OS !== 'web' ? <HandoverReminders /> : null}
    </PlusProvider>
  );
}

/** Meldet das Handy für Mitteilungen an und öffnet beim Antippen einer Mitteilung den passenden Bildschirm. */
function PushSetup() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    registerForPush();
  }, []);

  useEffect(() => {
    const url = urlFromResponse(response);
    if (!url) return;
    try {
      router.navigate(url as Parameters<typeof router.navigate>[0]);
    } catch {
      // Navigation noch nicht bereit – dann bleibt die Startseite offen.
    }
  }, [response]);

  return null;
}

function RootStack({
  signedIn,
  hasFamily,
  professional,
}: {
  signedIn: boolean;
  hasFamily: boolean;
  professional: boolean;
}) {
  const t = useT();
  const titles = t.settings.titles;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        // Nur der Pfeil – sonst steht dort der Name des vorigen Bildschirms, z. B. „(tabs)“.
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasFamily && !professional}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && professional}>
        <Stack.Screen name="cases" />
        <Stack.Screen name="case/[id]" options={{ headerShown: true, title: '' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && hasFamily}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="change-new" options={modal(titles.changeNew)} />
        <Stack.Screen name="expense-new" options={modal(titles.expenseNew)} />
        <Stack.Screen name="expense/[id]" options={{ headerShown: true, title: titles.expense }} />
        <Stack.Screen name="journal-new" options={modal(titles.journalNew)} />
        <Stack.Screen name="schedule" options={modal(titles.schedule)} />
        <Stack.Screen name="report" options={{ headerShown: true, title: titles.report }} />
        <Stack.Screen name="journal" options={{ headerShown: true, title: titles.journal }} />
        <Stack.Screen name="decisions" options={{ headerShown: true, title: titles.decisions }} />
        <Stack.Screen name="decision-new" options={modal(titles.decisionNew)} />
        <Stack.Screen name="handovers" options={{ headerShown: true, title: titles.handovers }} />
        <Stack.Screen name="handover-new" options={modal(titles.handoverNew)} />
        <Stack.Screen name="child-info" options={{ headerShown: true, title: titles.childInfo }} />
        <Stack.Screen name="child-info-edit" options={modal(titles.childInfoEdit)} />
        <Stack.Screen name="agreement" options={{ headerShown: true, title: titles.agreement }} />
        <Stack.Screen name="agreement-edit" options={modal(titles.agreementEdit)} />
        <Stack.Screen name="professionals" options={{ headerShown: true, title: titles.professionals }} />
        <Stack.Screen name="help" options={{ headerShown: true, title: titles.help }} />
        <Stack.Screen name="intro" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="account" options={{ headerShown: true, title: titles.account }} />
        <Stack.Screen name="documents" options={{ headerShown: true, title: titles.documents }} />
        <Stack.Screen name="document-new" options={modal(titles.documentNew)} />
        <Stack.Screen name="settings" options={modal(titles.settings)} />
        <Stack.Screen name="plus" options={modal(titles.plus)} />
        <Stack.Screen name="maintenance" options={{ headerShown: true, title: titles.maintenance }} />
        <Stack.Screen name="maintenance-new" options={modal(titles.maintenanceNew)} />
        <Stack.Screen name="maintenance-terms" options={modal(titles.maintenanceTerms)} />
        <Stack.Screen name="packing" options={{ headerShown: true, title: titles.packing }} />
        <Stack.Screen name="holidays" options={{ headerShown: true, title: titles.holidays }} />
        <Stack.Screen name="calendar-sync" options={{ headerShown: true, title: titles.calendarSync }} />
      </Stack.Protected>
    </Stack>
  );
}

function modal(title: string) {
  return { presentation: 'modal' as const, headerShown: true, title };
}

function Blank() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}

function NotConfigured() {
  const t = useT();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t.settings.root.notConfiguredTitle}</Text>
      <Text style={styles.text}>{t.settings.root.notConfiguredText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
