export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  primary: string;
  primaryStrong: string;
  secondary: string;
  accent: string;

  background: string;
  surface: string;
  surfaceAlt: string;

  text: string;
  textSecondary: string;
  border: string;

  success: string;
  warning: string;
  error: string;

  info: string;
  overlay: string;

  card: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;

  buttonText: string;
  buttonSecondaryText: string;
  onPrimary: string;
  onSecondary: string;
};

export const light: ThemeColors = {
  // Hijau — tropical green, sustainability
  primary: '#16A34A',
  primaryStrong: '#15803D',
  // Merah Bata — terracotta red, Indonesian flag reference
  secondary: '#C2410C',
  // Emas — Batik gold, prosperity
  accent: '#D97706',

  // Krem hangat — warm cream, Batik paper feel
  background: '#FAF7F0',
  surface: '#FFFFFF',
  // Slightly warm off-white
  surfaceAlt: '#F5F0E8',

  // Warm dark brown instead of cold black
  text: '#1C1400',
  textSecondary: '#6B5D4F',
  border: '#E8DDD0',

  success: '#16A34A',
  warning: '#D97706',
  // Merah — clear red for errors
  error: '#DC2626',

  // Blue only for informational content
  info: '#0369A1',
  overlay: 'rgba(28, 20, 0, 0.45)',

  card: '#FFFFFF',
  inputBackground: '#FAF7F0',
  inputBorder: '#E8DDD0',
  placeholder: '#A8947E',

  buttonText: '#FFFFFF',
  buttonSecondaryText: '#C2410C',
  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
};

export const dark: ThemeColors = {
  // Brighter green for dark bg contrast
  primary: '#22C55E',
  primaryStrong: '#16A34A',
  // Warmer orange-red in dark mode
  secondary: '#FB923C',
  // Bright Batik gold
  accent: '#FBBF24',

  // Very dark warm brown — like roasted wood
  background: '#1A1209',
  surface: '#27190E',
  surfaceAlt: '#362311',

  // Warm white
  text: '#FDF8F0',
  textSecondary: '#C4B5A4',
  border: '#4A3728',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#F87171',

  info: '#38BDF8',
  overlay: 'rgba(26, 18, 9, 0.65)',

  card: '#27190E',
  inputBackground: '#362311',
  inputBorder: '#4A3728',
  placeholder: '#8C7B6B',

  buttonText: '#1A1209',
  buttonSecondaryText: '#FDBA74',
  onPrimary: '#1A1209',
  onSecondary: '#1A1209',
};

const colors = { light, dark };

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? dark : light;
};

export default colors;
