import type { DrawSession, DrawSlot, SetIndexData } from './types.js'
import {
  fmtDateMMT,
  getMMTParts,
  isWeekdayMMT,
  minutesSinceMidnightMMT,
} from './time.js'
import { fetchSetIndexPublic } from './setPublic.js'

const SET_REALTIME_URL = 'https://marketplace.set.or.th/api/public/realtime-data/index'
const SET_DELAY_URL = 'https://marketplace.set.or.th/api/public/delay-data/index'

let lastGoodSetIndex: SetIndexData | null = null

export function getSetMode(): string {
  return process.env.SET_MODE ?? 'public'
}

function shouldFallbackToMockOnError(): boolean {
  const raw = (process.env.SET_FALLBACK_ON_ERROR ?? 'true').toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

async function withSetCache(fetcher: () => Promise<SetIndexData>): Promise<SetIndexData> {
  try {
    const data = await fetcher()
    lastGoodSetIndex = data
    return data
  } catch (err) {
    if (lastGoodSetIndex) {
      console.warn('[SET] Fetch failed, using last good value:', err instanceof Error ? err.message : err)
      return lastGoodSetIndex
    }
    if (shouldFallbackToMockOnError()) {
      console.warn('[SET] Fetch failed, using mock fallback for now')
      const mock = mockSetIndex()
      lastGoodSetIndex = mock
      return mock
    }
    throw err
  }
}

export async function fetchSetIndex(): Promise<SetIndexData> {
  const mode = getSetMode()
  if (mode === 'mock') return mockSetIndex()
  if (mode === 'public') return withSetCache(fetchSetIndexPublic)

  const apiKey = process.env.SET_API_KEY
  if (!apiKey) {
    console.warn('[SET] No SET_API_KEY — using free public SET feed')
    return withSetCache(fetchSetIndexPublic)
  }

  const url = mode === 'realtime' ? SET_REALTIME_URL : SET_DELAY_URL
  const params = new URLSearchParams({ market: 'SET', indexSector: 'SET' })

  const res = await fetch(`${url}?${params}`, {
    headers: { 'api-key': apiKey },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`SET API error: ${res.status}`)

  const data = (await res.json()) as SetApiResponse
  const entry = data.indexIndustrySectors?.[0] ?? data.indexList?.[0]
  if (!entry) throw new Error('SET API returned empty index')

  const value = entry.last ?? entry.prior ?? 0
  const prior = entry.prior ?? value
  const change = value - prior
  const changePercent = prior !== 0 ? (change / prior) * 100 : 0

  return {
    value,
    change,
    changePercent,
    updatedAt: entry.time ?? new Date().toISOString(),
  }
}

interface SetApiEntry {
  last?: number
  prior?: number
  time?: string
}

interface SetApiResponse {
  indexIndustrySectors?: SetApiEntry[]
  indexList?: SetApiEntry[]
}

let mockBase = 1284.56
let mockChange = 12.34

export function mockSetIndex(): SetIndexData {
  mockBase += (Math.random() - 0.5) * 0.8
  mockChange += (Math.random() - 0.5) * 0.2
  const prior = mockBase - mockChange
  return {
    value: Math.round(mockBase * 100) / 100,
    change: Math.round(mockChange * 100) / 100,
    changePercent: prior !== 0 ? Math.round((mockChange / prior) * 10000) / 100 : 0,
    updatedAt: new Date().toISOString(),
  }
}

const DRAW_SLOTS: { session: DrawSession; slot: DrawSlot; hour: number; minute: number }[] = [
  { session: 'morning', slot: '09:30', hour: 9, minute: 30 },
  { session: 'morning', slot: '12:01', hour: 12, minute: 1 },
  { session: 'evening', slot: '14:00', hour: 14, minute: 0 },
  { session: 'evening', slot: '16:30', hour: 16, minute: 30 },
]

export function getCurrentSlot(now = new Date()): { session: DrawSession; slot: DrawSlot } | null {
  const { hour, minute } = getMMTParts(now)
  const match = DRAW_SLOTS.find((s) => s.hour === hour && s.minute === minute)
  return match ? { session: match.session, slot: match.slot } : null
}

/** Active draw slot during a live session (updates in real time until lock). */
export function getPreviewSlot(now = new Date()): { session: DrawSession; slot: DrawSlot } | null {
  const minutes = minutesSinceMidnightMMT(now)
  if (minutes >= 9 * 60 + 30 && minutes <= 12 * 60 + 1) {
    return minutes <= 9 * 60 + 30
      ? { session: 'morning', slot: '09:30' }
      : { session: 'morning', slot: '12:01' }
  }
  if (minutes >= 14 * 60 && minutes <= 16 * 60 + 30) {
    return minutes <= 14 * 60
      ? { session: 'evening', slot: '14:00' }
      : { session: 'evening', slot: '16:30' }
  }
  return null
}

export function isDrawWindow(now = new Date()): boolean {
  if (!isWeekdayMMT(now)) return false
  const mins = minutesSinceMidnightMMT(now)
  const morning = mins >= 9 * 60 + 30 && mins <= 12 * 60 + 1
  const evening = mins >= 14 * 60 && mins <= 16 * 60 + 30
  return morning || evening
}

export function fmtDate(d = new Date()): string {
  return fmtDateMMT(d)
}

export function getLiveStatus(now = new Date()) {
  const dateStr = fmtDateMMT(now)

  if (!isWeekdayMMT(now)) {
    return {
      isLive: false,
      session: null,
      nextSlot: null,
      nextDrawAt: null,
      message: 'Market closed (Weekend)',
      messageMm: 'စတော့ပိတ်သည် (စနေ/တနင်္ဂနွေ)',
    }
  }

  const minutes = minutesSinceMidnightMMT(now)
  const morningStart = 9 * 60 + 30
  const morningEnd = 12 * 60 + 1
  const eveningStart = 14 * 60
  const eveningEnd = 16 * 60 + 30

  if (minutes >= morningStart && minutes <= morningEnd) {
    const nextSlot = minutes < 12 * 60 + 1 ? ('12:01' as DrawSlot) : null
    return {
      isLive: true,
      session: 'morning' as DrawSession,
      nextSlot,
      nextDrawAt: nextSlot ? `${dateStr}T12:01:00` : null,
      message: 'Morning session LIVE',
      messageMm: 'မနက်ပိုင်း Live',
    }
  }

  if (minutes >= eveningStart && minutes <= eveningEnd) {
    const nextSlot = minutes < 16 * 60 + 30 ? ('16:30' as DrawSlot) : null
    return {
      isLive: true,
      session: 'evening' as DrawSession,
      nextSlot,
      nextDrawAt: nextSlot ? `${dateStr}T16:30:00` : null,
      message: 'Evening session LIVE',
      messageMm: 'ညနေပိုင်း Live',
    }
  }

  const nextDraw = DRAW_SLOTS.find(({ hour, minute }) => hour * 60 + minute > minutes) ?? DRAW_SLOTS[0]
  const sessionLabel = nextDraw.session === 'morning' ? 'Morning' : 'Evening'

  return {
    isLive: false,
    session: null,
    nextSlot: nextDraw.slot,
    nextDrawAt: `${dateStr}T${nextDraw.slot}:00`,
    message: `Next draw: ${sessionLabel} ${nextDraw.slot}`,
    messageMm: `နောက်ထပ် ${nextDraw.slot}`,
  }
}
