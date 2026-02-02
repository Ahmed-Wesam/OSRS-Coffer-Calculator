type CacheEnvelope<T> = {
  v: T
  t: number
}

export function readCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    if (!parsed || typeof parsed.t !== 'number') return null
    if (Date.now() - parsed.t > maxAgeMs) return null
    return parsed.v
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    const env: CacheEnvelope<T> = { v: value, t: Date.now() }
    localStorage.setItem(key, JSON.stringify(env))
  } catch {
    return
  }
}
