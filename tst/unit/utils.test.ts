import { describe, it, expect } from 'vitest'
import { formatInt, formatPct, parsePriceInput, parseRoiInput } from '../../src/lib/utils.js'

describe('lib/utils', () => {
  describe('formatInt', () => {
    it('formats integers with commas', () => {
      expect(formatInt(1000)).toBe('1,000')
      expect(formatInt(1000000)).toBe('1,000,000')
      expect(formatInt(0)).toBe('0')
    })
  })

  describe('formatPct', () => {
    it('formats percentages to 2 decimals', () => {
      expect(formatPct(0.12345)).toBe('0.12%')
      expect(formatPct(1)).toBe('1.00%')
      expect(formatPct(85.85)).toBe('85.85%')
      expect(formatPct(0)).toBe('0.00%')
    })
  })

  describe('parsePriceInput', () => {
    it('parses basic numbers', () => {
      expect(parsePriceInput('1000')).toBe(1000)
      expect(parsePriceInput('1,000')).toBe(1000)
    })

    it('parses suffixes', () => {
      expect(parsePriceInput('1k')).toBe(1000)
      expect(parsePriceInput('1m')).toBe(1000000)
      expect(parsePriceInput('1b')).toBe(1000000000)
    })

    it('handles mixed format prices', () => {
      expect(parsePriceInput('1.5m')).toBe(1500000)
      expect(parsePriceInput('2.5k')).toBe(2500)
    })

    it('handles very large numbers', () => {
      expect(parsePriceInput('999b')).toBe(999000000000)
    })

    it('handles invalid input', () => {
      expect(parsePriceInput('invalid')).toBeNull()
      expect(parsePriceInput('')).toBeNull()
    })
  })

  describe('parseRoiInput', () => {
    it('parses percentage input', () => {
      expect(parseRoiInput('50')).toBe(50)
      expect(parseRoiInput('150')).toBe(150)
      expect(parseRoiInput('0')).toBe(0)
    })

    it('handles decimal percentages', () => {
      expect(parseRoiInput('12.5')).toBe(12.5)
    })

    it('handles invalid input', () => {
      expect(parseRoiInput('invalid')).toBeNull()
      expect(parseRoiInput('')).toBeNull()
    })

    it('enforces bounds 0..1000', () => {
      expect(parseRoiInput('-1')).toBeNull()
      expect(parseRoiInput('1001')).toBeNull()
      expect(parseRoiInput('1000')).toBe(1000)
    })
  })
})
