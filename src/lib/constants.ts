// Rate limiting
export const DEFAULT_RATE_LIMIT_MS = 150
export const DEFAULT_BACKOFF_MS = 400
export const DEFAULT_RETRIES = 3
export const ITEMDB_RETRIES = 8 // Increased for Jagex API throttling
export const JAGEX_INITIAL_BACKOFF_MS = 3000 // Longer initial backoff for Jagex
export const JAGEX_MAX_BACKOFF_MS = 60000 // Max 60 seconds backoff
export const JAGEX_RATE_LIMIT_MS = 5000 // 5 seconds between Jagex requests

// Cache TTLs
export const MAPPING_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
export const LATEST_CACHE_TTL_MS = 60 * 1000 // 1 minute
export const ITEMDB_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
export const INELIGIBLE_NAMES_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// API endpoints
export const OSRS_PRICES_BASE = 'https://prices.runescape.wiki/api/v1/osrs'
export const WIKI_API_BASE = 'https://oldschool.runescape.wiki/api.php'

// Working OSRS API endpoints
export const OSRS_API_BASE = 'https://prices.runescape.wiki/api/v1/osrs'
export const OSRS_LATEST_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/latest'
export const OSRS_MAPPING_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/mapping'
export const OSRS_VOLUME_ENDPOINT = 'https://prices.runescape.wiki/api/v1/osrs/5m'

// Death's Coffer filtering
export const MIN_OFFICIAL_GE_PRICE = 10_000
