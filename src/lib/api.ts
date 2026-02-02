import { readCache, writeCache } from './cache'
import type { OsrsLatestResponse, OsrsMappingItem } from './types'

const PRICES_BASE = 'https://prices.runescape.wiki/api/v1/osrs'

let lastFetchAt = 0

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

async function rateLimitedFetch(input: RequestInfo | URL, init?: RequestInit, minIntervalMs = 150) {
  const now = Date.now()
  const waitMs = Math.max(0, lastFetchAt + minIntervalMs - now)
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs))
  }
  lastFetchAt = Date.now()
  return fetch(input, init)
}

async function fetchJsonWithRetry<T>(url: string, retries = 3): Promise<T> {
  let attempt = 0
  let backoffMs = 400

  while (true) {
    const res = await rateLimitedFetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })

    const text = await res.text().catch(() => '')

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
  const ttlMs = opts?.ttlMs ?? 15 * 60 * 1000
  const cacheKey = 'osrs:mapping:v1'
  const cached = readCache<OsrsMappingItem[]>(cacheKey, ttlMs)
  if (cached) return cached

  const url = `${PRICES_BASE}/mapping`
  const data = await fetchJsonWithRetry<OsrsMappingItem[]>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsLatest(opts?: { ttlMs?: number }): Promise<OsrsLatestResponse> {
  const ttlMs = opts?.ttlMs ?? 60 * 1000
  const cacheKey = 'osrs:latest:v1'
  const cached = readCache<OsrsLatestResponse>(cacheKey, ttlMs)
  if (cached) return cached

  const url = `${PRICES_BASE}/latest`
  const data = await fetchJsonWithRetry<OsrsLatestResponse>(url)
  writeCache(cacheKey, data)
  return data
}

export async function getOsrsOfficialGuidePrice(itemId: number, opts?: { ttlMs?: number }): Promise<number> {
  const ttlMs = opts?.ttlMs ?? 24 * 60 * 60 * 1000
  const cacheKey = `osrs:itemdb:detail:${itemId}`
  const cached = readCache<number>(cacheKey, ttlMs)
  if (typeof cached === 'number' && Number.isFinite(cached)) return cached

  const url = `/itemdb/m=itemdb_oldschool/api/catalogue/detail.json?item=${itemId}`
  try {
    const data = await fetchJsonWithRetry<ItemdbDetailResponse>(url, 5)
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
