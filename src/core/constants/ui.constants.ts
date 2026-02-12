// UI Component Constants

// Breakpoints
export const BREAKPOINTS = {
  XS: 0,
  SM: 576,
  MD: 768,
  LG: 992,
  XL: 1200,
  XXL: 1400,
} as const

export const BREAKPOINT_NAMES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  XXL: 'xxl',
} as const

// Spacing
export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
  XXXL: '64px',
} as const

// Font Sizes
export const FONT_SIZES = {
  XS: '12px',
  SM: '14px',
  MD: '16px',
  LG: '18px',
  XL: '20px',
  XXL: '24px',
  XXXL: '32px',
} as const

// Font Weights
export const FONT_WEIGHTS = {
  LIGHT: 300,
  NORMAL: 400,
  MEDIUM: 500,
  SEMIBOLD: 600,
  BOLD: 700,
  EXTRABOLD: 800,
} as const

// Border Radius
export const BORDER_RADIUS = {
  NONE: '0',
  SM: '4px',
  MD: '8px',
  LG: '12px',
  XL: '16px',
  FULL: '9999px',
} as const

// Shadows
export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const

// Z-Index
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  NOTIFICATION: 1080,
} as const

// Transitions
export const TRANSITIONS = {
  FAST: '150ms ease-in-out',
  NORMAL: '250ms ease-in-out',
  SLOW: '350ms ease-in-out',
  BOUNCE: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  EXTRA_SLOW: 500,
} as const

// Button Sizes
export const BUTTON_SIZES = {
  SM: {
    HEIGHT: '32px',
    PADDING: '6px 12px',
    FONT_SIZE: '12px',
  },
  MD: {
    HEIGHT: '40px',
    PADDING: '8px 16px',
    FONT_SIZE: '14px',
  },
  LG: {
    HEIGHT: '48px',
    PADDING: '12px 24px',
    FONT_SIZE: '16px',
  },
} as const

// Input Sizes
export const INPUT_SIZES = {
  SM: {
    HEIGHT: '32px',
    PADDING: '6px 12px',
    FONT_SIZE: '12px',
  },
  MD: {
    HEIGHT: '40px',
    PADDING: '8px 16px',
    FONT_SIZE: '14px',
  },
  LG: {
    HEIGHT: '48px',
    PADDING: '12px 16px',
    FONT_SIZE: '16px',
  },
} as const

// Table Configurations
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MIN_COLUMN_WIDTH: '100px',
  MAX_COLUMN_WIDTH: '500px',
  ROW_HEIGHT: '48px',
  HEADER_HEIGHT: '56px',
} as const

// Modal Sizes
export const MODAL_SIZES = {
  SM: {
    WIDTH: '400px',
    MAX_WIDTH: '90vw',
  },
  MD: {
    WIDTH: '600px',
    MAX_WIDTH: '90vw',
  },
  LG: {
    WIDTH: '800px',
    MAX_WIDTH: '90vw',
  },
  XL: {
    WIDTH: '1000px',
    MAX_WIDTH: '95vw',
  },
} as const

// Loading Spinner Sizes
export const LOADING_SIZES = {
  SM: {
    WIDTH: '16px',
    HEIGHT: '16px',
    BORDER_WIDTH: '2px',
  },
  MD: {
    WIDTH: '24px',
    HEIGHT: '24px',
    BORDER_WIDTH: '3px',
  },
  LG: {
    WIDTH: '32px',
    HEIGHT: '32px',
    BORDER_WIDTH: '4px',
  },
} as const

// Icon Sizes
export const ICON_SIZES = {
  XS: '12px',
  SM: '16px',
  MD: '20px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
} as const

// Color Palette
export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  WARNING: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const

// Theme Colors
export const THEME_COLORS = {
  LIGHT: {
    BACKGROUND: COLORS.GRAY[50],
    SURFACE: '#ffffff',
    TEXT: COLORS.GRAY[900],
    TEXT_SECONDARY: COLORS.GRAY[600],
    BORDER: COLORS.GRAY[200],
    PRIMARY: COLORS.PRIMARY[500],
    SUCCESS: COLORS.SUCCESS[500],
    WARNING: COLORS.WARNING[500],
    ERROR: COLORS.ERROR[500],
  },
  DARK: {
    BACKGROUND: COLORS.GRAY[900],
    SURFACE: COLORS.GRAY[800],
    TEXT: COLORS.GRAY[100],
    TEXT_SECONDARY: COLORS.GRAY[400],
    BORDER: COLORS.GRAY[700],
    PRIMARY: COLORS.PRIMARY[400],
    SUCCESS: COLORS.SUCCESS[400],
    WARNING: COLORS.WARNING[400],
    ERROR: COLORS.ERROR[400],
  },
} as const

// Component Variants
export const VARIANTS = {
  BUTTON: {
    PRIMARY: {
      BACKGROUND: COLORS.PRIMARY[500],
      COLOR: '#ffffff',
      BORDER: COLORS.PRIMARY[500],
      HOVER: {
        BACKGROUND: COLORS.PRIMARY[600],
      },
    },
    SECONDARY: {
      BACKGROUND: 'transparent',
      COLOR: COLORS.PRIMARY[500],
      BORDER: COLORS.PRIMARY[500],
      HOVER: {
        BACKGROUND: COLORS.PRIMARY[50],
      },
    },
    DANGER: {
      BACKGROUND: COLORS.ERROR[500],
      COLOR: '#ffffff',
      BORDER: COLORS.ERROR[500],
      HOVER: {
        BACKGROUND: COLORS.ERROR[600],
      },
    },
    GHOST: {
      BACKGROUND: 'transparent',
      COLOR: COLORS.GRAY[700],
      BORDER: 'transparent',
      HOVER: {
        BACKGROUND: COLORS.GRAY[100],
      },
    },
  },
  INPUT: {
    DEFAULT: {
      BORDER: COLORS.GRAY[300],
      BACKGROUND: '#ffffff',
      COLOR: COLORS.GRAY[900],
      FOCUS: {
        BORDER: COLORS.PRIMARY[500],
        OUTLINE: 'none',
        BOX_SHADOW: `0 0 0 3px ${COLORS.PRIMARY[100]}`,
      },
      ERROR: {
        BORDER: COLORS.ERROR[500],
        BOX_SHADOW: `0 0 0 3px ${COLORS.ERROR[100]}`,
      },
    },
  },
} as const

// Responsive Utilities
export const RESPONSIVE = {
  HIDDEN: {
    SM: 'hidden sm:block',
    MD: 'hidden md:block',
    LG: 'hidden lg:block',
    XL: 'hidden xl:block',
  },
  VISIBLE: {
    SM: 'block sm:hidden',
    MD: 'block md:hidden',
    LG: 'block lg:hidden',
    XL: 'block xl:hidden',
  },
} as const

// Layout Constants
export const LAYOUT = {
  HEADER_HEIGHT: '64px',
  SIDEBAR_WIDTH: '256px',
  SIDEBAR_COLLAPSED_WIDTH: '64px',
  FOOTER_HEIGHT: '48px',
  CONTAINER_MAX_WIDTH: '1200px',
  CONTAINER_PADDING: '16px',
} as const

// Form Constants
export const FORM = {
  DEFAULT_LABEL_WIDTH: '120px',
  DEFAULT_FIELD_WIDTH: '100%',
  DEFAULT_GAP: '16px',
  SUBMIT_BUTTON_WIDTH: '120px',
} as const
