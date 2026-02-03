import { describe, it, expect } from 'vitest'
import { parsePriceInput, parseRoiInput } from './lib/utils.js'

describe('Input Parsing Functions', () => {
  describe('parsePriceInput', () => {
    it('should parse regular numbers', () => {
      expect(parsePriceInput('1000')).toBe(1000)
      expect(parsePriceInput('1,000')).toBe(1000)
      expect(parsePriceInput('12345')).toBe(12345)
    })

    it('should parse k suffix', () => {
      expect(parsePriceInput('1k')).toBe(1000)
      expect(parsePriceInput('100k')).toBe(100000)
      expect(parsePriceInput('1.5k')).toBe(1500)
    })

    it('should parse m suffix', () => {
      expect(parsePriceInput('1m')).toBe(1000000)
      expect(parsePriceInput('2.5m')).toBe(2500000)
      expect(parsePriceInput('10m')).toBe(10000000)
    })

    it('should parse b suffix', () => {
      expect(parsePriceInput('1b')).toBe(1000000000)
      expect(parsePriceInput('0.5b')).toBe(500000000)
    })

    it('should handle empty input', () => {
      expect(parsePriceInput('')).toBe(null)
      expect(parsePriceInput('   ')).toBe(null)
    })

    it('should handle invalid input', () => {
      expect(parsePriceInput('abc')).toBe(null)
      expect(parsePriceInput('1x')).toBe(null)
      expect(parsePriceInput('1.2.3')).toBe(null)
    })

    it('should handle case insensitive', () => {
      expect(parsePriceInput('1K')).toBe(1000)
      expect(parsePriceInput('1M')).toBe(1000000)
      expect(parsePriceInput('1B')).toBe(1000000000)
    })
  })

  describe('parseRoiInput', () => {
    it('should parse valid ROI percentages', () => {
      expect(parseRoiInput('5')).toBe(5)
      expect(parseRoiInput('10.5')).toBe(10.5)
      expect(parseRoiInput('0')).toBe(0)
    })

    it('should handle commas', () => {
      expect(parseRoiInput('1,000')).toBe(1000)
      expect(parseRoiInput('100.5')).toBe(100.5)
    })

    it('should reject negative values', () => {
      expect(parseRoiInput('-1')).toBe(null)
      expect(parseRoiInput('-10')).toBe(null)
    })

    it('should reject values over 1000%', () => {
      expect(parseRoiInput('1001')).toBe(null)
      expect(parseRoiInput('5000')).toBe(null)
    })

    it('should handle empty input', () => {
      expect(parseRoiInput('')).toBe(null)
      expect(parseRoiInput('   ')).toBe(null)
    })

    it('should handle invalid input', () => {
      expect(parseRoiInput('abc')).toBe(null)
      expect(parseRoiInput('1.2.3')).toBe(null)
      expect(parseRoiInput('NaN')).toBe(null)
    })

    it('should handle edge cases', () => {
      expect(parseRoiInput('0')).toBe(0)
      expect(parseRoiInput('1000')).toBe(1000)
      expect(parseRoiInput('999.9')).toBe(999.9)
    })
  })
})
