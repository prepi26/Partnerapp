import Ionicons from '@expo/vector-icons/Ionicons';
import Tabs from 'expo-router/js-tabs';
import { ColorValue } from 'react-native';

import { IconName } from '@/components/ui';
import { useFamily } from '@/data/store';
import { colors } from '@/theme';

function icon(name: IconName, focusedName: IconName) {
  return function TabIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
    return <Ionicons name={focused ? focusedName : name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  const { messages, me, userId, decisions, handovers, agreements, professional_access } = useFamily();
  const unread = messages.filter((m) => m.sender_key !== me && !m.read_at).length;
  const latest = agreements[0];
  const pending =
    decisions.filter((d) => d.status === 'proposed' && d.created_by !== userId).length +
    handovers.filter((h) => !h.reply && h.created_by !== userId).length +
    (latest && !(me === 'a' ? latest.accepted_a_at : latest.accepted_b_at) ? 1 : 0) +
    professional_access.filter((p) => !p.other_approved_at && !p.revoked_at && p.invited_key !== me).length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        // Fester Farbwert: die Tab-Leiste rechnet mit Farbtexten, nicht mit hell/dunkel-Farben.
        tabBarInactiveTintColor: '#8A9A97',
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Heute', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="calendar" options={{ title: 'Kalender', tabBarIcon: icon('calendar-outline', 'calendar') }} />
      <Tabs.Screen name="expenses" options={{ title: 'Kosten', tabBarIcon: icon('wallet-outline', 'wallet') }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Nachrichten',
          tabBarIcon: icon('chatbubbles-outline', 'chatbubbles'),
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Mehr',
          tabBarIcon: icon('grid-outline', 'grid'),
          tabBarBadge: pending > 0 ? pending : undefined,
        }}
      />
    </Tabs>
  );
}
