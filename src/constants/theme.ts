/**
 * Warm "love letter" palette: cream paper, ink, and a coral→amber glow.
 * Distinct from the neutral light/dark UI in earlier versions — moments
 * deserve a surface that feels personal, not a generic chat app.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // cream paper ground
    background: '#FBF6EE',
    // aged-paper card surface
    backgroundElement: '#F2EADC',
    // warmer selected / active wash
    backgroundSelected: '#E8DBC4',
    // ink (warm near-black, never pure)
    text: '#2A1F1A',
    textSecondary: '#7A6A5E',
    // brand mark + accents
    brand: '#FF7A6E',
    brandSoft: '#FFE6D9',
    // moment note card (warm yellow)
    note: '#FFF2C9',
    noteInk: '#5A4318',
    // hairline divider
    divider: '#E8DDCB',
    // heart-of-the-app glow
    glow: '#FFB454',
  },
  dark: {
    // deep cocoa paper
    background: '#1A1411',
    // warmer card surface, not gray
    backgroundElement: '#2A201B',
    backgroundSelected: '#3A2D26',
    text: '#F5E9DA',
    textSecondary: '#A89685',
    brand: '#FF9587',
    brandSoft: '#3A201C',
    note: '#3A2A12',
    noteInk: '#FFD37A',
    divider: '#32262030',
    glow: '#FFC56F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Brand = {
  gradientStart: '#FF7A6E',
  gradientEnd: '#FFB454',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
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
  six: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
