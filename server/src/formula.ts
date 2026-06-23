import type { FormulaConfig, SetIndexData } from './types.js'
import { getMMTParts } from './time.js'

export function apply2DFormula(
  setIndex: SetIndexData,
  formula: FormulaConfig,
): { number: string; set: number; value: number } {
  const { value, change } = setIndex
  const whole = Math.floor(value)
  const decimal = Math.round((value - whole) * 100)

  switch (formula.twoD.method) {
    case 'index_decimal_two':
      return {
        number: String(decimal).padStart(2, '0'),
        set: whole,
        value: decimal,
      }
    case 'index_whole_last_two': {
      const lastTwo = Math.abs(whole) % 100
      return {
        number: String(lastTwo).padStart(2, '0'),
        set: whole,
        value: decimal,
      }
    }
    case 'change_last_two':
    default: {
      const changeStr = Math.abs(change).toFixed(2).replace('.', '')
      const number = changeStr.slice(-2).padStart(2, '0')
      return {
        number,
        set: whole,
        value: decimal,
      }
    }
  }
}

export function apply3DFormula(
  setIndex: SetIndexData,
  formula: FormulaConfig,
): string {
  const { value, change } = setIndex
  const whole = Math.floor(value)
  const decimal = Math.round((value - whole) * 100)

  switch (formula.threeD.method) {
    case 'change_three_digits': {
      const digits = Math.abs(change).toFixed(2).replace('.', '').replace('-', '')
      return digits.slice(-3).padStart(3, '0')
    }
    case 'index_three_digits':
    default: {
      const combined = `${whole}${String(decimal).padStart(2, '0')}`
      return combined.slice(-3).padStart(3, '0')
    }
  }
}

export function getDrawDay(date: Date): number {
  return getMMTParts(date).day <= 15 ? 1 : 16
}

export function is3DDrawDay(date: Date): boolean {
  const d = getMMTParts(date).day
  return d === 1 || d === 16
}
