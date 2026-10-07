import Ionicons from '@expo/vector-icons/Ionicons';
import Tabs from 'expo-router/js-tabs';
import { ColorValue, View } from 'react-native';

import { ThoughtReceiver } from '@/components/Thoughts';
import { IconName } from '@/components/ui';
import { colors } from '@/theme';

function icon(name: IconName, focusedName: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? focusedName : name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.pink,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          tabBarLabelStyle: { fontWeight: '600' },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Wir', tabBarIcon: icon('heart-outline', 'heart') }} />
        <Tabs.Screen name="memories" options={{ title: 'Momente', tabBarIcon: icon('images-outline', 'images') }} />
        <Tabs.Screen name="notes" options={{ title: 'Zettel', tabBarIcon: icon('mail-outline', 'mail') }} />
        <Tabs.Screen name="wishes" options={{ title: 'Wünsche', tabBarIcon: icon('sparkles-outline', 'sparkles') }} />
        <Tabs.Screen name="dates" options={{ title: 'Daten', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      </Tabs>
      <ThoughtReceiver />
    </View>
  );
}
