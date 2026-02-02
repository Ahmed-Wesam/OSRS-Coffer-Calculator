import fs from 'node:fs/promises'
import path from 'node:path'

function parseNumber(text) {
  const s = String(text).replace(/,/g, '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function parsePercent(text) {
  const s = String(text).replace('%', '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function stripTags(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseItemdbPrice(price) {
  const s = String(price).trim().toLowerCase()
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

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ge-scraper/compare-script',
      Accept: 'text/html,*/*',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

async function fetchJson(url) {
  let attempt = 0
  let backoffMs = 400

  while (true) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ge-scraper/compare-script',
        Accept: 'application/json',
      },
    })

    const text = await res.text()

    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && attempt < 4) {
        await new Promise((r) => setTimeout(r, backoffMs))
        attempt += 1
        backoffMs *= 2
        continue
      }
      throw new Error(`HTTP ${res.status} ${url}: ${text.slice(0, 200)}`)
    }

    try {
      return JSON.parse(text)
    } catch (e) {
      // Common causes: transient empty body, HTML error page, upstream rate-limit.
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, backoffMs))
        attempt += 1
        backoffMs *= 2
        continue
      }
      throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 200)}`)
    }
  }
}

function parseGeTrackerDeathsCoffer(html) {
  const rows = []

  const tbodyMatch = html.match(/<tbody[\s\S]*?<\/tbody>/i)
  const tbody = tbodyMatch ? tbodyMatch[0] : html

  const trRe = /<tr[^>]*class="[^"]*item-row[^"]*"[^>]*data-item-id="(\d+)"[\s\S]*?<\/tr>/gi
  let tr
  while ((tr = trRe.exec(tbody))) {
    const id = Number(tr[1])
    const trHtml = tr[0]

    const nameMatch = trHtml.match(/class="row-item-name"[^>]*>([\s\S]*?)<\/a>/i)
    const name = nameMatch ? stripTags(nameMatch[1]) : ''

    const tdMatches = [...trHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripTags(m[1]))

    // Indices based on observed GE Tracker table:
    // 0 name, 1 approx offer, 2 official ge, 3 coffer, 7 roi%
    const offerPrice = parseNumber(tdMatches[1])
    const officialGePrice = parseNumber(tdMatches[2])
    const cofferValue = parseNumber(tdMatches[3])
    const roiPct = parsePercent(tdMatches[7])

    if (![offerPrice, officialGePrice, cofferValue, roiPct].every((v) => Number.isFinite(v))) continue

    rows.push({ id, name, offerPrice, officialGePrice, cofferValue, roiPct })
  }

  return rows
}

async function main() {
  const root = process.cwd()
  const outDir = path.join(root, 'data')
  await fs.mkdir(outDir, { recursive: true })

  const geHtml = await fetchText('https://www.ge-tracker.com/deaths-coffer')
  const geRows = parseGeTrackerDeathsCoffer(geHtml)

  await fs.writeFile(path.join(outDir, 'ge-tracker.json'), JSON.stringify(geRows, null, 2), 'utf8')

  const latest = await fetchJson('https://prices.runescape.wiki/api/v1/osrs/latest')

  const standalone = []
  for (const r of geRows) {
    const d = latest?.data?.[String(r.id)]
    const offerFromWiki = d?.low
    if (!Number.isFinite(offerFromWiki) || offerFromWiki <= 0) continue

    // Use GE Tracker's official GE price as the official price source.
    // This avoids calling the Jagex itemdb endpoint from a bulk script (it throttles/returns empty bodies).
    const official = r.officialGePrice
    if (!Number.isFinite(official) || official < 10_000) continue

    const cofferValue = Math.floor(official * 1.05)
    const roiPct = ((cofferValue - offerFromWiki) / offerFromWiki) * 100

    standalone.push({
      id: r.id,
      name: r.name,
      offerPrice: offerFromWiki,
      officialGePrice: official,
      cofferValue,
      roiPct,
    })
  }

  await fs.writeFile(path.join(outDir, 'standalone.json'), JSON.stringify(standalone, null, 2), 'utf8')

  const byIdStandalone = new Map(standalone.map((x) => [x.id, x]))

  const diffs = []
  for (const gr of geRows) {
    const sr = byIdStandalone.get(gr.id)
    if (!sr) {
      diffs.push({ id: gr.id, name: gr.name, reason: 'missing_in_standalone' })
      continue
    }

    const deltaRoiPct = sr.roiPct - gr.roiPct
    const deltaOffer = sr.offerPrice - gr.offerPrice
    const deltaOfficial = sr.officialGePrice - gr.officialGePrice

    // Only keep meaningful diffs
    if (Math.abs(deltaRoiPct) >= 0.01 || deltaOffer !== 0 || deltaOfficial !== 0) {
      diffs.push({
        id: gr.id,
        name: gr.name,
        ge: gr,
        standalone: sr,
        deltaRoiPct,
        deltaOffer,
        deltaOfficial,
      })
    }
  }

  diffs.sort((a, b) => Math.abs(b.deltaRoiPct ?? 0) - Math.abs(a.deltaRoiPct ?? 0))

  const summary = {
    geCount: geRows.length,
    standaloneCount: standalone.length,
    diffCount: diffs.length,
    topDiffs: diffs.slice(0, 25),
  }

  await fs.writeFile(path.join(outDir, 'diff.json'), JSON.stringify({ summary, diffs }, null, 2), 'utf8')

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
