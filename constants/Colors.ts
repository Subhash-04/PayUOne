const tintColorLight = '#4A90E2';
const tintColorDark = '#60A5FA';

export const addAlpha = (color: string, opacity: number): string => {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${color}${alpha}`;
};

export default {
  light: {
    text: '#2D3748',
    secondaryText: '#718096',
    background: '#F7FAFC',
    card: '#FFFFFF',
    primary: '#4A90E2',
    secondary: '#5A67D8',
    accent: '#9F7AEA',
    border: '#E2E8F0',
    notification: '#F56565',
    success: '#48BB78',
    warning: '#ECC94B',
    error: '#F56565',
    shadow: 'rgba(0, 0, 0, 0.1)',
    tabIconDefault: '#A0AEC0',
    tabIconSelected: tintColorLight,
    gradientStart: '#4A90E2',
    gradientEnd: '#5A67D8',
  },
  dark: {
    text: '#F7FAFC',
    secondaryText: '#A0AEC0',
    background: '#0A1929',
    card: '#0F2744',
    primary: '#60A5FA',
    secondary: '#7F9CF5',
    accent: '#B794F4',
    border: '#1A365D',
    notification: '#FC8181',
    success: '#68D391',
    warning: '#F6E05E',
    error: '#FC8181',
    shadow: 'rgba(0, 0, 0, 0.3)',
    tabIconDefault: '#718096',
    tabIconSelected: tintColorDark,
    gradientStart: '#60A5FA',
    gradientEnd: '#3B82F6',
    glow: '#60A5FA40',
  },
};