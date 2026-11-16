export const THEME = {
  // Surfaces (Android 17 Material 3 Expressive Dark Tonal Surfaces)
  bgCanvas: '#0E1015', // M3 surfaceDim
  bgCard: '#171A21', // M3 surfaceContainerLow
  bgElevated: '#20242E', // M3 surfaceContainerHigh
  bgSubtle: '#2B303E', // M3 surfaceContainerHighest
  border: 'rgba(255, 255, 255, 0.08)', // M3 outlineVariant
  borderStrong: 'rgba(255, 255, 255, 0.16)', // M3 outline

  // Typography
  textPrimary: '#F2F4FA', // M3 onSurface
  textSecondary: '#C2C7D6', // M3 onSurfaceVariant
  textMuted: '#8B92A5', // M3 outline

  // Material 3 Expressive Motorsport Tonal Accents
  accentBrand: '#FF6D2E', // M3 Primary Expressive Coral-Orange
  accentBrandDim: 'rgba(255, 109, 46, 0.18)',
  accentAmber: '#FFB74D', // M3 Secondary Amber
  accentAmberDim: 'rgba(255, 183, 77, 0.16)',
  accentSteel: '#7AD0FF', // M3 Tertiary Telemetry Cyan
  accentSteelDim: 'rgba(122, 208, 255, 0.16)',
  accentSuccess: '#4ADE80', // M3 Emerald Confirmation
  accentSuccessDim: 'rgba(74, 222, 128, 0.16)',
  accentDanger: '#FF6B6B', // M3 Error / Alert Red
  accentDangerDim: 'rgba(255, 107, 107, 0.16)',
} as const;

export const GEAR_CHART_COLORS = [
  '#FF6D2E',
  '#FFB74D',
  '#FCD34D',
  '#4ADE80',
  '#38BDF8',
  '#7AD0FF',
  '#818CF8',
  '#A78BFA',
  '#F472B6',
  '#FF6B6B',
];

export function getPiColor(piClass?: string): string {
  switch (piClass?.toUpperCase()) {
    case 'X':
      return '#10B981'; // Class X Emerald
    case 'R':
      return '#06B6D4'; // Class R Track Cyan
    case 'S2':
      return '#4F46E5'; // Class S2 Indigo
    case 'S1':
      return '#9333EA'; // Class S1 Violet
    case 'A':
      return '#DC2626'; // Class A Crimson
    case 'B':
      return '#F97316'; // Class B Racing Orange
    case 'C':
      return '#CA8A04'; // Class C Gold
    case 'D':
      return '#0284C7'; // Class D Blue
    default:
      return THEME.accentBrand;
  }
}
