export function formatInt(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

export function formatPct(p: number): string {
  return `${p.toFixed(2)}%`
}

export function itemUrl(id: number): string {
  return `https://prices.runescape.wiki/osrs/item/${id}`
}

export function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function parseRoiInput(raw: string): number | null {
  const s0 = raw.trim()
  if (!s0) return null

  const s = s0.toLowerCase().replace(/,/g, '')
  const n = Number(s)
  
  // Validate it's a finite number
  if (!Number.isFinite(n)) return null
  
  // Bounds checking: ROI should be between 0% and 1000%
  if (n < 0 || n > 1000) return null
  
  return n
}

export function parsePriceInput(raw: string): number | null {
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
