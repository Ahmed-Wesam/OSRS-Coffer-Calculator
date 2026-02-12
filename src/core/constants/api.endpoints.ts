// API Endpoint Constants

// Define base URLs first
const JAGEX_BASE = 'https://secure.runescape.com/m=itemdb_oldschool/api/catalogue'
const WIKI_BASE = 'https://api.wiki.oldschool.gg'
const BLOB_BASE = 'https://api.vercel.com/v2/blob'
const LOCAL_BASE = '/api'

export const API_ENDPOINTS = {
  // Jagex API
  JAGEX: {
    BASE: JAGEX_BASE,
    ITEM_DETAIL: (itemId: number) => `${JAGEX_BASE}/detail.json?item=${itemId}`,
  },

  // OSRS Wiki API
  WIKI: {
    BASE: WIKI_BASE,
    LATEST: `${WIKI_BASE}/1m/latest`,
    VOLUME: `${WIKI_BASE}/1m/volume`,
    MAPPING: `${WIKI_BASE}/api/1.3/oldschool/runescape/items`,
    WIKI_API: 'https://oldschool.runescape.wiki/api.php',
  },

  // Vercel Blob Storage
  BLOB: {
    BASE: BLOB_BASE,
    LIST: BLOB_BASE,
    UPLOAD: BLOB_BASE,
    DELETE: (pathname: string) => `${BLOB_BASE}${pathname}`,
  },

  // Local API Routes
  LOCAL: {
    BASE: LOCAL_BASE,
    ITEMS_DATA: `${LOCAL_BASE}/items-data`,
  },
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
} as const

// API Headers
export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  USER_AGENT: 'User-Agent',
  ACCEPT: 'Accept',
  X_FORWARDED_FOR: 'x-forwarded-for',
  X_REAL_IP: 'x-real-ip',
  X_REQUEST_ID: 'x-request-id',
} as const

// Rate Limiting
export const RATE_LIMITS = {
  JAGEX: {
    MAX_REQUESTS: 1,
    WINDOW_MS: 1200, // 1.2 seconds between requests
  },
  WIKI: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60000, // 10 requests per minute
  },
  BLOB: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000, // 100 requests per minute
  },
  CRON: {
    MAX_REQUESTS: 2,
    WINDOW_MS: 300000, // 2 requests per 5 minutes
  },
} as const

// Retry Configuration
export const RETRY_CONFIG = {
  DEFAULT: {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 30000,
    BACKOFF_FACTOR: 2,
    JITTER: true,
  },
  JAGEX: {
    MAX_RETRIES: 2,
    BASE_DELAY: 500,
    MAX_DELAY: 5000,
    BACKOFF_FACTOR: 1.5,
    JITTER: true,
  },
  WIKI: {
    MAX_RETRIES: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000,
    BACKOFF_FACTOR: 2,
    JITTER: true,
  },
} as const

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutes
  LONG_TTL: 3600000, // 1 hour
  SHORT_TTL: 60000, // 1 minute
  MAX_SIZE: 1000,
} as const

// Timeout Configuration
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  SHORT: 5000, // 5 seconds
  LONG: 120000, // 2 minutes
  JAGEX: 10000, // 10 seconds
  WIKI: 15000, // 15 seconds
  BLOB: 45000, // 45 seconds
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 1000,
} as const

// Data Validation
export const VALIDATION = {
  ITEM_ID: {
    MIN: 1,
    MAX: 99999,
  },
  PRICE: {
    MIN: 1,
    MAX: 1000000000, // 1 billion
  },
  ROI: {
    MIN: -1,
    MAX: 10,
  },
  VOLUME: {
    MIN: 0,
    MAX: 10000000,
  },
} as const

// Business Rules
export const BUSINESS_RULES = {
  DEATHS_COFFER_MULTIPLIER: 1.05,
  MIN_VALUE_THRESHOLD: 10000, // 10k GP
  MAX_CANDIDATE_ITEMS: 100,
  MIN_PROFITABLE_ROI: 0,
  COOLDOWN_PERIOD: 300000, // 5 minutes
} as const

// Error Codes
export const ERROR_CODES = {
  // API Errors
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  API_NETWORK_ERROR: 'API_NETWORK_ERROR',
  
  // Business Logic Errors
  INVALID_ITEM_ID: 'INVALID_ITEM_ID',
  INVALID_PRICE: 'INVALID_PRICE',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  
  // Data Errors
  DATA_NOT_AVAILABLE: 'DATA_NOT_AVAILABLE',
  DATA_STALE: 'DATA_STALE',
  DATA_CORRUPTED: 'DATA_CORRUPTED',
  
  // System Errors
  CACHE_ERROR: 'CACHE_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
} as const

// User Agents
export const USER_AGENTS = {
  DEFAULT: 'ge-scraper/1.0',
  SCRAPER: 'ge-scraper/precompute',
  BROWSER: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
} as const

// Environment Variables
export const ENV_VARS = {
  BLOB_READ_WRITE_TOKEN: 'BLOB_READ_WRITE_TOKEN',
  EDGE_CONFIG_ID: 'EDGE_CONFIG_ID',
  EDGE_CONFIG_TOKEN: 'EDGE_CONFIG_TOKEN',
  NODE_ENV: 'NODE_ENV',
  LOG_LEVEL: 'LOG_LEVEL',
  API_TIMEOUT: 'API_TIMEOUT',
} as const
