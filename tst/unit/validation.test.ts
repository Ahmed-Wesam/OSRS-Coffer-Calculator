import { describe, it, expect } from 'vitest'

// Mock validation functions
function validateItem(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return false
  
  const obj = item as Record<string, unknown>
  return (
    typeof obj.id === 'number' && 
    Number.isInteger(obj.id) &&
    obj.id > 0 &&
    typeof obj.name === 'string' && 
    obj.name.trim().length > 0 &&
    typeof obj.buyPrice === 'number' && 
    Number.isFinite(obj.buyPrice) && 
    obj.buyPrice > 0 &&
    typeof obj.officialGePrice === 'number' && 
    Number.isFinite(obj.officialGePrice) && 
    obj.officialGePrice > 0
  )
}

function validatePriceInput(input: string): boolean {
  const num = parseFloat(input.replace(/,/g, ''))
  return !isNaN(num) && num > 0 && num <= 10000000000 // Max 10B
}

function validateRoiInput(input: string): boolean {
  const num = parseFloat(input)
  return !isNaN(num) && num >= 0 && num <= 1000
}

describe('Data Validation', () => {
  it('validates complete item data structure', () => {
    const validItem = {
      id: 4151,
      name: 'Dragon dagger',
      buyPrice: 50000,
      officialGePrice: 60000,
      cofferValue: 75000
    }
    expect(validateItem(validItem)).toBe(true)
  })

  it('rejects invalid item id', () => {
    const invalidItems = [
      { id: -1, name: 'Item', buyPrice: 1000, officialGePrice: 2000 },
      { id: 0, name: 'Item', buyPrice: 1000, officialGePrice: 2000 },
      { id: 1.5, name: 'Item', buyPrice: 1000, officialGePrice: 2000 },
      { id: 'invalid', name: 'Item', buyPrice: 1000, officialGePrice: 2000 }
    ]
    
    invalidItems.forEach(item => {
      expect(validateItem(item)).toBe(false)
    })
  })

  it('rejects invalid item name', () => {
    const invalidItems = [
      { id: 4151, name: '', buyPrice: 1000, officialGePrice: 2000 },
      { id: 4151, name: '   ', buyPrice: 1000, officialGePrice: 2000 },
      { id: 4151, name: null, buyPrice: 1000, officialGePrice: 2000 },
      { id: 4151, name: undefined, buyPrice: 1000, officialGePrice: 2000 }
    ]
    
    invalidItems.forEach(item => {
      expect(validateItem(item)).toBe(false)
    })
  })

  it('rejects invalid prices', () => {
    const invalidItems = [
      { id: 4151, name: 'Item', buyPrice: -1000, officialGePrice: 2000 },
      { id: 4151, name: 'Item', buyPrice: 0, officialGePrice: 2000 },
      { id: 4151, name: 'Item', buyPrice: Infinity, officialGePrice: 2000 },
      { id: 4151, name: 'Item', buyPrice: NaN, officialGePrice: 2000 }
    ]
    
    invalidItems.forEach(item => {
      expect(validateItem(item)).toBe(false)
    })
  })

  it('validates price input strings', () => {
    const validInputs = ['1000', '1,000', '100000', '10000000']
    validInputs.forEach(input => {
      expect(validatePriceInput(input)).toBe(true)
    })
  })

  it('rejects invalid price input strings', () => {
    const invalidInputs = ['-1000', '0', 'invalid', '1.7976931348623159e+308', '10000000001']
    invalidInputs.forEach(input => {
      expect(validatePriceInput(input)).toBe(false)
    })
  })

  it('validates ROI input strings', () => {
    const validInputs = ['0', '50', '100', '999', '1000']
    validInputs.forEach(input => {
      expect(validateRoiInput(input)).toBe(true)
    })
  })

  it('rejects invalid ROI input strings', () => {
    const invalidInputs = ['-1', '1001', 'invalid']
    invalidInputs.forEach(input => {
      expect(validateRoiInput(input)).toBe(false)
    })
  })
})
