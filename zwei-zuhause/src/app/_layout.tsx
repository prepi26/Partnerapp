import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLock } from '@/components/AppLock';
import { HandoverReminders } from '@/components/HandoverReminders';
import { DialogHost, PrimaryButton } from '@/components/ui';
import { isConfigured } from '@/config';
import { AuthProvider, useAuth } from '@/data/auth';
import { PlusProvider } from '@/data/plus';
import { StoreProvider, useStore } from '@/data/store';
import { registerForPush, urlFromResponse } from '@/lib/push';
import { colors, spacing } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {isConfigured ? (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      ) : (
        <NotConfigured />
      )}
      <DialogHost />
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
  const { loading, loadFailed, family, isProfessional, retry } = useStore();
  if (loading) return <Blank />;
  if (loadFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Keine Verbindung</Text>
        <Text style={styles.text}>Eure Daten liegen auf dem Server. Prüf deine Internetverbindung.</Text>
        <PrimaryButton title="Nochmal versuchen" icon="refresh" onPress={retry} />
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
        <Stack.Screen name="change-new" options={modal('Tag tauschen')} />
        <Stack.Screen name="expense-new" options={modal('Neue Ausgabe')} />
        <Stack.Screen name="expense/[id]" options={{ headerShown: true, title: 'Ausgabe' }} />
        <Stack.Screen name="journal-new" options={modal('Neuer Eintrag')} />
        <Stack.Screen name="schedule" options={modal('Umgangsplan')} />
        <Stack.Screen name="report" options={{ headerShown: true, title: 'Bericht als PDF' }} />
        <Stack.Screen name="journal" options={{ headerShown: true, title: 'Tagebuch 🔒' }} />
        <Stack.Screen name="decisions" options={{ headerShown: true, title: 'Entscheidungen' }} />
        <Stack.Screen name="decision-new" options={modal('Neue Frage')} />
        <Stack.Screen name="handovers" options={{ headerShown: true, title: 'Übergaben' }} />
        <Stack.Screen name="handover-new" options={modal('Übergabe eintragen')} />
        <Stack.Screen name="child-info" options={{ headerShown: true, title: 'Infos zum Kind' }} />
        <Stack.Screen name="child-info-edit" options={modal('Info')} />
        <Stack.Screen name="agreement" options={{ headerShown: true, title: 'Elternvereinbarung' }} />
        <Stack.Screen name="agreement-edit" options={modal('Vereinbarung bearbeiten')} />
        <Stack.Screen name="professionals" options={{ headerShown: true, title: 'Fachkräfte' }} />
        <Stack.Screen name="help" options={{ headerShown: true, title: 'Hilfe & Beratung' }} />
        <Stack.Screen name="settings" options={modal('Einstellungen')} />
        <Stack.Screen name="plus" options={modal('Zwei Zuhause Plus')} />
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
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Server fehlt noch</Text>
      <Text style={styles.text}>
        Trage die Supabase-Adresse und den anon-Key in die Datei .env ein (siehe SETUP.md).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
