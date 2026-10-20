import { ColorValue, DynamicColorIOS, Platform } from 'react-native';

/**
 * Hell/Dunkel: auf iOS stellt sich die Farbe selbst um, sobald das iPhone in den Dunkelmodus wechselt
 * (auch in StyleSheet.create). Andere Plattformen bleiben vorerst hell.
 */
function adaptive(light: string, dark: string): ColorValue {
  return Platform.OS === 'ios' ? DynamicColorIOS({ light, dark }) : light;
}

// Miami-Vice-Palette: Flamingo-Pink trifft Ocean-Drive-Blau.
// pink und blue bleiben feste Texte – sie stecken auch in Verläufen, die echte Farbwerte brauchen.
export const colors = {
  pink: '#FF5FA2',
  pinkSoft: adaptive('#FFB3D4', '#7A3A5C'),
  pinkPale: adaptive('#FFE4F1', '#3A2234'),
  blue: '#38C8F2',
  blueSoft: adaptive('#9EE3F8', '#1F5A6E'),
  bluePale: adaptive('#E0F7FD', '#16323E'),
  background: adaptive('#FFF5FA', '#15101C'),
  card: adaptive('#FFFFFF', '#231A2E'),
  text: adaptive('#2E1F47', '#F5ECF8'),
  textMuted: adaptive('#8A7A9E', '#B3A3C6'),
  border: adaptive('#F3D9E8', '#3A2A4C'),
  muted: adaptive('#F6F1F8', '#2A2035'),
  danger: '#E5484D',
  white: '#FFFFFF',
} as const;

// Der typische Sonnenuntergang über South Beach.
export const gradient = [colors.pink, '#C58BF2', colors.blue] as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const shadow = {
  shadowColor: '#C2185B',
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
