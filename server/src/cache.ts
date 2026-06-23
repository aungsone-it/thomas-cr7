import type { LivePayload, SetIndexData } from './types.js'
import {
  getLatest2D,
  getLatest3D,
  getPrevious2D,
  getSettings,
} from './db.js'
import { getLiveStatus } from './setClient.js'

let cachedSetIndex: SetIndexData | null = null
let cachedLive: LivePayload | null = null
let cacheUpdatedAt = 0

export function getCachedSetIndex(): SetIndexData | null {
  return cachedSetIndex
}

export function setCachedSetIndex(data: SetIndexData): void {
  cachedSetIndex = data
}

export function buildLivePayload(): LivePayload {
  const payload: LivePayload = {
    setIndex: cachedSetIndex ?? {
      value: 0,
      change: 0,
      changePercent: 0,
      updatedAt: new Date().toISOString(),
    },
    latest2D: getLatest2D(),
    previous2D: getPrevious2D(),
    latest3D: getLatest3D(),
    liveStatus: getLiveStatus(),
    settings: getSettings(),
    updatedAt: new Date().toISOString(),
  }
  cachedLive = payload
  cacheUpdatedAt = Date.now()
  return payload
}

export function getCachedLive(): LivePayload {
  if (!cachedLive || Date.now() - cacheUpdatedAt > 60_000) {
    return buildLivePayload()
  }
  return cachedLive
}

export function invalidateCache(): void {
  cachedLive = null
}
