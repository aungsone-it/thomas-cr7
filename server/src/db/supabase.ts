import { getSupabase } from '../supabase/client.js'
import type { FormulaConfig, Holiday, Result2D, Result3D, SiteSettings } from '../types.js'
import { DEFAULT_FORMULA, DEFAULT_SETTINGS } from '../types.js'
import { seedDatabase, shouldSeedMockData } from '../seed.js'
import { mergeFormula, mergeSettings, rowTo2D, rowTo3D, type DbAdapter } from './shared.js'

async function getKv<T>(key: string, fallback: T, merge: (raw: unknown) => T): Promise<T> {
  const sb = getSupabase()
  const { data, error } = await sb.from('kv_store').select('value').eq('key', key).maybeSingle()
  if (error) throw error
  return data?.value ? merge(data.value) : fallback
}

async function setKv(key: string, value: unknown): Promise<void> {
  const sb = getSupabase()
  const { error } = await sb.from('kv_store').upsert({ key, value, updated_at: new Date().toISOString() })
  if (error) throw error
}

export const supabaseAdapter: DbAdapter = {
  async initDb() {
    const sb = getSupabase()

    const { data: settingsRow } = await sb.from('kv_store').select('key').eq('key', 'settings').maybeSingle()
    if (!settingsRow) await setKv('settings', DEFAULT_SETTINGS)

    const { data: formulaRow } = await sb.from('kv_store').select('key').eq('key', 'formula').maybeSingle()
    if (!formulaRow) await setKv('formula', DEFAULT_FORMULA)

    await seedDatabase()
  },

  getSettings: () => getKv('settings', DEFAULT_SETTINGS, mergeSettings),
  saveSettings: async (settings) => {
    const merged = { ...DEFAULT_SETTINGS, ...settings }
    await setKv('settings', merged)
    return merged
  },

  getFormula: () => getKv('formula', DEFAULT_FORMULA, mergeFormula),
  saveFormula: async (formula) => {
    const merged = mergeFormula(formula)
    await setKv('formula', merged)
    return merged
  },

  async getLatest2D() {
    const { data, error } = await getSupabase()
      .from('results_2d').select('*').order('date', { ascending: false }).order('slot', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    return data ? rowTo2D(data as Record<string, unknown>) : null
  },

  async getPrevious2D() {
    const { data, error } = await getSupabase()
      .from('results_2d').select('*').order('date', { ascending: false }).order('slot', { ascending: false }).range(1, 1).maybeSingle()
    if (error) throw error
    return data ? rowTo2D(data as Record<string, unknown>) : null
  },

  async get2DHistory(limit = 50) {
    const { data, error } = await getSupabase()
      .from('results_2d').select('*').order('date', { ascending: false }).order('slot', { ascending: false }).limit(limit)
    if (error) throw error
    return (data ?? []).map((r) => rowTo2D(r as Record<string, unknown>))
  },

  async get2DByDate(date) {
    const { data, error } = await getSupabase()
      .from('results_2d').select('*').eq('date', date).order('slot', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => rowTo2D(r as Record<string, unknown>))
  },

  async getUniqueDates() {
    const { data, error } = await getSupabase().from('results_2d').select('date').order('date', { ascending: false })
    if (error) throw error
    return [...new Set((data ?? []).map((r) => r.date))]
  },

  async upsert2DResult(result) {
    const sb = getSupabase()
    const { error } = await sb.from('results_2d').upsert({
      date: result.date,
      session: result.session,
      slot: result.slot,
      number: result.number,
      set_val: result.set,
      value_val: result.value,
      set_index: result.setIndex,
    }, { onConflict: 'date,slot' })
    if (error) throw error
    const { data } = await sb.from('results_2d').select('*').eq('date', result.date).eq('slot', result.slot).single()
    return rowTo2D(data as Record<string, unknown>)
  },

  async getLatest3D() {
    const { data, error } = await getSupabase()
      .from('results_3d').select('*').order('date', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    return data ? rowTo3D(data as Record<string, unknown>) : null
  },

  async get3DHistory(limit = 50) {
    const { data, error } = await getSupabase()
      .from('results_3d').select('*').order('date', { ascending: false }).limit(limit)
    if (error) throw error
    return (data ?? []).map((r) => rowTo3D(r as Record<string, unknown>))
  },

  async upsert3DResult(result) {
    const sb = getSupabase()
    const { error } = await sb.from('results_3d').upsert({
      date: result.date,
      number: result.number,
      draw_day: result.drawDay,
    }, { onConflict: 'date' })
    if (error) throw error
    const { data } = await sb.from('results_3d').select('*').eq('date', result.date).single()
    return rowTo3D(data as Record<string, unknown>)
  },

  async getHolidays() {
    const { data, error } = await getSupabase().from('holidays').select('date, name, name_mm').order('date', { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => ({ date: r.date, name: r.name, nameMm: r.name_mm }))
  },

  async upsertHoliday(holiday) {
    const { error } = await getSupabase().from('holidays').upsert({
      date: holiday.date,
      name: holiday.name,
      name_mm: holiday.nameMm,
    }, { onConflict: 'date' })
    if (error) throw error
  },

  async getStats() {
    const sb = getSupabase()
    const { count: totalDraws } = await sb.from('results_2d').select('*', { count: 'exact', head: true })
    const { data: dates } = await sb.from('results_2d').select('date')
    const unique = new Set((dates ?? []).map((d) => d.date))
    const { data: latest } = await sb.from('results_2d').select('date').order('date', { ascending: false }).limit(1).maybeSingle()
    return {
      totalDraws: totalDraws ?? 0,
      totalDays: unique.size,
      latestDate: latest?.date ?? null,
    }
  },
}
