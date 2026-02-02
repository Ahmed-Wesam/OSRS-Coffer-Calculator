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

// CORS proxy for production (free service - allorigins.win)
// Used when the app is deployed (not in dev where Vite proxy handles it)
export const CORS_PROXY_BASE = 'https://api.allorigins.win/raw?url='
export const ITEMDB_BASE = 'https://secure.runescape.com/m=itemdb_oldschool'

// Death's Coffer filtering
export const MIN_OFFICIAL_GE_PRICE = 10_000
export const MIN_ROI = 1 // 1% minimum ROI to show
