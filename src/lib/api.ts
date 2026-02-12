import { readCache, writeCache } from './cache'
import type { OsrsLatestResponse, OsrsMappingItem, OsrsVolumeResponse } from './types'
import {
  DEFAULT_RATE_LIMIT_MS,
  DEFAULT_BACKOFF_MS,
  DEFAULT_RETRIES,
  ITEMDB_RETRIES,
  MAPPING_CACHE_TTL_MS,
  LATEST_CACHE_TTL_MS,
  ITEMDB_CACHE_TTL_MS,
  JAGEX_INITIAL_BACKOFF_MS,
  JAGEX_MAX_BACKOFF_MS,
  JAGEX_RATE_LIMIT_MS,
  OSRS_MAPPING_ENDPOINT,
  OSRS_LATEST_ENDPOINT,
  OSRS_VOLUME_ENDPOINT,
} from './constants'

let lastFetchAt = 0
let fetchQueue: Promise<unknown> = Promise.resolve()

// Jagex API queue for aggressive throttling
let lastJagexFetchAt = 0
let jagexFetchQueue: Promise<unknown> = Promise.resolve()

function parseItemdbPrice(price: unknown): number {
  const s = String(price ?? '').trim().toLowerCase()
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/)
  if (!m) {
    const n = Number(s.replace(/,/g, ''))
    return Number.isFinite(n) ? n : NaN
  }

  const base = Number(m[1])
  if (!Number.isFinite(base)) return NaN

  const suffix = m[2]
  if (suffix === 'k') return Math.round(base * 1_000)
  if (suffix === 'm') return Math.round(base * 1_000_000)
  if (suffix === 'b') return Math.round(base * 1_000_000_000)
  return Math.round(base)
}

type ItemdbDetailResponse = {
  item: {
    id: number
    name: string
    current: {
      trend: string
      price: string
    }
  }
}

async function rateLimitedFetch(input: RequestInfo | URL, init?: RequestInit, minIntervalMs = DEFAULT_RATE_LIMIT_MS): Promise<Response> {
  // Chain requests to ensure proper rate limiting without race conditions
  return (fetchQueue = fetchQueue.then(async (): Promise<Response> => {
    const now = Date.now()
    const waitMs = Math.max(0, lastFetchAt + minIntervalMs - now)
    if (waitMs > 0) {
      await new Promise((r) => setTimeout(r, waitMs))
    }
    lastFetchAt = Date.now()
    return fetch(input, init)
  }) as Promise<Response>)
}

async function fetchJsonWithRetry<T>(url: string, retries = DEFAULT_RETRIES): Promise<T> {
  let attempt = 0
  let backoffMs = DEFAULT_BACKOFF_MS

  while (true) {
    const res = await rateLimitedFetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    const text = await res.text().catch(() => { return '' })

    if (res.ok) {
      try {
        return JSON.parse(text) as T
      } catch {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, backoffMs))
          attempt += 1
          backoffMs *= 2
          continue
        }
        throw new Error(`Invalid JSON fetching ${url}: ${text.slice(0, 200)}`)
      }
    }

    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await new Promise((r) => setTimeout(r, backoffMs))
      attempt += 1
      backoffMs *= 2
      continue
    }

    throw new Error(`HTTP ${res.status} fetching ${url}: ${text.slice(0, 200)}`)
  }
}

async function fetchJagexWithRetry<T>(url: string): Promise<T> {
  // Use queue system for aggressive throttling
  const result = await jagexFetchQueue
  jagexFetchQueue = jagexFetchQueue.then(async () => {
    // Wait for rate limit
    const now = Date.now()
    const timeSinceLastFetch = now - lastJagexFetchAt
    if (timeSinceLastFetch < JAGEX_RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, JAGEX_RATE_LIMIT_MS - timeSinceLastFetch))
    }

    let attempt = 0
    let backoffMs = JAGEX_INITIAL_BACKOFF_MS

    while (true) {
      try {
        lastJagexFetchAt = Date.now()
        
        const res = await rateLimitedFetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ge-scraper/1.0',
            'Connection': 'keep-alive',
          },
        }, JAGEX_RATE_LIMIT_MS) // Enforce minimum delay

        const text = await res.text().catch(() => { return '' })

        // Enhanced empty response detection
        if (!text || text.trim() === '' || text.trim() === 'null' || text.trim().length < 10) {
          throw new Error(`Empty/invalid response from Jagex API: "${text}"`)
        }

        // Validate JSON before parsing
        try {
          const parsed = JSON.parse(text)
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid JSON structure')
          }
          return parsed as T
        } catch (parseError) {
          throw new Error(`JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}. Response: "${text.substring(0, 200)}"`)
        }

      } catch (error) {
        attempt++
        
        if (attempt >= ITEMDB_RETRIES) {
          throw new Error(`Jagex API failed after ${ITEMDB_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`)
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 1000 // Add up to 1 second jitter
        const delay = Math.min(backoffMs + jitter, JAGEX_MAX_BACKOFF_MS)
        
        console.warn(`Jagex API attempt ${attempt} failed, retrying in ${Math.round(delay)}ms: ${error instanceof Error ? error.message : String(error)}`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        backoffMs = Math.min(backoffMs * 2, JAGEX_MAX_BACKOFF_MS)
      }
    }
  })
  
  return result as T
}

export async function getOsrsMapping(opts?: { ttlMs?: number }): Promise<OsrsMappingItem[]> {
  const ttlMs = opts?.ttlMs ?? MAPPING_CACHE_TTL_MS
  const cacheKey = 'osrs:mapping:v1'
  const cached = readCache<OsrsMappingItem[]>(cacheKey, ttlMs)
  if (cached) return cached

  const url = OSRS_MAPPING_ENDPOINT
  const data = await fetchJsonWithRetry<OsrsMappingItem[]>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsLatest(opts?: { ttlMs?: number }): Promise<OsrsLatestResponse> {
  const ttlMs = opts?.ttlMs ?? LATEST_CACHE_TTL_MS
  const cacheKey = 'osrs:latest:v1'
  const cached = readCache<OsrsLatestResponse>(cacheKey, ttlMs)
  if (cached) return cached

  const url = OSRS_LATEST_ENDPOINT
  const data = await fetchJsonWithRetry<OsrsLatestResponse>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsVolume(opts?: { ttlMs?: number }): Promise<OsrsVolumeResponse> {
  const ttlMs = opts?.ttlMs ?? LATEST_CACHE_TTL_MS
  const cacheKey = 'osrs:volume:v1'
  const cached = readCache<OsrsVolumeResponse>(cacheKey, ttlMs)
  if (cached) return cached

  const url = OSRS_VOLUME_ENDPOINT
  const data = await fetchJsonWithRetry<OsrsVolumeResponse>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsOfficialGuidePrice(itemId: number, opts?: { ttlMs?: number }): Promise<number> {
  const ttlMs = opts?.ttlMs ?? ITEMDB_CACHE_TTL_MS
  const cacheKey = `osrs:itemdb:detail:${itemId}`
  const cached = readCache<number>(cacheKey, ttlMs)
  if (typeof cached === 'number' && Number.isFinite(cached)) return cached

  const url = `/itemdb/m=itemdb_oldschool/api/catalogue/detail.json?item=${itemId}`
  try {
    const data = await fetchJagexWithRetry<ItemdbDetailResponse>(url)
    const n = parseItemdbPrice(data?.item?.current?.price)
    if (!Number.isFinite(n)) {
      return NaN
    }

    writeCache(cacheKey, n)
    return n
  } catch (error) {
    // Enhanced error handling for Jagex API issues
    // Itemdb occasionally returns empty/invalid bodies under throttling.
    // Treat as missing for this item so the UI can continue.
    console.warn(`Jagex API error for item ${itemId}:`, error instanceof Error ? error.message : String(error))
    return NaN
  }
}
