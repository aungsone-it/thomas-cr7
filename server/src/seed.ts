import { getSetMode } from './setClient.js'
import { isSupabaseEnabled } from './supabase/client.js'
import { sqliteAdapter } from './db/sqlite.js'
import { supabaseAdapter } from './db/supabase.js'

export function shouldSeedMockData(): boolean {
  if (process.env.SEED_DATA === 'mock') return true
  if (process.env.SEED_DATA === 'none') return false
  return getSetMode() === 'mock'
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const MOCK_2D = [
  { date: daysAgo(0), session: 'morning' as const, slot: '12:01' as const, number: '47', set: 1284, value: 56, setIndex: 1284.56 },
  { date: daysAgo(0), session: 'morning' as const, slot: '09:30' as const, number: '23', set: 1272, value: 18, setIndex: 1272.18 },
  { date: daysAgo(1), session: 'evening' as const, slot: '16:30' as const, number: '89', set: 1268, value: 92, setIndex: 1268.92 },
  { date: daysAgo(1), session: 'evening' as const, slot: '14:00' as const, number: '05', set: 1255, value: 44, setIndex: 1255.44 },
  { date: daysAgo(1), session: 'morning' as const, slot: '12:01' as const, number: '62', set: 1241, value: 78, setIndex: 1241.78 },
  { date: daysAgo(1), session: 'morning' as const, slot: '09:30' as const, number: '31', set: 1239, value: 15, setIndex: 1239.15 },
  { date: daysAgo(2), session: 'evening' as const, slot: '16:30' as const, number: '74', set: 1228, value: 63, setIndex: 1228.63 },
  { date: daysAgo(2), session: 'evening' as const, slot: '14:00' as const, number: '18', set: 1215, value: 29, setIndex: 1215.29 },
  { date: daysAgo(2), session: 'morning' as const, slot: '12:01' as const, number: '56', set: 1208, value: 41, setIndex: 1208.41 },
  { date: daysAgo(2), session: 'morning' as const, slot: '09:30' as const, number: '92', set: 1196, value: 87, setIndex: 1196.87 },
  { date: daysAgo(3), session: 'evening' as const, slot: '16:30' as const, number: '33', set: 1184, value: 52, setIndex: 1184.52 },
  { date: daysAgo(3), session: 'morning' as const, slot: '12:01' as const, number: '08', set: 1172, value: 96, setIndex: 1172.96 },
  { date: daysAgo(4), session: 'evening' as const, slot: '16:30' as const, number: '41', set: 1160, value: 23, setIndex: 1160.23 },
  { date: daysAgo(4), session: 'morning' as const, slot: '09:30' as const, number: '67', set: 1148, value: 71, setIndex: 1148.71 },
]

const MOCK_3D = [
  { date: daysAgo(0), number: '847', drawDay: 1 },
  { date: daysAgo(1), number: '523', drawDay: 16 },
  { date: daysAgo(2), number: '196', drawDay: 1 },
  { date: daysAgo(3), number: '734', drawDay: 16 },
  { date: daysAgo(4), number: '058', drawDay: 1 },
]

const MOCK_HOLIDAYS = [
  { date: '2026-04-13', name: 'Thingyan (Water Festival)', nameMm: 'သင်္ကြန်' },
  { date: '2026-04-14', name: 'Thingyan (Water Festival)', nameMm: 'သင်္ကြန်' },
  { date: '2026-04-17', name: 'Myanmar New Year', nameMm: 'နှစ်ဆန်းတစ်ရက်' },
  { date: '2026-07-19', name: 'Martyrs Day', nameMm: 'အာဇာနည်နေ့' },
  { date: '2026-12-25', name: 'Christmas Day', nameMm: 'ခရစ္စမတ်နေ့' },
]

export async function seedDatabase(): Promise<void> {
  const db = isSupabaseEnabled() ? supabaseAdapter : sqliteAdapter

  for (const h of MOCK_HOLIDAYS) await db.upsertHoliday(h)

  if (!shouldSeedMockData()) {
    console.log('[seed] Real SET mode — holidays loaded, no mock lottery numbers')
    return
  }

  console.log('[seed] Inserting demo lottery data (SET_MODE=mock)')
  for (const r of MOCK_2D) await db.upsert2DResult(r)
  for (const r of MOCK_3D) await db.upsert3DResult(r)
}
