import { Router } from 'express'
import {
  get2DByDate,
  get2DHistory,
  get3DHistory,
  getHolidays,
  getStats,
  getUniqueDates,
} from '../db/index.js'
import { buildLivePayload, getCachedLive } from '../cache.js'

export const publicRouter = Router()

publicRouter.get('/live', async (_req, res) => {
  try {
    res.json(getCachedLive())
  } catch {
    try {
      res.json(await buildLivePayload())
    } catch (e) {
      res.status(503).json({ error: e instanceof Error ? e.message : 'Live data not ready yet' })
    }
  }
})

publicRouter.get('/2d', async (req, res) => {
  const date = req.query.date as string | undefined
  const limit = Number(req.query.limit ?? 50)
  try {
    res.json(date ? await get2DByDate(date) : await get2DHistory(limit))
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

publicRouter.get('/3d', async (req, res) => {
  const limit = Number(req.query.limit ?? 50)
  try {
    res.json(await get3DHistory(limit))
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

publicRouter.get('/calendar/dates', async (_req, res) => {
  try {
    res.json(await getUniqueDates())
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

publicRouter.get('/calendar/stats', async (_req, res) => {
  try {
    res.json(await getStats())
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

publicRouter.get('/settings', async (_req, res) => {
  try {
    res.json(getCachedLive().settings)
  } catch {
    try {
      res.json((await buildLivePayload()).settings)
    } catch {
      res.status(503).json({ error: 'Settings not ready yet' })
    }
  }
})

publicRouter.get('/holidays', async (_req, res) => {
  try {
    res.json(await getHolidays())
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})
