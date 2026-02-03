import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { DeathCofferRow } from './lib/types'
import { fetchEdgeConfigDeathsCofferRows } from './lib/edgeConfigApi'
import { formatInt, formatPct, itemUrl, parseRoiInput, parsePriceInput } from './lib/utils'

function App() {
  const [rows, setRows] = useState<DeathCofferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [minRoiPct, setMinRoiPct] = useState('0')
  const [minBuyPrice, setMinBuyPrice] = useState('')
  const [maxBuyPrice, setMaxBuyPrice] = useState('')

  useEffect(() => {
    let cancelled = false
    let timeoutId: number
    
    async function run() {
      try {
        setLoading(true)
        setError(null)
        setRows([])

        // Set a timeout to prevent infinite loading
        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            setError('Loading timeout - please refresh the page')
            setLoading(false)
          }
        }, 30000) // 30 seconds (shorter since Edge Config should be fast)

        // Fetch data from Edge Config only - no API requests to Wiki
        const edgeConfigData = await fetchEdgeConfigDeathsCofferRows()
        
        if (!cancelled) {
          setRows(edgeConfigData)
          setLoading(false)
        }

      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch Edge Config data:', error)
          
          // Check if it's a 404 error (no data available yet)
          if (error instanceof Error && error.message.includes('HTTP 404')) {
            setError('No data available yet. The cron job needs to run first to generate Death\'s Coffer data.')
          } else {
            setError(error instanceof Error ? error.message : 'Failed to load data')
          }
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const filtered = useMemo(() => {
    const minRoi = parseRoiInput(minRoiPct)
    const minRoiDecimal = (minRoi ?? 0) / 100

    const minBuy = parsePriceInput(minBuyPrice)
    const maxBuy = parsePriceInput(maxBuyPrice)

    let result = rows.filter((r) => r.roi >= minRoiDecimal)

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
        <p className="subtitle">
          Calculate Return on Investment for Death&apos;s Coffer minigame. Data is precomputed and cached from OSRS Wiki and Jagex APIs.
        </p>

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
              <th>Volume</th>
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
                <td className={r.roi > 0 ? "roi-positive" : ""}>{formatPct(r.roi)}</td>
                <td>{formatInt(r.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
