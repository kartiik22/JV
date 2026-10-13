export const colors = {
  background: '#05080D',
  backgroundElevated: '#0A1018',
  panel: 'rgba(10, 22, 34, 0.88)',
  panelBorder: 'rgba(0, 229, 255, 0.22)',
  panelBorderActive: 'rgba(0, 229, 255, 0.55)',
  cyan: '#00E5FF',
  teal: '#14B8A6',
  electric: '#38BDF8',
  text: '#E8F4F8',
  textMuted: '#7A93A5',
  textDim: '#4A6274',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
  overlay: 'rgba(0, 0, 0, 0.45)',
  reticle: 'rgba(0, 229, 255, 0.65)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
};

export const typography = {
  wordmark: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 3,
    fontVariant: ['small-caps' as const],
  },
  label: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
  },
  title: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
  },
};

/** Default capture interval in milliseconds (local Ollama — faster HUD refresh) */
export const DEFAULT_CAPTURE_INTERVAL_MS = 10000;

/**
 * Max image width before upload.
 * Kept low so vision providers use fewer image tokens (detail:low ≈ 512px).
 */
export const CAPTURE_MAX_WIDTH = 512;

/** JPEG compression quality 0–1 (lower = smaller upload / cheaper) */
export const CAPTURE_QUALITY = 0.28;
