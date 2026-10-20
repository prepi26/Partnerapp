import { ColorValue, DynamicColorIOS, Platform } from 'react-native';

/**
 * Hell/Dunkel: auf iOS stellt sich die Farbe selbst um, sobald das iPhone in den Dunkelmodus wechselt
 * (auch in StyleSheet.create). Andere Plattformen bleiben vorerst hell.
 */
function adaptive(light: string, dark: string): ColorValue {
  return Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;
}

// Ruhig und neutral: Salbeigrün und Abendblau. Keine Farbe „gehört“ einem Elternteil mehr als dem anderen.
// primary und accent bleiben feste Texte – sie stecken auch in Verläufen, die echte Farbwerte brauchen.
export const colors = {
  primary: '#2F8F83',
  primarySoft: adaptive('#9FD3CB', '#1F5A53'),
  primaryPale: adaptive('#E3F3F0', '#16302D'),
  accent: '#4F7CC9',
  accentSoft: adaptive('#B4C9EE', '#2A4170'),
  accentPale: adaptive('#E6EEFA', '#18233A'),
  // Farben der beiden Elternteile im Kalender.
  parentA: '#2F8F83',
  parentAPale: adaptive('#D5EEEA', '#1A3A36'),
  parentB: '#D9893A',
  parentBPale: adaptive('#F8E6D3', '#3D2A18'),
  background: adaptive('#F6F8F7', '#101615'),
  card: adaptive('#FFFFFF', '#1A2221'),
  text: adaptive('#1F2D2B', '#E9F1EF'),
  textMuted: adaptive('#6B7C79', '#9DB0AC'),
  border: adaptive('#DDE7E4', '#2C3A38'),
  muted: adaptive('#EEF3F2', '#222C2B'),
  danger: '#D64545',
  warning: '#C98A1B',
  white: '#FFFFFF',
} as const;

export const gradient = [colors.primary, '#3E86A8', colors.accent] as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const shadow = {
  shadowColor: '#1F4D47',
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
