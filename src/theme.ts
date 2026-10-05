// Miami-Vice-Palette: Flamingo-Pink trifft Ocean-Drive-Blau.
export const colors = {
  pink: '#FF5FA2',
  pinkSoft: '#FFB3D4',
  pinkPale: '#FFE4F1',
  blue: '#38C8F2',
  blueSoft: '#9EE3F8',
  bluePale: '#E0F7FD',
  background: '#FFF5FA',
  card: '#FFFFFF',
  text: '#2E1F47',
  textMuted: '#8A7A9E',
  border: '#F3D9E8',
  danger: '#E5484D',
  white: '#FFFFFF',
} as const;

// Der typische Sonnenuntergang über South Beach.
export const gradient = [colors.pink, '#C58BF2', colors.blue] as const;
export const gradientSoft = [colors.pinkPale, colors.bluePale] as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const shadow = {
  shadowColor: '#C2185B',
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
