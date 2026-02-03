import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseGeTrackerDeathsCofferHtml, fetchGeTrackerDeathsCofferRows } from '../../src/lib/geTracker.js'

const mockFetch = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mockFetch)
})

describe('lib/geTracker', () => {
  describe('parseGeTrackerDeathsCofferHtml', () => {
    it('parses valid rows with ROI data', () => {
      const html = `
        <table>
          <tbody>
            <tr class="item-row" data-item-id="4151">
              <td><a class="row-item-name">Dragon dagger</a></td>
              <td>50,000</td>
              <td>60,000</td>
              <td>75,000</td>
              <td></td><td></td><td></td><td>50%</td>
            </tr>
          </tbody>
        </table>
      `
      const result = parseGeTrackerDeathsCofferHtml(html)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 4151,
        name: 'Dragon dagger',
        offerPrice: 50000,
        officialGePrice: 60000,
        cofferValue: 75000,
        roiPct: 50,
      })
    })

    it('handles missing ROI gracefully', () => {
      const html = `
        <table>
          <tbody>
            <tr class="item-row" data-item-id="4151">
              <td><a class="row-item-name">Dragon dagger</a></td>
              <td>50,000</td>
              <td>60,000</td>
              <td>75,000</td>
              <td></td><td></td><td></td><td>-</td>
            </tr>
          </tbody>
        </table>
      `
      const result = parseGeTrackerDeathsCofferHtml(html)
      expect(result[0]?.roiPct).toBe(0)
    })

    it('skips invalid rows', () => {
      const html = `
        <table>
          <tbody>
            <tr>
              <td>Invalid row</td>
            </tr>
          </tbody>
        </table>
      `
      const result = parseGeTrackerDeathsCofferHtml(html)
      expect(result).toHaveLength(0)
    })

    it('handles malformed HTML gracefully', () => {
      const malformedHtml = '<table><tr><td>incomplete'
      const result = parseGeTrackerDeathsCofferHtml(malformedHtml)
      expect(result).toHaveLength(0)
    })

    it('handles empty tables', () => {
      const emptyHtml = '<table></table>'
      const result = parseGeTrackerDeathsCofferHtml(emptyHtml)
      expect(result).toHaveLength(0)
    })

    it('handles missing data attributes', () => {
      const html = `
        <table>
          <tbody>
            <tr class="item-row">
              <td><a class="row-item-name">Dragon dagger</a></td>
              <td>50,000</td>
              <td>60,000</td>
              <td>75,000</td>
              <td></td><td></td><td></td><td>50%</td>
            </tr>
          </tbody>
        </table>
      `
      const result = parseGeTrackerDeathsCofferHtml(html)
      expect(result).toHaveLength(0) // Missing data-item-id
    })

    it('handles missing item name', () => {
      const html = `
        <table>
          <tbody>
            <tr class="item-row" data-item-id="4151">
              <td><a class="row-item-name"></a></td>
              <td>50,000</td>
              <td>60,000</td>
              <td>75,000</td>
              <td></td><td></td><td></td><td>50%</td>
            </tr>
          </tbody>
        </table>
      `
      const result = parseGeTrackerDeathsCofferHtml(html)
      expect(result).toHaveLength(0) // Missing name
    })
  })

  describe('fetchGeTrackerDeathsCofferRows', () => {
    it('fetches data successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '<table></table>' })
      
      const result = await fetchGeTrackerDeathsCofferRows()
      
      expect(mockFetch).toHaveBeenCalled()
      expect(Array.isArray(result)).toBe(true)
    })

    it('handles fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      await expect(fetchGeTrackerDeathsCofferRows()).rejects.toThrow('Network error')
    })
  })
})
