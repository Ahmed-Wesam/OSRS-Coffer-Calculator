import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getOsrsVolume } from '../../src/lib/api.js'
import { readCache, writeCache } from '../../src/lib/cache.js'

// Mock the cache functions
vi.mock('../../src/lib/cache.js', () => ({
  readCache: vi.fn(),
  writeCache: vi.fn(),
}))

describe('API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOsrsVolume', () => {
    it('returns cached volume data when available', async () => {
      const mockCachedData = { 1: 5000, 2: 10000 }
      vi.mocked(readCache).mockReturnValue(mockCachedData)

      const result = await getOsrsVolume([1, 2])

      expect(result).toEqual(mockCachedData)
      expect(readCache).toHaveBeenCalledWith('osrs:volume:v1:1,2', 60000)
      expect(writeCache).not.toHaveBeenCalled()
    })

    it('returns empty object when no item IDs provided', async () => {
      vi.mocked(readCache).mockReturnValue(null)

      const result = await getOsrsVolume([])

      expect(result).toEqual({})
      expect(writeCache).toHaveBeenCalledWith('osrs:volume:v1:', {})
    })

    it('handles cache miss and calls writeCache', async () => {
      vi.mocked(readCache).mockReturnValue(null)

      const result = await getOsrsVolume([999]) // Non-existent item ID

      // Should return some result (even if empty) and call writeCache
      expect(typeof result).toBe('object')
      expect(writeCache).toHaveBeenCalled()
    })
  })
})
