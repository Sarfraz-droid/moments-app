/** A restrained, media-first system with one warm interaction color. */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFFFF',
    backgroundElement: '#F5F5F3',
    backgroundSelected: '#ECECEA',
    text: '#171717',
    textSecondary: '#6F6F6B',
    brand: '#C23F35',
    brandSoft: '#FFF0ED',
    note: '#F7F7F5',
    noteInk: '#222220',
    divider: '#E5E5E2',
    glow: '#FF8A7E',
    danger: '#C33B31',
  },
  dark: {
    background: '#0C0C0C',
    backgroundElement: '#1C1C1B',
    backgroundSelected: '#292927',
    text: '#F7F7F5',
    textSecondary: '#A4A4A0',
    brand: '#FF7265',
    brandSoft: '#351B18',
    note: '#1A1A19',
    noteInk: '#F4F4F1',
    divider: '#30302E',
    glow: '#FF8A7E',
    danger: '#FF8178',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Brand = {
  gradientStart: '#C23F35',
  gradientEnd: '#C23F35',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    serif: 'Poppins_700Bold',
    rounded: 'Poppins_500Medium',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    serif: 'Poppins_700Bold',
    rounded: 'Poppins_500Medium',
    mono: 'monospace',
  },
  web: {
    sans: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    serif: 'Poppins_700Bold',
    rounded: 'Poppins_500Medium',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
