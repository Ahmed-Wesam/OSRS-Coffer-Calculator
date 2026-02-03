import { describe, it, expect } from 'vitest'

// Mock the ROI calculation function from the App component
function calculateROI(item: { buyPrice: number; officialGePrice: number; cofferValue: number; offerPrice?: number }): number {
  if (item.buyPrice <= 0 || item.officialGePrice <= 0 || item.cofferValue <= 0) {
    return 0
  }
  const profit = item.cofferValue - (item.offerPrice || item.buyPrice)
  const roi = profit / (item.offerPrice || item.buyPrice)
  return roi > 0 ? roi : 0
}

describe('ROI Calculation', () => {
  it('calculates ROI correctly for profitable items', () => {
    const item = {
      buyPrice: 1000,
      officialGePrice: 2000,
      cofferValue: 3000,
      offerPrice: 1000
    }
    expect(calculateROI(item)).toBe(2.0) // 200% ROI
  })

  it('calculates ROI using offerPrice when available', () => {
    const item = {
      buyPrice: 1000,
      officialGePrice: 2000,
      cofferValue: 3000,
      offerPrice: 800
    }
    expect(calculateROI(item)).toBe(2.75) // (3000-800)/800 = 2.75
  })

  it('returns 0 ROI for unprofitable items', () => {
    const item = {
      buyPrice: 2000,
      officialGePrice: 1000,
      cofferValue: 1500,
      offerPrice: 2000
    }
    expect(calculateROI(item)).toBe(0)
  })

  it('returns 0 ROI for zero or negative values', () => {
    const item1 = {
      buyPrice: 0,
      officialGePrice: 2000,
      cofferValue: 3000,
      offerPrice: 0
    }
    const item2 = {
      buyPrice: -1000,
      officialGePrice: 2000,
      cofferValue: 3000,
      offerPrice: -1000
    }
    expect(calculateROI(item1)).toBe(0)
    expect(calculateROI(item2)).toBe(0)
  })

  it('returns 0 ROI for zero coffer value', () => {
    const item = {
      buyPrice: 1000,
      officialGePrice: 2000,
      cofferValue: 0,
      offerPrice: 1000
    }
    expect(calculateROI(item)).toBe(0)
  })
})
