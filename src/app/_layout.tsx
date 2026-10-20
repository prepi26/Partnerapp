import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DialogHost, PrimaryButton } from '@/components/ui';
import { isConfigured } from '@/config';
import { AuthProvider, useAuth } from '@/data/auth';
import { PlusProvider } from '@/data/plus';
import { Reminders } from '@/components/Reminders';
import { WidgetSync } from '@/components/WidgetSync';
import { registerForPush, urlFromResponse } from '@/lib/push';
import { refreshReminders } from '@/lib/reminders';
import { StoreProvider, useStore } from '@/data/store';
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
  if (!session) return <RootStack signedIn={false} hasCouple={false} />;
  return (
    // key: beim Kontowechsel wird aller Zustand verworfen.
    <StoreProvider key={session.user.id} userId={session.user.id}>
      <SignedIn />
    </StoreProvider>
  );
}

function SignedIn() {
  const { loading, loadFailed, couple, retry } = useStore();
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
      <RootStack signedIn hasCouple={couple !== null} />
      {couple && Platform.OS !== 'web' ? <PushSetup /> : null}
      {couple && Platform.OS !== 'web' ? <Reminders /> : null}
      {couple && Platform.OS === 'ios' ? <WidgetSync /> : null}
    </PlusProvider>
  );
}

/** Meldet das Handy für Mitteilungen an und öffnet beim Antippen einer Mitteilung den passenden Bildschirm. */
function PushSetup() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    // Erst nach erteilter Erlaubnis lassen sich die Erinnerungen planen.
    registerForPush().then(refreshReminders);
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

function RootStack({ signedIn, hasCouple }: { signedIn: boolean; hasCouple: boolean }) {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        headerTintColor: colors.pink,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      {/* Einladungslink – in jedem Zustand erreichbar, leitet selbst weiter. */}
      <Stack.Screen name="j" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasCouple}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && hasCouple}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="memory/new" options={modal('Neue Erinnerung')} />
        <Stack.Screen name="memory/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="wish-new" options={modal('Neuer Wunsch')} />
        <Stack.Screen name="date-new" options={modal('Neues Datum')} />
        <Stack.Screen name="question" options={{ headerShown: true, title: 'Frage des Tages' }} />
        <Stack.Screen name="settings" options={modal('Einstellungen')} />
        <Stack.Screen name="plus" options={modal('Wir zwei Plus')} />
        <Stack.Screen name="pack/[id]" options={{ headerShown: true, title: '' }} />
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
        Trage die Supabase-Adresse und den anon-Key in die Datei .env ein (siehe SUPABASE_SETUP.md).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  text: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
