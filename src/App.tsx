import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { DeathCofferRow, BlobStorageResponse } from './lib/types'
import { fetchBlobStorageDeathsCofferRows } from './lib/blobStorageApi'
import { formatInt, formatPct, itemUrl, parseRoiInput, parsePriceInput } from './lib/utils'

// Format date for user's timezone
function formatDateForUser(dateString: string): string {
  try {
    const date = new Date(dateString + 'T00:00:00.000Z')
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  } catch {
    return dateString
  }
}

// Format timestamp for user's timezone
function formatTimestampForUser(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).replace(',', '')
  } catch {
    return timestamp
  }
}

function App() {
  const [rows, setRows] = useState<DeathCofferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataInfo, setDataInfo] = useState<{date: string, timestamp?: string, isFallback?: boolean, fallbackDate?: string} | null>(null)

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

        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            setError('Loading timeout - the server may be initializing or no data is available yet. Please try refreshing in a few minutes.')
            setLoading(false)
          }
        }, 45000)

        let blobStorageData: BlobStorageResponse
        
        try {
          blobStorageData = await fetchBlobStorageDeathsCofferRows()
        } finally {
          if (timeoutId) clearTimeout(timeoutId)
        }
        
        if (!cancelled) {
          setRows(blobStorageData.items)
          setDataInfo({
            date: blobStorageData.date,
            timestamp: blobStorageData.timestamp,
            isFallback: blobStorageData.isFallback,
            fallbackDate: blobStorageData.fallbackDate
          })
          setLoading(false)
        }

      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch Blob Storage data:', error)
          
          if (error instanceof Error) {
            if (error.message.includes('HTTP 404')) {
              setError('No data available yet. The cron job needs to run first to generate Death\'s Coffer data. This usually happens automatically every few hours.')
            } else if (error.message.includes('Invalid response format')) {
              setError('Data format error. Please try refreshing the page.')
            } else if (error.message.includes('Failed to fetch Death\'s Coffer data')) {
              setError('Unable to fetch data from the server. Please try again later.')
            } else {
              setError(error.message)
            }
          } else {
            setError('An unexpected error occurred while loading data.')
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
        <h1 className="title">OSRS Death's Coffer Calculator</h1>
        <p className="subtitle">
          Calculate Return on Investment for Death&apos;s Coffer minigame. Data is precomputed and cached from OSRS Wiki and Jagex APIs.
        </p>
        
        {dataInfo && (
          <p className="data-info">
            Data from {dataInfo.timestamp ? formatTimestampForUser(dataInfo.timestamp) : formatDateForUser(dataInfo.date)}
            {dataInfo.isFallback && (
              <span className="fallback-note">
                {' '} (latest available - {dataInfo.fallbackDate})
              </span>
            )}
            {' '} • {' '}Only analyzes items above 100k GP due to Jagex API rate limits
          </p>
        )}

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
                <td className={r.roi > 0 ? "roi-positive" : ""}>{formatPct(r.roi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
