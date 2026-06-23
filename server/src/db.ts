import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import type { FormulaConfig, Holiday, Result2D, Result3D, SiteSettings } from './types.js'
import { DEFAULT_FORMULA, DEFAULT_SETTINGS } from './types.js'
import { seedDatabase } from './seed.js'

const dbPath = process.env.DB_PATH ?? './data/lottery.db'
mkdirSync(dirname(dbPath), { recursive: true })

export const db = new DatabaseSync(dbPath)

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS results_2d (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      session TEXT NOT NULL,
      slot TEXT NOT NULL,
      number TEXT NOT NULL,
      set_val INTEGER NOT NULL,
      value_val INTEGER NOT NULL,
      set_index REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date, slot)
    );

    CREATE TABLE IF NOT EXISTS results_3d (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      number TEXT NOT NULL,
      draw_day INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_mm TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_2d_date ON results_2d(date DESC);
  `)

  const settings = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('settings')
  if (!settings) {
    db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)').run(
      'settings',
      JSON.stringify(DEFAULT_SETTINGS),
    )
  }

  const formula = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('formula')
  if (!formula) {
    db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)').run(
      'formula',
      JSON.stringify(DEFAULT_FORMULA),
    )
  }

  const count2d = db.prepare('SELECT COUNT(*) as c FROM results_2d').get() as { c: number }
  if (count2d.c === 0) seedDatabase()
}

export function getSettings(): SiteSettings {
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('settings') as
    | { value: string }
    | undefined
  return row ? { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) } : DEFAULT_SETTINGS
}

export function saveSettings(settings: SiteSettings): SiteSettings {
  const merged = { ...DEFAULT_SETTINGS, ...settings }
  db.prepare(
    `INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run('settings', JSON.stringify(merged))
  return merged
}

export function getFormula(): FormulaConfig {
  const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('formula') as
    | { value: string }
    | undefined
  return row ? { ...DEFAULT_FORMULA, ...JSON.parse(row.value) } : DEFAULT_FORMULA
}

export function saveFormula(formula: FormulaConfig): FormulaConfig {
  const merged = {
    ...DEFAULT_FORMULA,
    ...formula,
    twoD: { ...DEFAULT_FORMULA.twoD, ...formula.twoD },
    threeD: { ...DEFAULT_FORMULA.threeD, ...formula.threeD },
  }
  db.prepare(
    `INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run('formula', JSON.stringify(merged))
  return merged
}

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

export function getLatest2D(): Result2D | null {
  const row = db.prepare('SELECT * FROM results_2d ORDER BY date DESC, slot DESC LIMIT 1').get()
  return row ? rowTo2D(row as Record<string, unknown>) : null
}

export function getPrevious2D(): Result2D | null {
  const row = db.prepare('SELECT * FROM results_2d ORDER BY date DESC, slot DESC LIMIT 1 OFFSET 1').get()
  return row ? rowTo2D(row as Record<string, unknown>) : null
}

export function get2DHistory(limit = 50): Result2D[] {
  const rows = db.prepare('SELECT * FROM results_2d ORDER BY date DESC, slot DESC LIMIT ?').all(limit)
  return rows.map((r) => rowTo2D(r as Record<string, unknown>))
}

export function get2DByDate(date: string): Result2D[] {
  const rows = db.prepare('SELECT * FROM results_2d WHERE date = ? ORDER BY slot ASC').all(date)
  return rows.map((r) => rowTo2D(r as Record<string, unknown>))
}

export function getUniqueDates(): string[] {
  const rows = db.prepare('SELECT DISTINCT date FROM results_2d ORDER BY date DESC').all() as { date: string }[]
  return rows.map((r) => r.date)
}

export function upsert2DResult(result: Omit<Result2D, 'id'>): Result2D {
  db.prepare(`
    INSERT INTO results_2d (date, session, slot, number, set_val, value_val, set_index)
    VALUES (@date, @session, @slot, @number, @set, @value, @setIndex)
    ON CONFLICT(date, slot) DO UPDATE SET
      number = excluded.number,
      set_val = excluded.set_val,
      value_val = excluded.value_val,
      set_index = excluded.set_index
  `).run({
    date: result.date,
    session: result.session,
    slot: result.slot,
    number: result.number,
    set: result.set,
    value: result.value,
    setIndex: result.setIndex,
  })

  const row = db.prepare('SELECT * FROM results_2d WHERE date = ? AND slot = ?').get(result.date, result.slot) as Record<string, unknown>
  return rowTo2D(row)
}

export function getLatest3D(): Result3D | null {
  const row = db.prepare('SELECT * FROM results_3d ORDER BY date DESC LIMIT 1').get()
  return row ? rowTo3D(row as Record<string, unknown>) : null
}

export function get3DHistory(limit = 50): Result3D[] {
  const rows = db.prepare('SELECT * FROM results_3d ORDER BY date DESC LIMIT ?').all(limit)
  return rows.map((r) => rowTo3D(r as Record<string, unknown>))
}

export function upsert3DResult(result: Omit<Result3D, 'id'>): Result3D {
  db.prepare(`
    INSERT INTO results_3d (date, number, draw_day)
    VALUES (@date, @number, @drawDay)
    ON CONFLICT(date) DO UPDATE SET number = excluded.number, draw_day = excluded.draw_day
  `).run({ date: result.date, number: result.number, drawDay: result.drawDay })

  const row = db.prepare('SELECT * FROM results_3d WHERE date = ?').get(result.date) as Record<string, unknown>
  return rowTo3D(row)
}

export function getHolidays(): Holiday[] {
  const rows = db.prepare('SELECT date, name, name_mm FROM holidays ORDER BY date ASC').all() as {
    date: string
    name: string
    name_mm: string
  }[]
  return rows.map((r) => ({ date: r.date, name: r.name, nameMm: r.name_mm }))
}

export function upsertHoliday(holiday: Holiday): void {
  db.prepare(`
    INSERT INTO holidays (date, name, name_mm) VALUES (@date, @name, @name_mm)
    ON CONFLICT(date) DO UPDATE SET name = excluded.name, name_mm = excluded.name_mm
  `).run({ date: holiday.date, name: holiday.name, name_mm: holiday.nameMm })
}

export function getStats(): { totalDraws: number; totalDays: number; latestDate: string | null } {
  const totalDraws = (db.prepare('SELECT COUNT(*) as c FROM results_2d').get() as { c: number }).c
  const totalDays = (db.prepare('SELECT COUNT(DISTINCT date) as c FROM results_2d').get() as { c: number }).c
  const latest = db.prepare('SELECT date FROM results_2d ORDER BY date DESC LIMIT 1').get() as { date: string } | undefined
  return { totalDraws, totalDays, latestDate: latest?.date ?? null }
}
