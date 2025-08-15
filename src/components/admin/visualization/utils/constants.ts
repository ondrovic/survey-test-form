// Color palette for charts
export const CHART_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#f97316', '#0ea5e9', '#84cc16', '#a855f7'
];

// Named color mappings
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

// Neutral gray for free-text fields
export const NEUTRAL_GRAY = '#9ca3af';

// Semantic color mappings
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