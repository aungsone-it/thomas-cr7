import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import type { FormulaConfig, Holiday, Result2D, Result3D, SiteSettings } from '../types.js'
import { DEFAULT_FORMULA, DEFAULT_SETTINGS } from '../types.js'
import { seedDatabase } from '../seed.js'
import { mergeFormula, mergeSettings, rowTo2D, rowTo3D, type DbAdapter } from './shared.js'

const dbPath = process.env.DB_PATH ?? './data/lottery.db'
mkdirSync(dirname(dbPath), { recursive: true })
const db = new DatabaseSync(dbPath)

export const sqliteAdapter: DbAdapter = {
  async initDb() {
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

    if (!db.prepare('SELECT value FROM kv_store WHERE key = ?').get('settings')) {
      db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)').run('settings', JSON.stringify(DEFAULT_SETTINGS))
    }
    if (!db.prepare('SELECT value FROM kv_store WHERE key = ?').get('formula')) {
      db.prepare('INSERT INTO kv_store (key, value) VALUES (?, ?)').run('formula', JSON.stringify(DEFAULT_FORMULA))
    }
    await seedDatabase()
  },

  async getSettings() {
    const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('settings') as { value: string } | undefined
    return row ? mergeSettings(row.value) : DEFAULT_SETTINGS
  },

  async saveSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings }
    db.prepare(
      `INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run('settings', JSON.stringify(merged))
    return merged
  },

  async getFormula() {
    const row = db.prepare('SELECT value FROM kv_store WHERE key = ?').get('formula') as { value: string } | undefined
    return row ? mergeFormula(row.value) : DEFAULT_FORMULA
  },

  async saveFormula(formula) {
    const merged = mergeFormula(formula)
    db.prepare(
      `INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run('formula', JSON.stringify(merged))
    return merged
  },

  async getLatest2D() {
    const row = db.prepare('SELECT * FROM results_2d ORDER BY date DESC, slot DESC LIMIT 1').get()
    return row ? rowTo2D(row as Record<string, unknown>) : null
  },

  async getPrevious2D() {
    const row = db.prepare('SELECT * FROM results_2d ORDER BY date DESC, slot DESC LIMIT 1 OFFSET 1').get()
    return row ? rowTo2D(row as Record<string, unknown>) : null
  },

  async get2DHistory(limit = 50) {
    const rows = db.prepare('SELECT * FROM results_2d ORDER BY date DESC, slot DESC LIMIT ?').all(limit)
    return rows.map((r) => rowTo2D(r as Record<string, unknown>))
  },

  async get2DByDate(date) {
    const rows = db.prepare('SELECT * FROM results_2d WHERE date = ? ORDER BY slot ASC').all(date)
    return rows.map((r) => rowTo2D(r as Record<string, unknown>))
  },

  async getUniqueDates() {
    const rows = db.prepare('SELECT DISTINCT date FROM results_2d ORDER BY date DESC').all() as { date: string }[]
    return rows.map((r) => r.date)
  },

  async upsert2DResult(result) {
    db.prepare(`
      INSERT INTO results_2d (date, session, slot, number, set_val, value_val, set_index)
      VALUES (@date, @session, @slot, @number, @set, @value, @setIndex)
      ON CONFLICT(date, slot) DO UPDATE SET
        number = excluded.number, set_val = excluded.set_val,
        value_val = excluded.value_val, set_index = excluded.set_index
    `).run(result)
    const row = db.prepare('SELECT * FROM results_2d WHERE date = ? AND slot = ?').get(result.date, result.slot) as Record<string, unknown>
    return rowTo2D(row)
  },

  async getLatest3D() {
    const row = db.prepare('SELECT * FROM results_3d ORDER BY date DESC LIMIT 1').get()
    return row ? rowTo3D(row as Record<string, unknown>) : null
  },

  async get3DHistory(limit = 50) {
    const rows = db.prepare('SELECT * FROM results_3d ORDER BY date DESC LIMIT ?').all(limit)
    return rows.map((r) => rowTo3D(r as Record<string, unknown>))
  },

  async upsert3DResult(result) {
    db.prepare(`
      INSERT INTO results_3d (date, number, draw_day) VALUES (@date, @number, @drawDay)
      ON CONFLICT(date) DO UPDATE SET number = excluded.number, draw_day = excluded.draw_day
    `).run({ date: result.date, number: result.number, drawDay: result.drawDay })
    const row = db.prepare('SELECT * FROM results_3d WHERE date = ?').get(result.date) as Record<string, unknown>
    return rowTo3D(row)
  },

  async getHolidays() {
    const rows = db.prepare('SELECT date, name, name_mm FROM holidays ORDER BY date ASC').all() as {
      date: string; name: string; name_mm: string
    }[]
    return rows.map((r) => ({ date: r.date, name: r.name, nameMm: r.name_mm }))
  },

  async upsertHoliday(holiday) {
    db.prepare(`
      INSERT INTO holidays (date, name, name_mm) VALUES (@date, @name, @name_mm)
      ON CONFLICT(date) DO UPDATE SET name = excluded.name, name_mm = excluded.name_mm
    `).run({ date: holiday.date, name: holiday.name, name_mm: holiday.nameMm })
  },

  async getStats() {
    const totalDraws = (db.prepare('SELECT COUNT(*) as c FROM results_2d').get() as { c: number }).c
    const totalDays = (db.prepare('SELECT COUNT(DISTINCT date) as c FROM results_2d').get() as { c: number }).c
    const latest = db.prepare('SELECT date FROM results_2d ORDER BY date DESC LIMIT 1').get() as { date: string } | undefined
    return { totalDraws, totalDays, latestDate: latest?.date ?? null }
  },
}
