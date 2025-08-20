/**
 * Design Tokens
 * Centralized constants for consistent styling across components
 */

export const colors = {
  // Primary colors
  primary: {
    50: 'amber-50',
    100: 'amber-100',
    200: 'amber-200',
    300: 'amber-300',
    400: 'amber-400',
    500: 'amber-500',
    600: 'amber-600',
    700: 'amber-700',
    800: 'amber-800',
    900: 'amber-900',
  },
  
  // Semantic colors
  success: {
    50: 'green-50',
    200: 'green-200',
    400: 'green-400',
    600: 'green-600',
    800: 'green-800',
  },
  
  error: {
    50: 'red-50',
    200: 'red-200',
    300: 'red-300',
    400: 'red-400',
    500: 'red-500',
    600: 'red-600',
    800: 'red-800',
    900: 'red-900',
  },
  
  warning: {
    50: 'yellow-50',
    200: 'yellow-200',
    300: 'yellow-300',
    400: 'yellow-400',
    500: 'yellow-500',
    600: 'yellow-600',
    700: 'yellow-700',
    800: 'yellow-800',
  },
  
  info: {
    50: 'blue-50',
    200: 'blue-200',
    400: 'blue-400',
    500: 'blue-500',
    600: 'blue-600',
    700: 'blue-700',
    800: 'blue-800',
  },
  
  // Neutral colors
  gray: {
    50: 'gray-50',
    100: 'gray-100',
    200: 'gray-200',
    300: 'gray-300',
    400: 'gray-400',
    500: 'gray-500',
    600: 'gray-600',
    700: 'gray-700',
    800: 'gray-800',
    900: 'gray-900',
  },
} as const;

export const spacing = {
  xs: 'px-1 py-0.5',
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-6 py-3',
  xl: 'px-8 py-4',
} as const;

export const borderRadius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  none: 'shadow-none',
} as const;

export const transitions = {
  fast: 'transition-all duration-150',
  default: 'transition-all duration-200',
  slow: 'transition-all duration-300',
} as const;

export const focusRing = {
  primary: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
  error: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500',
  success: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
  info: 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
} as const;

export const typography = {
  // Font sizes
  text: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
  },
  
  // Font weights
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  
  // Line heights
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const;

// Component-specific design tokens
export const button = {
  base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  variants: {
    primary: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 shadow-sm',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-amber-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  },
  
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    form: 'px-3 py-2 text-sm h-10',
    fixed: 'px-4 py-2 text-sm h-10 w-20 text-center',
  },
} as const;

export const input = {
  base: 'block w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  states: {
    default: 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500',
    error: 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500',
  },
} as const;

export const alert = {
  base: 'border rounded-lg p-4 relative',
  
  variants: {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  
  icons: {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  },
} as const;

export const modal = {
  base: 'fixed inset-0 z-50',
  backdrop: `bg-black bg-opacity-50 ${transitions.default}`,
  container: 'flex items-center justify-center min-h-full p-4',
  content: `bg-white rounded-lg shadow-xl overflow-hidden flex flex-col ${transitions.default}`,
  
  sizes: {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-2xl',
    lg: 'w-full max-w-4xl',
    xl: 'w-full max-w-6xl',
    full: 'w-full max-w-[95vw] max-h-[95vh]',
  },
  
  variants: {
    default: '',
    confirmation: 'max-w-md',
    form: 'max-w-2xl',
    fullscreen: 'w-full h-full max-w-none max-h-none m-0 rounded-none',
  },
  
  header: 'flex items-center justify-between p-6 border-b border-gray-200',
  title: 'text-xl font-semibold text-gray-900 truncate',
  closeButton: 'flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
  body: 'flex-1 overflow-y-auto',
  footer: 'flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50',
} as const;

export const loadingSpinner = {
  base: 'inline-block rounded-full animate-spin',
  container: 'flex flex-col items-center justify-center',
  
  sizes: {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  },
  
  variants: {
    spinner: 'border-2 border-transparent border-t-current',
    ring: 'border-2 border-current border-t-transparent',
    dots: 'relative',
    pulse: 'bg-current rounded-full',
  },
  
  colors: {
    primary: 'text-amber-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  },
  
  text: 'text-gray-600 mt-2',
  overlay: 'fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50',
  fullscreen: 'min-h-screen bg-gray-50 flex items-center justify-center',
} as const;

export const pagination = {
  container: 'flex items-center justify-center gap-1',
  
  // Mobile-first responsive container
  responsive: {
    mobile: 'flex items-center justify-between gap-2 px-4 py-3',
    desktop: 'flex items-center justify-center gap-1',
  },
  
  // Button base styles
  button: {
    base: 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
    sizes: {
      sm: 'px-2 py-1 text-sm min-w-[32px] h-8',
      md: 'px-3 py-2 text-sm min-w-[40px] h-10',
      lg: 'px-4 py-2 text-base min-w-[44px] h-11',
    },
  },
  
  // Navigation buttons (prev/next)
  nav: {
    enabled: 'border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700',
    disabled: 'border border-gray-200 text-gray-300 cursor-not-allowed',
  },
  
  // Page number buttons
  page: {
    default: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    active: 'border border-amber-600 bg-amber-600 text-white',
    ellipsis: 'border-transparent text-gray-400 cursor-default hover:bg-transparent',
  },
  
  // Info text styles
  info: {
    text: 'text-gray-700',
    muted: 'text-gray-500',
  },
  
  // Variants
  variants: {
    default: '',
    simple: 'gap-3',
    compact: 'gap-0.5',
  },
} as const;

export const collapsible = {
  container: 'overflow-hidden',
  
  // Trigger button styles
  trigger: {
    base: 'flex items-center justify-between w-full text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
    variants: {
      default: 'p-4 hover:bg-gray-50',
      minimal: 'py-2 hover:bg-gray-25',
      card: 'p-6 border-b border-gray-200 hover:bg-gray-50',
    },
  },
  
  // Title styles
  title: {
    base: 'font-medium text-gray-900',
    sizes: {
      sm: typography.text.sm,
      md: typography.text.base,
      lg: typography.text.lg,
      xl: typography.text.xl,
    },
  },
  
  // Icon styles
  icon: {
    base: 'flex-shrink-0 transition-all duration-200 text-gray-500',
    sizes: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
    expanded: 'rotate-180',
  },
  
  // Content area styles
  content: {
    base: 'overflow-hidden transition-all duration-300',
    variants: {
      default: 'px-4 pb-4',
      minimal: 'py-2',
      card: 'p-6 pt-0',
    },
  },
  
  // Wrapper variants
  variants: {
    default: '',
    card: 'bg-white rounded-lg shadow-sm border border-gray-200',
    bordered: 'border border-gray-200 rounded-md',
  },
  
  // Badge/counter styles
  badge: {
    base: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-amber-100 text-amber-700',
  },
} as const;