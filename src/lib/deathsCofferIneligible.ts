import { readCache, writeCache } from './cache'
import type { OsrsMappingItem } from './types'
import {
  INELIGIBLE_NAMES_CACHE_TTL_MS,
  WIKI_API_BASE,
} from './constants'
import { normalizeName } from './utils'

type MediaWikiQueryLinksResponse = {
  continue?: {
    plcontinue?: string
    continue?: string
  }
  query?: {
    pages?: Record<
      string,
      {
        pageid?: number
        title?: string
        links?: Array<{ ns: number; title: string }>
      }
    >
  }
}

async function fetchAllPageLinks(pageTitle: string): Promise<string[]> {
  const out: string[] = []
  let plcontinue: string | undefined

  while (true) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      titles: pageTitle,
      prop: 'links',
      pllimit: 'max',
    })
    if (plcontinue) params.set('plcontinue', plcontinue)

    const url = `${WIKI_API_BASE}?${params.toString()}`
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error(`Wiki api.php failed: HTTP ${res.status}`)
    }

    const text = await res.text().catch(() => { return '' })
    const data: MediaWikiQueryLinksResponse = ((): MediaWikiQueryLinksResponse => {
      try {
        return JSON.parse(text) as MediaWikiQueryLinksResponse
      } catch {
        throw new Error(`Invalid JSON from Wiki api.php: ${text.slice(0, 200)}`)
      }
    })()

    const pages = data.query?.pages ?? {}
    for (const p of Object.values(pages)) {
      for (const l of p.links ?? []) {
        // Skip non-main namespace.
        if (l.ns !== 0) continue
        out.push(l.title)
      }
    }

    plcontinue = data.continue?.plcontinue
    if (!plcontinue) break
  }

  return out
}

export async function getDeathsCofferIneligibleNames(
  mapping: OsrsMappingItem[],
  opts?: { ttlMs?: number }
): Promise<Set<string>> {
  const ttlMs = opts?.ttlMs ?? INELIGIBLE_NAMES_CACHE_TTL_MS
  const cacheKey = 'osrs:deathscoffer:ineligibleNames:v1'

  const cached = readCache<string[]>(cacheKey, ttlMs)
  if (Array.isArray(cached)) {
    return new Set(cached)
  }

  const mappingNameSet = new Set(mapping.map((m) => normalizeName(m.name)))

  // Pages linked from the OSRS Wiki "Ineligible items" section.
  const sources = ['Leagues_Reward_Shop', 'Grid_Master', 'Deadman_Reward_Store', 'Keel_parts']

  const explicit = ['old school bond', "belle's folly", 'dragon cannon barrel'].map((n) => normalizeName(n))

  const ineligible = new Set<string>(explicit)

  for (const page of sources) {
    const titles = await fetchAllPageLinks(page)
    for (const t of titles) {
      const n = normalizeName(t)
      // Only keep titles that correspond to actual item names in mapping.
      if (mappingNameSet.has(n)) {
        ineligible.add(n)
      }
    }
  }

  const arr = Array.from(ineligible)
  writeCache(cacheKey, arr)
  return ineligible
}
