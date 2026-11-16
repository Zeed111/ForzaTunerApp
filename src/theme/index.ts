export const THEME = {
  // Surfaces (Warm Asphalt Carbon & Matte Graphite)
  bgCanvas: '#0B0C0E',
  bgCard: '#131519',
  bgElevated: '#1A1D23',
  bgSubtle: '#22262E',
  border: '#262A33',
  borderStrong: '#363B47',

  // Typography
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Cohesive Motorsport Accents
  accentBrand: '#F97316', // Horizon Racing Orange
  accentBrandDim: 'rgba(249, 115, 22, 0.14)',
  accentAmber: '#F59E0B', // MoTeC Shift-Light Amber
  accentAmberDim: 'rgba(245, 158, 11, 0.14)',
  accentSteel: '#38BDF8', // Anodized Telemetry Steel Blue
  accentSteelDim: 'rgba(56, 189, 248, 0.14)',
  accentSuccess: '#10B981', // Pit-Wall Emerald Confirmation
  accentSuccessDim: 'rgba(16, 185, 129, 0.14)',
  accentDanger: '#EF4444', // Brake Caliper Red
  accentDangerDim: 'rgba(239, 68, 68, 0.14)',
} as const;

export const GEAR_CHART_COLORS = [
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#10B981',
  '#06B6D4',
  '#38BDF8',
  '#60A5FA',
  '#818CF8',
  '#A78BFA',
  '#F43F5E',
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
