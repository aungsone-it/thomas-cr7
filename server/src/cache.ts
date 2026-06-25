import type { LivePayload, Result2D, SetIndexData } from './types.js'
import {
  get2DByDate,
  get2DHistory,
  getFormula,
  getLatest2D,
  getLatest3D,
  getPrevious2D,
  getSettings,
} from './db/index.js'
import { apply2DFormula } from './formula.js'
import { fmtDate, getLiveStatus, getPreviewSlot } from './setClient.js'

let cachedSetIndex: SetIndexData | null = null
let cachedLive: LivePayload | null = null
let cacheUpdatedAt = 0

export function getCachedSetIndex(): SetIndexData | null {
  return cachedSetIndex
}

export function setCachedSetIndex(data: SetIndexData): void {
  cachedSetIndex = data
}

export async function buildLivePayload(): Promise<LivePayload> {
  const liveStatus = getLiveStatus()
  let latest2D = await getLatest2D()
  let previous2D = await getPrevious2D()

  if (liveStatus.isLive && cachedSetIndex) {
    const preview = await buildLivePreview2D(cachedSetIndex)
    if (preview) {
      latest2D = preview
      const recent = await get2DHistory(20)
      previous2D =
        recent.find((r) => !(r.date === preview.date && r.slot === preview.slot)) ?? previous2D
    }
  }

  const payload: LivePayload = {
    setIndex: cachedSetIndex ?? {
      value: 0,
      change: 0,
      changePercent: 0,
      updatedAt: new Date().toISOString(),
    },
    latest2D,
    previous2D,
    latest3D: await getLatest3D(),
    liveStatus,
    settings: await getSettings(),
    updatedAt: new Date().toISOString(),
  }
  cachedLive = payload
  cacheUpdatedAt = Date.now()
  return payload
}

async function buildLivePreview2D(setIndex: SetIndexData): Promise<Result2D | null> {
  const slotInfo = getPreviewSlot()
  if (!slotInfo) return null

  const today = fmtDate()
  const todayResults = await get2DByDate(today)
  const locked = todayResults.find((r) => r.slot === slotInfo.slot)
  if (locked) return locked

  const formula = await getFormula()
  const derived = apply2DFormula(setIndex, formula)
  return {
    id: 'live',
    date: today,
    session: slotInfo.session,
    slot: slotInfo.slot,
    number: derived.number,
    set: derived.set,
    value: derived.value,
    setIndex: setIndex.value,
  }
}

export function getCachedLive(): LivePayload {
  if (!cachedLive) throw new Error('Cache not ready — call buildLivePayload first')
  return cachedLive
}

export function invalidateCache(): void {
  cachedLive = null
}
