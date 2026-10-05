import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '@/data/store';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <RootStack />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { ready, state } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const hasCouple = state.couple !== null;

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
      <Stack.Protected guard={!hasCouple}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={hasCouple}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="memory/new" options={modal('Neue Erinnerung')} />
        <Stack.Screen name="memory/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="wish-new" options={modal('Neuer Wunsch')} />
        <Stack.Screen name="date-new" options={modal('Neues Datum')} />
        <Stack.Screen name="settings" options={modal('Einstellungen')} />
      </Stack.Protected>
    </Stack>
  );
}

function modal(title: string) {
  return { presentation: 'modal' as const, headerShown: true, title };
}
