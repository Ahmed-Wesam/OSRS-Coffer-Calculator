export type GeTrackerDeathCofferRow = {
  id: number
  name: string
  offerPrice: number
  officialGePrice: number
  cofferValue: number
  roiPct: number
}

function parseNumber(text: string): number {
  const s = text.replace(/,/g, '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function parsePercent(text: string): number {
  const s = text.replace('%', '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

export function parseGeTrackerDeathsCofferHtml(html: string): GeTrackerDeathCofferRow[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const rows = Array.from(doc.querySelectorAll('tbody tr.item-row'))

  const out: GeTrackerDeathCofferRow[] = []

  for (const tr of rows) {
    try {
      const idAttr = tr.getAttribute('data-item-id')
      const id = idAttr ? Number(idAttr) : NaN
      if (!Number.isFinite(id)) continue

      const nameEl = tr.querySelector('a.row-item-name')
      const name = nameEl?.textContent?.trim() ?? ''
      if (!name) continue

      const tds = Array.from(tr.querySelectorAll('td'))
      if (tds.length < 8) { // Increased from 5 to 8 for better structure validation
        console.warn(`Insufficient table cells for item ${name}: ${tds.length} cells found`)
        continue
      }

      // Defensive parsing with better error messages
      const offerPrice = parseNumber(tds[1]?.textContent ?? '')
      if (!Number.isFinite(offerPrice)) {
        console.warn(`Invalid offer price for item ${name}: ${tds[1]?.textContent}`)
        continue
      }

      const officialGePrice = parseNumber(tds[2]?.textContent ?? '')
      if (!Number.isFinite(officialGePrice)) {
        console.warn(`Invalid GE price for item ${name}: ${tds[2]?.textContent}`)
        continue
      }

      const cofferValue = parseNumber(tds[3]?.textContent ?? '')
      if (!Number.isFinite(cofferValue)) {
        console.warn(`Invalid coffer value for item ${name}: ${tds[3]?.textContent}`)
        continue
      }

      // ROI is typically in column 7, but add fallback logic
      let roiPct = parsePercent(tds[7]?.textContent ?? '')
      if (!Number.isFinite(roiPct)) {
        // Try other common columns if 7 doesn't work
        roiPct = parsePercent(tds[6]?.textContent ?? '') || 
                 parsePercent(tds[5]?.textContent ?? '') ||
                 parsePercent(tds[4]?.textContent ?? '')
        
        if (!Number.isFinite(roiPct)) {
          console.warn(`Invalid ROI for item ${name}: ${tds[7]?.textContent}`)
          continue
        }
      }

      // Additional validation
      if (offerPrice <= 0 || officialGePrice <= 0 || cofferValue <= 0) {
        console.warn(`Non-positive values for item ${name}: offer=${offerPrice}, ge=${officialGePrice}, coffer=${cofferValue}`)
        continue
      }

      out.push({
        id,
        name,
        offerPrice,
        officialGePrice,
        cofferValue,
        roiPct,
      })
    } catch (error) {
      console.error(`Error parsing row for item:`, error, tr)
      continue
    }
  }

  if (out.length === 0) {
    console.warn('No valid items parsed from GE Tracker HTML. Structure may have changed.')
  }

  return out
}

export async function fetchGeTrackerDeathsCofferRows(): Promise<GeTrackerDeathCofferRow[]> {
  // Dev: use Vite proxy. Prod: choose platform endpoint.
  const url = (() => {
    if (import.meta.env.DEV) return '/ge-tracker/deaths-coffer'

    const host = window.location.hostname
    // Vercel deployments: route via /api.
    if (host.endsWith('.vercel.app')) return '/api/ge-tracker'
    // Netlify deployments: route via Netlify Functions.
    if (host.endsWith('.netlify.app')) return '/.netlify/functions/ge-tracker'

    // Default to Vercel-style API route for custom domains on Vercel.
    return '/api/ge-tracker'
  })()
  
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch GE Tracker page: HTTP ${res.status}`)
  }

  const html = await res.text()
  return parseGeTrackerDeathsCofferHtml(html)
}
