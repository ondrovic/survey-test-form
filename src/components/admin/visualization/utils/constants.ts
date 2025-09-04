// Color palette for charts - Light mode
export const CHART_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#f97316', '#0ea5e9', '#84cc16', '#a855f7'
];

// Color palette for charts - Dark mode (softer, more muted colors)
export const CHART_PALETTE_DARK = [
  '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
  '#2dd4bf', '#fb923c', '#38bdf8', '#a3e635', '#c084fc'
];

// Named color mappings - Light mode
export const NAMED_COLOR_MAP: Record<string, string> = {
  'green-light': '#10b981',
  'blue-light': '#3b82f6',
  'yellow-light': '#f59e0b',
  'red-light': '#ef4444',
  'purple-light': '#8b5cf6',
  'orange-light': '#f97316',
  'pink-light': '#ec4899',
  'cyan-light': '#06b6d4',
  'lime-light': '#84cc16',
  'indigo-light': '#6366f1'
};

// Named color mappings - Dark mode  
export const NAMED_COLOR_MAP_DARK: Record<string, string> = {
  'green-light': '#34d399',
  'blue-light': '#60a5fa',
  'yellow-light': '#fbbf24',
  'red-light': '#f87171',
  'purple-light': '#a78bfa',
  'orange-light': '#fb923c',
  'pink-light': '#f472b6',
  'cyan-light': '#22d3ee',
  'lime-light': '#a3e635',
  'indigo-light': '#818cf8'
};

// Neutral gray for free-text fields
export const NEUTRAL_GRAY = '#9ca3af';
export const NEUTRAL_GRAY_DARK = '#d1d5db';

// Semantic color mappings - Light mode
export const SEMANTIC_COLORS: Record<string, string> = {
  'critical': '#ef4444',
  'high': '#ef4444', 
  'very high': '#ef4444',
  'medium': '#f59e0b', 
  'moderate': '#f59e0b',
  'low': '#16a34a', 
  'very low': '#16a34a',
  'yes': '#16a34a', 
  'true': '#16a34a',
  'no': '#ef4444', 
  'false': '#ef4444',
  'not important': '#6b7280', 
  'not-important': '#6b7280', 
  'none': '#6b7280', 
  'n/a': '#6b7280',
  'both': '#0ea5e9', 
  'mixed': '#0ea5e9'
};

// Semantic color mappings - Dark mode
export const SEMANTIC_COLORS_DARK: Record<string, string> = {
  'critical': '#f87171',
  'high': '#f87171', 
  'very high': '#f87171',
  'medium': '#fbbf24', 
  'moderate': '#fbbf24',
  'low': '#22c55e', 
  'very low': '#22c55e',
  'yes': '#22c55e', 
  'true': '#22c55e',
  'no': '#f87171', 
  'false': '#f87171',
  'not important': '#9ca3af', 
  'not-important': '#9ca3af', 
  'none': '#9ca3af', 
  'n/a': '#9ca3af',
  'both': '#38bdf8', 
  'mixed': '#38bdf8'
};

// Labels that should use semantic colors
export const SEMANTIC_LABELS = [
  'critical', 'high', 'very high', 'medium', 'moderate', 'low', 'very low',
  'yes', 'no', 'true', 'false', 'not important', 'not-important', 'none', 'n/a',
  'both', 'mixed'
];

// Field types that hint at free text content
export const FREE_TEXT_FIELD_TYPES = [
  'text', 'textarea', 'email', 'name', 'phone', 'url'
];

// Patterns that suggest free text content in labels or IDs
export const FREE_TEXT_PATTERNS = [
  /(name|email|e-mail|phone|title|company|organization|org|dept|department|address|city|state|country)/i
];