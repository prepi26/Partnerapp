import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DialogHost, PrimaryButton } from '@/components/ui';
import { isConfigured } from '@/config';
import { AuthProvider, useAuth } from '@/data/auth';
import { PlusProvider } from '@/data/plus';
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
  if (!session) return <RootStack signedIn={false} hasFamily={false} />;
  return (
    // key: beim Kontowechsel wird aller Zustand verworfen.
    <StoreProvider key={session.user.id} userId={session.user.id}>
      <SignedIn />
    </StoreProvider>
  );
}

function SignedIn() {
  const { loading, loadFailed, family, retry } = useStore();
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
      <RootStack signedIn hasFamily={family !== null} />
    </PlusProvider>
  );
}

function RootStack({ signedIn, hasFamily }: { signedIn: boolean; hasFamily: boolean }) {
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
      <Stack.Protected guard={signedIn && !hasFamily}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && hasFamily}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="change-new" options={modal('Tag tauschen')} />
        <Stack.Screen name="expense-new" options={modal('Neue Ausgabe')} />
        <Stack.Screen name="expense/[id]" options={{ headerShown: true, title: 'Ausgabe' }} />
        <Stack.Screen name="journal-new" options={modal('Neuer Eintrag')} />
        <Stack.Screen name="schedule" options={modal('Umgangsplan')} />
        <Stack.Screen name="report" options={{ headerShown: true, title: 'Bericht als PDF' }} />
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
