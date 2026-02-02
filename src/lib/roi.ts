import type { DeathCofferRow, OsrsLatestResponse, OsrsMappingItem } from './types'

function floorInt(n: number): number {
  return Math.floor(n)
}

export function computeDeathCofferRows(params: {
  mapping: OsrsMappingItem[]
  latest: OsrsLatestResponse
  minGeValue: number
}): DeathCofferRow[] {
  const { mapping, latest, minGeValue } = params

  const rows: DeathCofferRow[] = []

  for (const item of mapping) {
    const d = latest.data[String(item.id)]
    if (!d) continue

    const high = d.high
    const low = d.low

    const officialGePrice = Math.min(high, low)
    const buyPrice = Math.max(high, low)

    if (!Number.isFinite(buyPrice) || !Number.isFinite(officialGePrice)) continue
    if (buyPrice <= 0 || officialGePrice <= 0) continue

    // Drop obviously broken pairs (stale/low-volume spikes can produce absurd mismatches).
    // If one side is >= 10x the other, it's not meaningful for ROI.
    if (buyPrice / officialGePrice >= 10) continue

    if (!item.limit || item.limit <= 0) continue
    if (officialGePrice < minGeValue) continue

    const cofferValue = floorInt(officialGePrice * 1.05)
    const roi = (cofferValue - buyPrice) / buyPrice

    if (!(roi > 0)) continue

    rows.push({
      id: item.id,
      name: item.name,
      buyPrice,
      officialGePrice,
      cofferValue,
      roi,
    })
  }

  return rows
}
