import { readCache, writeCache } from './cache'
import type { OsrsLatestResponse, OsrsMappingItem } from './types'
import {
  DEFAULT_RATE_LIMIT_MS,
  DEFAULT_BACKOFF_MS,
  DEFAULT_RETRIES,
  ITEMDB_RETRIES,
  MAPPING_CACHE_TTL_MS,
  LATEST_CACHE_TTL_MS,
  ITEMDB_CACHE_TTL_MS,
  OSRS_PRICES_BASE as PRICES_BASE,
} from './constants'

let lastFetchAt = 0
let fetchQueue: Promise<unknown> = Promise.resolve()

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

export async function getOsrsMapping(opts?: { ttlMs?: number }): Promise<OsrsMappingItem[]> {
  const ttlMs = opts?.ttlMs ?? MAPPING_CACHE_TTL_MS
  const cacheKey = 'osrs:mapping:v1'
  const cached = readCache<OsrsMappingItem[]>(cacheKey, ttlMs)
  if (cached) return cached

  const url = `${PRICES_BASE}/mapping`
  const data = await fetchJsonWithRetry<OsrsMappingItem[]>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsLatest(opts?: { ttlMs?: number }): Promise<OsrsLatestResponse> {
  const ttlMs = opts?.ttlMs ?? LATEST_CACHE_TTL_MS
  const cacheKey = 'osrs:latest:v1'
  const cached = readCache<OsrsLatestResponse>(cacheKey, ttlMs)
  if (cached) return cached

  const url = `${PRICES_BASE}/latest`
  const data = await fetchJsonWithRetry<OsrsLatestResponse>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsVolume(itemIds: number[], opts?: { ttlMs?: number }): Promise<Record<number, number>> {
  const ttlMs = opts?.ttlMs ?? LATEST_CACHE_TTL_MS
  const cacheKey = `osrs:volume:v1:${itemIds.sort().join(',')}`
  const cached = readCache<Record<number, number>>(cacheKey, ttlMs)
  if (cached) return cached

  // Get mapping data to estimate volume based on GE limits
  const mapping = await getOsrsMapping()
  const mappingById = new Map(mapping.map(m => [m.id, m]))
  
  const volumeData: Record<number, number> = {}
  for (const id of itemIds) {
    const itemMapping = mappingById.get(id)
    if (itemMapping && typeof itemMapping.limit === 'number' && itemMapping.limit > 0) {
      // Estimate daily volume as a multiple of the GE limit
      // This is a rough estimate since actual volume data isn't available
      // Popular items might trade 5-10x their GE limit daily
      const baseVolume = itemMapping.limit * 5 // Conservative estimate
      volumeData[id] = baseVolume
    } else {
      volumeData[id] = 0
    }
  }
  
  writeCache(cacheKey, volumeData)
  return volumeData
}

export async function getOsrsOfficialGuidePrice(itemId: number, opts?: { ttlMs?: number }): Promise<number> {
  const ttlMs = opts?.ttlMs ?? ITEMDB_CACHE_TTL_MS
  const cacheKey = `osrs:itemdb:detail:${itemId}`
  const cached = readCache<number>(cacheKey, ttlMs)
  if (typeof cached === 'number' && Number.isFinite(cached)) return cached

  const url = `/itemdb/m=itemdb_oldschool/api/catalogue/detail.json?item=${itemId}`
  try {
    const data = await fetchJsonWithRetry<ItemdbDetailResponse>(url, ITEMDB_RETRIES)
    const n = parseItemdbPrice(data?.item?.current?.price)
    if (!Number.isFinite(n)) {
      return NaN
    }

    writeCache(cacheKey, n)
    return n
  } catch {
    // Itemdb occasionally returns empty/invalid bodies under throttling.
    // Treat as missing for this item so the UI can continue.
    return NaN
  }
}
