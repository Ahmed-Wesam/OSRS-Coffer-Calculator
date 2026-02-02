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
    const idAttr = tr.getAttribute('data-item-id')
    const id = idAttr ? Number(idAttr) : NaN
    if (!Number.isFinite(id)) continue

    const nameEl = tr.querySelector('a.row-item-name')
    const name = nameEl?.textContent?.trim() ?? ''

    const tds = Array.from(tr.querySelectorAll('td'))
    if (tds.length < 5) continue

    const offerPrice = parseNumber(tds[1]?.textContent ?? '')
    const officialGePrice = parseNumber(tds[2]?.textContent ?? '')
    const cofferValue = parseNumber(tds[3]?.textContent ?? '')
    const roiPct = parsePercent(tds[7]?.textContent ?? '')

    if (![offerPrice, officialGePrice, cofferValue, roiPct].every((v) => Number.isFinite(v))) continue

    out.push({
      id,
      name,
      offerPrice,
      officialGePrice,
      cofferValue,
      roiPct,
    })
  }

  return out
}

export async function fetchGeTrackerDeathsCofferRows(): Promise<GeTrackerDeathCofferRow[]> {
  const res = await fetch('/ge-tracker/deaths-coffer', {
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
