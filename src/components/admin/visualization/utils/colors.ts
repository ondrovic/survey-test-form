import { 
  CHART_PALETTE, 
  CHART_PALETTE_DARK,
  NAMED_COLOR_MAP, 
  NAMED_COLOR_MAP_DARK,
  NEUTRAL_GRAY, 
  NEUTRAL_GRAY_DARK,
  SEMANTIC_COLORS, 
  SEMANTIC_COLORS_DARK,
  SEMANTIC_LABELS 
} from './constants';

/**
 * Normalizes a color candidate by checking named color mappings
 */
export const normalizeColorCandidate = (candidate?: string, isDarkMode: boolean = false): string | undefined => {
  if (!candidate) return undefined;
  const c = candidate.trim();
  const colorMap = isDarkMode ? NAMED_COLOR_MAP_DARK : NAMED_COLOR_MAP;
  return colorMap[c] || c;
};

/**
 * Normalizes and validates a color, filtering out transparent/invisible colors
 */
export const normalizeEffectiveColor = (candidate?: string, isDarkMode: boolean = false): string | undefined => {
  const c = normalizeColorCandidate(candidate, isDarkMode);
  if (!c) return undefined;
  const v = c.trim();
  const lower = v.toLowerCase();
  
  // Common transparent tokens
  if (lower === 'transparent' || lower === 'none' || lower === 'inherit') return undefined;
  
  // 4-digit hex with alpha (#RGBA) and alpha=0
  if (/^#([0-9a-f]{4})$/i.test(lower)) {
    const m = lower.match(/^#([0-9a-f]{4})$/i)!;
    const alphaNibble = m[1].slice(3);
    if (alphaNibble === '0') return undefined;
  }
  
  // 8-digit hex with alpha (#RRGGBBAA) and alpha=00
  if (/^#([0-9a-f]{8})$/i.test(lower)) {
    const m = lower.match(/^#([0-9a-f]{8})$/i)!;
    const alphaByte = m[1].slice(6);
    if (alphaByte === '00') return undefined;
  }
  
  // rgba()/hsla() with alpha 0
  if (/^rgba\(/i.test(lower) || /^hsla\(/i.test(lower)) {
    const alphaPart = lower.replace(/^.*\((.*)\)$/, '$1').split(',').pop()?.trim() || '';
    const alpha = parseFloat(alphaPart);
    if (!Number.isNaN(alpha) && alpha <= 0) return undefined;
  }
  
  // Edge case: #0000 shorthand
  if (lower === '#0000') return undefined;
  
  return v;
};

/**
 * Checks if a label should use semantic colors
 */
export const isSemanticLabel = (lower: string): boolean => 
  SEMANTIC_LABELS.includes(lower);

/**
 * Gets the semantic color for a label
 */
export const semanticColorFor = (lower: string, isDarkMode: boolean = false): string | undefined => {
  const colors = isDarkMode ? SEMANTIC_COLORS_DARK : SEMANTIC_COLORS;
  return colors[lower];
};

/**
 * Generates a consistent palette color based on label and salt
 */
export const paletteColorFor = (label: string, salt: number, isDarkMode: boolean = false): string => {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  const palette = isDarkMode ? CHART_PALETTE_DARK : CHART_PALETTE;
  const idx = Math.abs(hash + salt) % palette.length;
  return palette[idx];
};

/**
 * Generates a hash salt from text
 */
export const hashSaltFrom = (text: string): number => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

/**
 * Checks if a color value is transparent or invisible
 */
export const isTransparentToken = (value?: string): boolean => {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (v === '' || v === 'transparent' || v === 'none' || v === 'inherit' || v === '#0000') return true;
  
  if (/^#([0-9a-f]{4})$/i.test(v)) {
    const alphaNibble = v.slice(-1);
    if (alphaNibble === '0') return true;
  }
  
  if (/^#([0-9a-f]{8})$/i.test(v)) {
    const alphaByte = v.slice(-2);
    if (alphaByte === '00') return true;
  }
  
  if (/^rgba\(/i.test(v) || /^hsla\(/i.test(v)) {
    const alphaPart = v.replace(/^.*\((.*)\)$/, '$1').split(',').pop()?.trim() || '';
    const alpha = parseFloat(alphaPart);
    if (!Number.isNaN(alpha) && alpha <= 0) return true;
  }
  
  return false;
};

/**
 * Computes the final color for a chart label
 */
export const computeColorForLabel = (args: {
  label: string;
  lower: string;
  strict: string;
  colors?: Record<string, string | undefined>;
  neutralMode?: boolean;
  colorSalt?: number;
  isDarkMode?: boolean;
}): string => {
  const { label, lower, strict, colors, neutralMode, colorSalt, isDarkMode = false } = args;
  const candidateRaw = (colors?.[label] ?? colors?.[lower] ?? colors?.[strict]);
  const candidate = normalizeEffectiveColor(candidateRaw, isDarkMode);
  
  let chosen = candidate
    || (isSemanticLabel(lower) ? semanticColorFor(lower, isDarkMode) : undefined)
    || (neutralMode ? (isDarkMode ? NEUTRAL_GRAY_DARK : NEUTRAL_GRAY) : undefined)
    || paletteColorFor(label, colorSalt || 0, isDarkMode);
    
  if (isTransparentToken(chosen)) {
    // Final guardrail to ensure visible colors
    chosen = neutralMode 
      ? (isDarkMode ? NEUTRAL_GRAY_DARK : NEUTRAL_GRAY) 
      : paletteColorFor(label, colorSalt || 0, isDarkMode);
  }
  
  return chosen as string;
};