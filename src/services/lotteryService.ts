import type { DrawSession, DrawSlot, Holiday, LiveStatus, Result2D, Result3D, SetIndexData } from '../types/lottery'

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]

function daysAgo(n: number): string {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return fmt(d)
}

export const MOCK_SET_INDEX: SetIndexData = {
  value: 1284.56,
  change: 12.34,
  changePercent: 0.97,
  updatedAt: new Date().toISOString(),
}

export const MOCK_2D_RESULTS: Result2D[] = [
  { id: '1', date: daysAgo(0), session: 'morning', slot: '12:01', number: '47', set: 1284, value: 56, setIndex: 1284.56 },
  { id: '2', date: daysAgo(0), session: 'morning', slot: '09:30', number: '23', set: 1272, value: 18, setIndex: 1272.18 },
  { id: '3', date: daysAgo(1), session: 'evening', slot: '16:30', number: '89', set: 1268, value: 92, setIndex: 1268.92 },
  { id: '4', date: daysAgo(1), session: 'evening', slot: '14:00', number: '05', set: 1255, value: 44, setIndex: 1255.44 },
  { id: '5', date: daysAgo(1), session: 'morning', slot: '12:01', number: '62', set: 1241, value: 78, setIndex: 1241.78 },
  { id: '6', date: daysAgo(1), session: 'morning', slot: '09:30', number: '31', set: 1239, value: 15, setIndex: 1239.15 },
  { id: '7', date: daysAgo(2), session: 'evening', slot: '16:30', number: '74', set: 1228, value: 63, setIndex: 1228.63 },
  { id: '8', date: daysAgo(2), session: 'evening', slot: '14:00', number: '18', set: 1215, value: 29, setIndex: 1215.29 },
  { id: '9', date: daysAgo(2), session: 'morning', slot: '12:01', number: '56', set: 1208, value: 41, setIndex: 1208.41 },
  { id: '10', date: daysAgo(2), session: 'morning', slot: '09:30', number: '92', set: 1196, value: 87, setIndex: 1196.87 },
  { id: '11', date: daysAgo(3), session: 'evening', slot: '16:30', number: '33', set: 1184, value: 52, setIndex: 1184.52 },
  { id: '12', date: daysAgo(3), session: 'morning', slot: '12:01', number: '08', set: 1172, value: 96, setIndex: 1172.96 },
  { id: '13', date: daysAgo(4), session: 'evening', slot: '16:30', number: '41', set: 1160, value: 23, setIndex: 1160.23 },
  { id: '14', date: daysAgo(4), session: 'morning', slot: '09:30', number: '67', set: 1148, value: 71, setIndex: 1148.71 },
]

export const MOCK_3D_RESULTS: Result3D[] = [
  { id: '3d-1', date: daysAgo(0), number: '847', drawDay: 1 },
  { id: '3d-2', date: daysAgo(1), number: '523', drawDay: 16 },
  { id: '3d-3', date: daysAgo(2), number: '196', drawDay: 1 },
  { id: '3d-4', date: daysAgo(3), number: '734', drawDay: 16 },
  { id: '3d-5', date: daysAgo(4), number: '058', drawDay: 1 },
  { id: '3d-6', date: daysAgo(5), number: '412', drawDay: 16 },
  { id: '3d-7', date: daysAgo(6), number: '689', drawDay: 1 },
]

export const MOCK_HOLIDAYS: Holiday[] = [
  { date: '2026-04-13', name: 'Thingyan (Water Festival)', nameMm: 'သင်္ကြန်' },
  { date: '2026-04-14', name: 'Thingyan (Water Festival)', nameMm: 'သင်္ကြန်' },
  { date: '2026-04-15', name: 'Thingyan (Water Festival)', nameMm: 'သင်္ကြန်' },
  { date: '2026-04-16', name: 'Thingyan (Water Festival)', nameMm: 'သင်္ကြန်' },
  { date: '2026-04-17', name: 'Myanmar New Year', nameMm: 'နှစ်ဆန်းတစ်ရက်' },
  { date: '2026-07-19', name: 'Martyrs Day', nameMm: 'အာဇာနည်နေ့' },
  { date: '2026-12-25', name: 'Christmas Day', nameMm: 'ခရစ္စမတ်နေ့' },
]

const DRAW_SCHEDULE: { session: DrawSession; slot: DrawSlot; hour: number; minute: number }[] = [
  { session: 'morning', slot: '09:30', hour: 9, minute: 30 },
  { session: 'morning', slot: '12:01', hour: 12, minute: 1 },
  { session: 'evening', slot: '14:00', hour: 14, minute: 0 },
  { session: 'evening', slot: '16:30', hour: 16, minute: 30 },
]

function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

export function getLiveStatus(now = new Date()): LiveStatus {
  if (!isWeekday(now)) {
    return {
      isLive: false,
      session: null,
      nextSlot: null,
      nextDrawAt: null,
      message: 'Market closed (Weekend)',
      messageMm: 'စတော့ပိတ်သည် (စနေ/တနင်္ဂနွေ)',
    }
  }

  const minutes = now.getHours() * 60 + now.getMinutes()
  const morningStart = 9 * 60 + 30
  const morningEnd = 12 * 60 + 1
  const eveningStart = 14 * 60
  const eveningEnd = 16 * 60 + 30

  if (minutes >= morningStart && minutes <= morningEnd) {
    const nextSlot = minutes < 12 * 60 + 1 ? ('12:01' as DrawSlot) : null
    return {
      isLive: true,
      session: 'morning',
      nextSlot,
      nextDrawAt: nextSlot ? `${fmt(now)}T12:01:00` : null,
      message: 'Morning session LIVE',
      messageMm: 'မနက်ပိုင်း Live',
    }
  }

  if (minutes >= eveningStart && minutes <= eveningEnd) {
    const nextSlot = minutes < 16 * 60 + 30 ? ('16:30' as DrawSlot) : null
    return {
      isLive: true,
      session: 'evening',
      nextSlot,
      nextDrawAt: nextSlot ? `${fmt(now)}T16:30:00` : null,
      message: 'Evening session LIVE',
      messageMm: 'ညနေပိုင်း Live',
    }
  }

  let nextDraw = DRAW_SCHEDULE.find(({ hour, minute }) => hour * 60 + minute > minutes)
  if (!nextDraw) nextDraw = DRAW_SCHEDULE[0]

  const sessionLabel = nextDraw.session === 'morning' ? 'Morning' : 'Evening'
  return {
    isLive: false,
    session: null,
    nextSlot: nextDraw.slot,
    nextDrawAt: `${fmt(now)}T${nextDraw.slot.replace(':', ':')}:00`,
    message: `Next draw: ${sessionLabel} ${nextDraw.slot}`,
    messageMm: `နောက်ထပ် ${nextDraw.slot}`,
  }
}

export function getLatest2D(): Result2D {
  return MOCK_2D_RESULTS[0]
}

export function getPrevious2D(): Result2D {
  return MOCK_2D_RESULTS[1]
}

export function get2DByDate(date: string): Result2D[] {
  return MOCK_2D_RESULTS.filter((r) => r.date === date)
}

export function get2DHistory(limit = 20): Result2D[] {
  return MOCK_2D_RESULTS.slice(0, limit)
}

export function getLatest3D(): Result3D {
  return MOCK_3D_RESULTS[0]
}

export function get3DHistory(limit = 20): Result3D[] {
  return MOCK_3D_RESULTS.slice(0, limit)
}

export function getUniqueDates(): string[] {
  return [...new Set(MOCK_2D_RESULTS.map((r) => r.date))].sort().reverse()
}

export async function fetchSetIndex(): Promise<SetIndexData> {
  await delay(300)
  return {
    ...MOCK_SET_INDEX,
    value: MOCK_SET_INDEX.value + (Math.random() - 0.5) * 2,
    updatedAt: new Date().toISOString(),
  }
}

export async function fetch2DResults(): Promise<Result2D[]> {
  await delay(200)
  return MOCK_2D_RESULTS
}

export async function fetch3DResults(): Promise<Result3D[]> {
  await delay(200)
  return MOCK_3D_RESULTS
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
