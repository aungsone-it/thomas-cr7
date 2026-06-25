import { isSupabaseEnabled } from '../supabase/client.js'
import { sqliteAdapter } from './sqlite.js'
import { supabaseAdapter } from './supabase.js'
import type { DbAdapter } from './shared.js'

const adapter: DbAdapter = isSupabaseEnabled() ? supabaseAdapter : sqliteAdapter

export function getDbProvider(): 'supabase' | 'sqlite' {
  return isSupabaseEnabled() ? 'supabase' : 'sqlite'
}

export const initDb = () => adapter.initDb()
export const getSettings = () => adapter.getSettings()
export const saveSettings = (s: Parameters<DbAdapter['saveSettings']>[0]) => adapter.saveSettings(s)
export const getFormula = () => adapter.getFormula()
export const saveFormula = (f: Parameters<DbAdapter['saveFormula']>[0]) => adapter.saveFormula(f)
export const getLatest2D = () => adapter.getLatest2D()
export const getPrevious2D = () => adapter.getPrevious2D()
export const get2DHistory = (limit?: number) => adapter.get2DHistory(limit)
export const get2DByDate = (date: string) => adapter.get2DByDate(date)
export const getUniqueDates = () => adapter.getUniqueDates()
export const upsert2DResult = (r: Parameters<DbAdapter['upsert2DResult']>[0]) => adapter.upsert2DResult(r)
export const getLatest3D = () => adapter.getLatest3D()
export const get3DHistory = (limit?: number) => adapter.get3DHistory(limit)
export const upsert3DResult = (r: Parameters<DbAdapter['upsert3DResult']>[0]) => adapter.upsert3DResult(r)
export const getHolidays = () => adapter.getHolidays()
export const upsertHoliday = (h: Parameters<DbAdapter['upsertHoliday']>[0]) => adapter.upsertHoliday(h)
export const getStats = () => adapter.getStats()
