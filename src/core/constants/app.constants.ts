// Application Constants

// Application Metadata
export const APP_CONFIG = {
  NAME: 'OSRS Death\'s Coffer ROI Calculator',
  VERSION: '2.0.0',
  DESCRIPTION: 'Calculate Return on Investment for Death\'s Coffer minigame',
  AUTHOR: 'Ahmed Wesam',
  HOMEPAGE: 'https://github.com/Ahmed-Wesam/OSRS-Coffer-Calculator',
  REPOSITORY: 'https://github.com/Ahmed-Wesam/OSRS-Coffer-Calculator.git',
} as const

// Environment Configuration
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// Feature Flags
export const FEATURES = {
  ENABLE_CACHING: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_MONITORING: false,
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: false,
  ENABLE_MOCK_DATA: true,
} as const

// Application Limits
export const LIMITS = {
  MAX_ITEMS_PER_REQUEST: 1000,
  MAX_FILTER_RESULTS: 500,
  MAX_SEARCH_RESULTS: 100,
  MAX_CONCURRENT_REQUESTS: 10,
  MAX_CACHE_SIZE: 10000,
  MAX_RETRY_ATTEMPTS: 3,
} as const

// Performance Thresholds
export const PERFORMANCE = {
  MAX_RESPONSE_TIME: 5000, // 5 seconds
  MAX_MEMORY_USAGE: 512, // MB
  MAX_CPU_USAGE: 80, // percentage
  CACHE_HIT_RATIO: 0.8, // 80%
} as const

// UI Configuration
export const UI_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
  DEBOUNCE_DELAY: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
  NOTIFICATION_DURATION: 5000, // milliseconds
  AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
} as const

// Data Refresh Intervals
export const REFRESH_INTERVALS = {
  MARKET_DATA: 300000, // 5 minutes
  VOLUME_DATA: 300000, // 5 minutes
  MAPPING_DATA: 86400000, // 24 hours
  CACHE_CLEANUP: 3600000, // 1 hour
  HEALTH_CHECK: 60000, // 1 minute
} as const

// File Paths
export const PATHS = {
  DATA_DIR: './data',
  CACHE_DIR: './cache',
  LOGS_DIR: './logs',
  TEMP_DIR: './temp',
  CONFIG_FILE: './config/app.json',
  ENV_FILE: './.env.local',
} as const

// File Names
export const FILE_NAMES = {
  ITEMS_DATA: 'items-{date}.json',
  MARKET_DATA: 'market-{date}.json',
  VOLUME_DATA: 'volume-{date}.json',
  MAPPING_DATA: 'mapping.json',
  CONFIG: 'config.json',
  ERROR_LOG: 'error.log',
  ACCESS_LOG: 'access.log',
} as const

// Date Formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  FILE_SAFE: 'YYYY-MM-DD_HH-mm-ss',
} as const

// Number Formats
export const NUMBER_FORMATS = {
  CURRENCY: {
    STYLE: 'currency',
    CURRENCY: 'gp',
  },
  PERCENTAGE: {
    STYLE: 'percent',
    MINIMUM_FRACTION_DIGITS: 1,
    MAXIMUM_FRACTION_DIGITS: 2,
  },
  COMPACT: {
    NOTATION: 'compact',
    MAXIMUM_FRACTION_DIGITS: 1,
  },
} as const

// Sorting Options
export const SORT_OPTIONS = {
  ROI_DESC: { field: 'roi' as const, direction: 'desc' as const },
  ROI_ASC: { field: 'roi' as const, direction: 'asc' as const },
  NAME_ASC: { field: 'name' as const, direction: 'asc' as const },
  NAME_DESC: { field: 'name' as const, direction: 'desc' as const },
  PRICE_ASC: { field: 'buyPrice' as const, direction: 'asc' as const },
  PRICE_DESC: { field: 'buyPrice' as const, direction: 'desc' as const },
  VOLUME_ASC: { field: 'volume' as const, direction: 'asc' as const },
  VOLUME_DESC: { field: 'volume' as const, direction: 'desc' as const },
} as const

// Filter Defaults
export const FILTER_DEFAULTS = {
  MIN_ROI: 0,
  MAX_ROI: 10,
  MIN_BUY_PRICE: 0,
  MAX_BUY_PRICE: 10000000,
  MIN_VOLUME: 0,
  SEARCH_QUERY: '',
  MEMBERS_ONLY: false,
} as const

// Validation Rules
export const VALIDATION_RULES = {
  ITEM_ID: {
    REQUIRED: true,
    MIN: 1,
    MAX: 99999,
    PATTERN: /^\d+$/,
  },
  PRICE: {
    REQUIRED: true,
    MIN: 1,
    MAX: 1000000000,
    PATTERN: /^\d+$/,
  },
  ROI: {
    REQUIRED: false,
    MIN: -1,
    MAX: 10,
    PATTERN: /^-?\d+(\.\d+)?$/,
  },
  SEARCH_QUERY: {
    REQUIRED: false,
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-']+$/,
  },
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  NOT_FOUND: 'The requested data was not found.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  VALIDATION_ERROR: 'Invalid input provided.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  DATA_UNAVAILABLE: 'Data is currently unavailable. Please try again later.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_LOADED: 'Data loaded successfully.',
  DATA_SAVED: 'Data saved successfully.',
  DATA_DELETED: 'Data deleted successfully.',
  FILTERS_APPLIED: 'Filters applied successfully.',
  SORT_CHANGED: 'Sort order changed successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const

// Loading Messages
export const LOADING_MESSAGES = {
  FETCHING_DATA: 'Fetching data...',
  CALCULATING_ROI: 'Calculating ROI...',
  APPLYING_FILTERS: 'Applying filters...',
  SAVING_DATA: 'Saving data...',
  UPDATING_CACHE: 'Updating cache...',
} as const

// Accessibility Labels
export const A11Y_LABELS = {
  TABLE: 'Death\'s Coffer ROI data table',
  FILTERS: 'Filter controls',
  SEARCH: 'Search items',
  SORT: 'Sort options',
  PAGINATION: 'Pagination controls',
  REFRESH: 'Refresh data',
  SETTINGS: 'Settings',
  HELP: 'Help',
  CLOSE: 'Close',
  MENU: 'Menu',
} as const
