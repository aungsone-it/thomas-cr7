import { db } from './db.js'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const MOCK_2D = [
  { date: daysAgo(0), session: 'morning', slot: '12:01', number: '47', set: 1284, value: 56, setIndex: 1284.56 },
  { date: daysAgo(0), session: 'morning', slot: '09:30', number: '23', set: 1272, value: 18, setIndex: 1272.18 },
  { date: daysAgo(1), session: 'evening', slot: '16:30', number: '89', set: 1268, value: 92, setIndex: 1268.92 },
  { date: daysAgo(1), session: 'evening', slot: '14:00', number: '05', set: 1255, value: 44, setIndex: 1255.44 },
  { date: daysAgo(1), session: 'morning', slot: '12:01', number: '62', set: 1241, value: 78, setIndex: 1241.78 },
  { date: daysAgo(1), session: 'morning', slot: '09:30', number: '31', set: 1239, value: 15, setIndex: 1239.15 },
  { date: daysAgo(2), session: 'evening', slot: '16:30', number: '74', set: 1228, value: 63, setIndex: 1228.63 },
  { date: daysAgo(2), session: 'evening', slot: '14:00', number: '18', set: 1215, value: 29, setIndex: 1215.29 },
  { date: daysAgo(2), session: 'morning', slot: '12:01', number: '56', set: 1208, value: 41, setIndex: 1208.41 },
  { date: daysAgo(2), session: 'morning', slot: '09:30', number: '92', set: 1196, value: 87, setIndex: 1196.87 },
  { date: daysAgo(3), session: 'evening', slot: '16:30', number: '33', set: 1184, value: 52, setIndex: 1184.52 },
  { date: daysAgo(3), session: 'morning', slot: '12:01', number: '08', set: 1172, value: 96, setIndex: 1172.96 },
  { date: daysAgo(4), session: 'evening', slot: '16:30', number: '41', set: 1160, value: 23, setIndex: 1160.23 },
  { date: daysAgo(4), session: 'morning', slot: '09:30', number: '67', set: 1148, value: 71, setIndex: 1148.71 },
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

export function seedDatabase(): void {
  const insert2d = db.prepare(`
    INSERT OR IGNORE INTO results_2d (date, session, slot, number, set_val, value_val, set_index)
    VALUES (@date, @session, @slot, @number, @set, @value, @setIndex)
  `)
  for (const r of MOCK_2D) insert2d.run(r)

  const insert3d = db.prepare(`
    INSERT OR IGNORE INTO results_3d (date, number, draw_day) VALUES (@date, @number, @drawDay)
  `)
  for (const r of MOCK_3D) insert3d.run(r)

  const insertHoliday = db.prepare(`
    INSERT OR IGNORE INTO holidays (date, name, name_mm) VALUES (@date, @name, @name_mm)
  `)
  for (const h of MOCK_HOLIDAYS) {
    insertHoliday.run({ date: h.date, name: h.name, name_mm: h.nameMm })
  }
}
