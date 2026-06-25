import {
  getFormula,
  upsert2DResult,
  upsert3DResult,
} from './db/index.js'
import { apply2DFormula, apply3DFormula, getDrawDay, is3DDrawDay } from './formula.js'
import { buildLivePayload, setCachedSetIndex } from './cache.js'
import { fetchSetIndex, fmtDate, getCurrentSlot, isDrawWindow } from './setClient.js'

let pollTimer: ReturnType<typeof setInterval> | null = null
let lastLockedSlot: string | null = null

export async function pollOnce(): Promise<void> {
  try {
    const setIndex = await fetchSetIndex()
    setCachedSetIndex(setIndex)

    const now = new Date()
    const slotInfo = getCurrentSlot(now)
    const slotKey = slotInfo ? `${fmtDate(now)}-${slotInfo.slot}` : null

    if (slotInfo && slotKey !== lastLockedSlot && isDrawWindow(now)) {
      const formula = await getFormula()
      const derived = apply2DFormula(setIndex, formula)

      await upsert2DResult({
        date: fmtDate(now),
        session: slotInfo.session,
        slot: slotInfo.slot,
        number: derived.number,
        set: derived.set,
        value: derived.value,
        setIndex: setIndex.value,
      })

      lastLockedSlot = slotKey
      console.log(`[poller] Locked 2D ${derived.number} for ${slotInfo.slot}`)

      if (is3DDrawDay(now) && (slotInfo.slot === '12:01' || slotInfo.slot === '16:30')) {
        const number3d = apply3DFormula(setIndex, formula)
        await upsert3DResult({
          date: fmtDate(now),
          number: number3d,
          drawDay: getDrawDay(now),
        })
        console.log(`[poller] Locked 3D ${number3d}`)
      }
    }

    await buildLivePayload()
  } catch (err) {
    console.error('[poller] Error:', err)
    // Keep API payload fresh even if SET endpoint is temporarily unreachable.
    try {
      await buildLivePayload()
    } catch (cacheErr) {
      console.error('[poller] Cache refresh failed:', cacheErr)
    }
  }
}

export function startPoller(): void {
  if (pollTimer) return
  pollOnce()
  pollTimer = setInterval(pollOnce, 15_000)
  console.log('[poller] Started — polls SET every 15 seconds')
}

export function stopPoller(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
}
