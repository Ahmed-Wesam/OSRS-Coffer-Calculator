import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { DeathCofferRow } from './lib/types'
import { fetchGeTrackerDeathsCofferRows } from './lib/geTracker'
import { getOsrsMapping } from './lib/api'
import { getDeathsCofferIneligibleNames } from './lib/deathsCofferIneligible'
import { MIN_OFFICIAL_GE_PRICE } from './lib/constants'

function formatInt(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

function formatPct(p: number): string {
  return `${(p * 100).toFixed(2)}%`
}

function itemUrl(id: number): string {
  return `https://prices.runescape.wiki/osrs/item/${id}`
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function parsePriceInput(raw: string): number | null {
  const s0 = raw.trim()
  if (!s0) return null

  const s = s0.toLowerCase().replace(/,/g, '')
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?$/)
  if (!m) {
    const n = Number(s)
    return Number.isFinite(n) ? n : null
  }

  const base = Number(m[1])
  if (!Number.isFinite(base)) return null

  const suffix = m[2]
  if (suffix === 'k') return Math.round(base * 1_000)
  if (suffix === 'm') return Math.round(base * 1_000_000)
  if (suffix === 'b') return Math.round(base * 1_000_000_000)
  return Math.round(base)
}

function App() {
  const [rows, setRows] = useState<DeathCofferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [minRoiPct, setMinRoiPct] = useState('0')
  const [minBuyPrice, setMinBuyPrice] = useState('')
  const [maxBuyPrice, setMaxBuyPrice] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        setRows([])

        const [ge, mapping] = await Promise.all([fetchGeTrackerDeathsCofferRows(), getOsrsMapping()])
        const mappingById = new Map(mapping.map((m) => [m.id, m]))

        const ineligibleNames = await getDeathsCofferIneligibleNames(mapping)

        const computed: DeathCofferRow[] = ge
          .map((r) => ({
            id: r.id,
            name: r.name,
            buyPrice: r.offerPrice,
            officialGePrice: r.officialGePrice,
            cofferValue: r.cofferValue,
            roi: r.roiPct / 100,
          }))
          .filter((r) => r.roi > 0)
          .filter((r) => r.officialGePrice >= MIN_OFFICIAL_GE_PRICE)
          // Must be tradable on the Grand Exchange (has a GE buy limit in mapping).
          .filter((r) => {
            const m = mappingById.get(r.id)
            return !!(m && typeof m.limit === 'number' && m.limit > 0)
          })
          // Exclude known-ineligible groups/items as best-effort.
          .filter((r) => {
            const n = normalizeName(r.name)
            if (ineligibleNames.has(n)) return false
            if (n.includes(' bond')) return false
            if (n.endsWith(' bond')) return false
            // Leagues reward tiers commonly use a (t1)/(t2)/(t3) suffix.
            if (/\(t\d+\)$/.test(n)) return false
            return true
          })

        // GE Tracker can include duplicate rows for the same item id.
        // Keep the highest ROI row per id to avoid React duplicate key warnings.
        const byId = new Map<number, DeathCofferRow>()
        for (const r of computed) {
          const prev = byId.get(r.id)
          if (!prev || r.roi > prev.roi) byId.set(r.id, r)
        }
        const deduped = Array.from(byId.values())
        deduped.sort((a, b) => b.roi - a.roi)

        if (!cancelled) setRows(deduped)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const minPct = Number(minRoiPct)
    const minRoi = Number.isFinite(minPct) ? minPct / 100 : 0

    const minBuy = parsePriceInput(minBuyPrice)
    const maxBuy = parsePriceInput(maxBuyPrice)

    let result = rows.filter((r) => r.roi >= minRoi)

    if (typeof minBuy === 'number') {
      result = result.filter((r) => r.buyPrice >= minBuy)
    }
    if (typeof maxBuy === 'number') {
      result = result.filter((r) => r.buyPrice <= maxBuy)
    }

    return result
  }, [rows, minRoiPct, minBuyPrice, maxBuyPrice])

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">OSRS Death&apos;s Coffer ROI Calculator</h1>

        <div className="controls">
          <div className="control">
            <label htmlFor="minBuy">Min buy price</label>
            <input
              id="minBuy"
              value={minBuyPrice}
              onChange={(e) => setMinBuyPrice(e.target.value)}
              placeholder="e.g. 300k"
            />
          </div>

          <div className="control">
            <label htmlFor="maxBuy">Max buy price</label>
            <input
              id="maxBuy"
              value={maxBuyPrice}
              onChange={(e) => setMaxBuyPrice(e.target.value)}
              placeholder="e.g. 2m"
            />
          </div>

          <div className="control">
            <label htmlFor="minRoi">Min ROI (%)</label>
            <input
              id="minRoi"
              value={minRoiPct}
              onChange={(e) => setMinRoiPct(e.target.value)}
              inputMode="decimal"
              placeholder="0"
            />
          </div>

          <button
            className="button"
            onClick={() => {
              setMinRoiPct('0')
              setMinBuyPrice('')
              setMaxBuyPrice('')
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="muted">Error: {error}</p>
      ) : null}

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Buy price</th>
              <th>Official GE</th>
              <th>Coffer value</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <a href={itemUrl(r.id)} target="_blank" rel="noreferrer">
                    {r.name}
                  </a>
                </td>
                <td>{formatInt(r.buyPrice)}</td>
                <td>{formatInt(r.officialGePrice)}</td>
                <td>{formatInt(r.cofferValue)}</td>
                <td>{formatPct(r.roi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
