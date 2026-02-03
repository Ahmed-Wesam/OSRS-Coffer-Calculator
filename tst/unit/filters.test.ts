import { describe, it, expect } from 'vitest'

// Mock filtering functions from the App component
function filterByMinRoi(items: Array<{ id: number; roi: number }>, minRoi: number): Array<{ id: number; roi: number }> {
  return items.filter(item => item.roi >= minRoi)
}

function filterByPriceRange(items: Array<{ id: number; buyPrice: number }>, minPrice: number | undefined, maxPrice: number | undefined): Array<{ id: number; buyPrice: number }> {
  return items.filter(item => {
    if (minPrice !== undefined && item.buyPrice < minPrice) return false
    if (maxPrice !== undefined && item.buyPrice > maxPrice) return false
    return true
  })
}

function filterByGeLimit(items: Array<{ id: number }>, mapping: Map<number, { limit: number }>): Array<{ id: number }> {
  return items.filter(item => {
    const mapItem = mapping.get(item.id)
    return mapItem && typeof mapItem.limit === 'number' && mapItem.limit > 0
  })
}

describe('Item Filtering', () => {
  it('filters by minimum ROI threshold', () => {
    const items = [
      { id: 1, roi: 0.5 }, // 50%
      { id: 2, roi: 0.1 }, // 10%
      { id: 3, roi: 0.2 }  // 20%
    ]
    const filtered = filterByMinRoi(items, 0.15)
    expect(filtered).toHaveLength(2)
    expect(filtered.map(item => item.id)).toEqual([1, 3])
  })

  it('includes all items when ROI threshold is 0', () => {
    const items = [
      { id: 1, roi: 0.5 },
      { id: 2, roi: 0.1 },
      { id: 3, roi: 0.2 }
    ]
    const filtered = filterByMinRoi(items, 0)
    expect(filtered).toHaveLength(3)
  })

  it('filters by price range', () => {
    const items = [
      { id: 1, buyPrice: 500 },
      { id: 2, buyPrice: 2000 },
      { id: 3, buyPrice: 5000 }
    ]
    const filtered = filterByPriceRange(items, 1000, 3000)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(2)
  })

  it('filters by minimum price only', () => {
    const items = [
      { id: 1, buyPrice: 500 },
      { id: 2, buyPrice: 2000 },
      { id: 3, buyPrice: 5000 }
    ]
    const filtered = filterByPriceRange(items, 1000, undefined)
    expect(filtered).toHaveLength(2)
    expect(filtered.map(item => item.id)).toEqual([2, 3])
  })

  it('filters by maximum price only', () => {
    const items = [
      { id: 1, buyPrice: 500 },
      { id: 2, buyPrice: 2000 },
      { id: 3, buyPrice: 5000 }
    ]
    const filtered = filterByPriceRange(items, undefined, 3000)
    expect(filtered).toHaveLength(2)
    expect(filtered.map(item => item.id)).toEqual([1, 2])
  })

  it('filters by GE limit requirement', () => {
    const items = [
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ]
    const mapping = new Map([
      [1, { limit: 1000 }],
      [2, { limit: 0 }], // No limit
      [3, { limit: 500 }]
    ])
    const filtered = filterByGeLimit(items, mapping)
    expect(filtered).toHaveLength(2)
    expect(filtered.map(item => item.id)).toEqual([1, 3])
  })

  it('handles empty mapping', () => {
    const items = [{ id: 1 }, { id: 2 }]
    const mapping = new Map()
    const filtered = filterByGeLimit(items, mapping)
    expect(filtered).toHaveLength(0)
  })
})
