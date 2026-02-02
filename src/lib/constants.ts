// Rate limiting
export const DEFAULT_RATE_LIMIT_MS = 150
export const DEFAULT_BACKOFF_MS = 400
export const DEFAULT_RETRIES = 3
export const ITEMDB_RETRIES = 5

// Cache TTLs
export const MAPPING_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
export const LATEST_CACHE_TTL_MS = 60 * 1000 // 1 minute
export const ITEMDB_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
export const INELIGIBLE_NAMES_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// API endpoints
export const OSRS_PRICES_BASE = 'https://prices.runescape.wiki/api/v1/osrs'
export const WIKI_API_BASE = 'https://oldschool.runescape.wiki/api.php'

// Death's Coffer filtering
export const MIN_OFFICIAL_GE_PRICE = 10_000
export const MIN_ROI = 1 // 1% minimum ROI to show
