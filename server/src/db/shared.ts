import type { FormulaConfig, Holiday, Result2D, Result3D, SiteSettings } from '../types.js'
import { DEFAULT_FORMULA, DEFAULT_SETTINGS } from '../types.js'

export function rowTo2D(row: Record<string, unknown>): Result2D {
  return {
    id: String(row.id),
    date: String(row.date),
    session: row.session as Result2D['session'],
    slot: row.slot as Result2D['slot'],
    number: String(row.number),
    set: Number(row.set_val),
    value: Number(row.value_val),
    setIndex: Number(row.set_index),
  }
}

export function rowTo3D(row: Record<string, unknown>): Result3D {
  return {
    id: String(row.id),
    date: String(row.date),
    number: String(row.number),
    drawDay: Number(row.draw_day),
  }
}

export function mergeSettings(raw: unknown): SiteSettings {
  if (typeof raw === 'string') {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  }
  return { ...DEFAULT_SETTINGS, ...(raw as SiteSettings) }
}

export function mergeFormula(raw: unknown): FormulaConfig {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  return {
    ...DEFAULT_FORMULA,
    ...(parsed as FormulaConfig),
    twoD: { ...DEFAULT_FORMULA.twoD, ...(parsed as FormulaConfig).twoD },
    threeD: { ...DEFAULT_FORMULA.threeD, ...(parsed as FormulaConfig).threeD },
  }
}

export type DbAdapter = {
  initDb(): Promise<void>
  getSettings(): Promise<SiteSettings>
  saveSettings(settings: SiteSettings): Promise<SiteSettings>
  getFormula(): Promise<FormulaConfig>
  saveFormula(formula: FormulaConfig): Promise<FormulaConfig>
  getLatest2D(): Promise<Result2D | null>
  getPrevious2D(): Promise<Result2D | null>
  get2DHistory(limit?: number): Promise<Result2D[]>
  get2DByDate(date: string): Promise<Result2D[]>
  getUniqueDates(): Promise<string[]>
  upsert2DResult(result: Omit<Result2D, 'id'>): Promise<Result2D>
  getLatest3D(): Promise<Result3D | null>
  get3DHistory(limit?: number): Promise<Result3D[]>
  upsert3DResult(result: Omit<Result3D, 'id'>): Promise<Result3D>
  getHolidays(): Promise<Holiday[]>
  upsertHoliday(holiday: Holiday): Promise<void>
  getStats(): Promise<{ totalDraws: number; totalDays: number; latestDate: string | null }>
}
