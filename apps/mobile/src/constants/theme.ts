/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * [Opus 4.8] Benchhoard palette — park greens and warm-wood paper. The app
 * should feel like a quiet field guide to the city, not a corporate tool. The
 * `BH` export name is kept so the whole app's `import { BH }` sites stay put.
 */
export const BH = {
  primary: '#2F7D4F',        // park green — primary actions
  primaryPressed: '#256340',
  navy: '#1E3A2F',           // deep forest — headers
  paper: '#FFFFFF',          // cards
  feedGray: '#F4F1EA',       // warm paper — app background
  divider: '#E4DFD3',
  ink: '#1F2A23',            // primary text
  inkSecondary: '#5E6B5A',
  /** Hostility Index marker scale — welcoming → hostile. */
  hostility: {
    welcoming: '#2F7D4F',    // green — true bench, picnic table
    moderate: '#C9842B',     // amber — divided / individual seats
    hostile: '#B3402A',      // rust — ledge, leaning rail
  },
  accent: '#B8860B',         // discovery / badge gold
  danger: '#B3402A',
} as const;

export const Colors = {
  light: {
    text: BH.ink,
    background: BH.feedGray,
    backgroundElement: BH.paper,
    backgroundSelected: '#E7F0E8',
    textSecondary: BH.inkSecondary,
  },
  // v1 ships light-only (the field-guide look IS light mode); dark tracks it
  dark: {
    text: BH.ink,
    background: BH.feedGray,
    backgroundElement: BH.paper,
    backgroundSelected: '#E7F0E8',
    textSecondary: BH.inkSecondary,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Map a seat type's Hostility rank (0–4) to its marker color. */
export function hostilityColor(rank: number): string {
  if (rank <= 0) return BH.hostility.welcoming;
  if (rank <= 2) return BH.hostility.moderate;
  return BH.hostility.hostile;
}
