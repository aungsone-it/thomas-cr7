import type { DrawSession, DrawSlot } from './types.js'

const THAISTOCK2D_RESULTS_URL = 'https://api.thaistock2d.com/2d_result'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

type Importable2D = {
  date: string
  session: DrawSession
  slot: DrawSlot
  number: string
  set: number
  value: number
  setIndex: number
}

interface ThaiStock2DEntry {
  time?: string
  set?: string
  twod?: string
}

interface ThaiStock2DDay {
  date?: string
  child?: ThaiStock2DEntry[]
}

function parseSetIndex(raw: unknown): number | null {
  const n = Number(String(raw ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

function toDrawSlot(time: string): DrawSlot | null {
  if (time === '11:00:00') return '09:30'
  if (time === '12:01:00') return '12:01'
  if (time === '15:00:00') return '14:00'
  if (time === '16:30:00') return '16:30'
  return null
}

function toSession(slot: DrawSlot): DrawSession {
  return slot === '09:30' || slot === '12:01' ? 'morning' : 'evening'
}

export async function fetchRecent2DForBootstrap(limitDays = 10): Promise<Importable2D[]> {
  const res = await fetch(THAISTOCK2D_RESULTS_URL, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(12_000),
  })
  if (!res.ok) throw new Error(`ThaiStock2D /2d_result error: ${res.status}`)

  const payload = (await res.json()) as ThaiStock2DDay[]
  const days = Array.isArray(payload) ? payload.slice(0, limitDays) : []
  const rows: Importable2D[] = []

  for (const day of days) {
    if (!day?.date || !Array.isArray(day.child)) continue
    for (const item of day.child) {
      const slot = toDrawSlot(String(item?.time ?? ''))
      const setIndex = parseSetIndex(item?.set)
      const twod = String(item?.twod ?? '').trim()
      if (!slot || setIndex == null || twod.length === 0) continue

      rows.push({
        date: day.date,
        session: toSession(slot),
        slot,
        number: twod.padStart(2, '0'),
        set: Math.trunc(setIndex),
        value: Math.round((setIndex - Math.trunc(setIndex)) * 100),
        setIndex,
      })
    }
  }

  return rows
}
