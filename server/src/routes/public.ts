import { Router } from 'express'
import {
  get2DByDate,
  get2DHistory,
  get3DHistory,
  getHolidays,
  getStats,
  getUniqueDates,
} from '../db.js'
import { getCachedLive } from '../cache.js'

export const publicRouter = Router()

publicRouter.get('/live', (_req, res) => {
  res.json(getCachedLive())
})

publicRouter.get('/2d', (req, res) => {
  const date = req.query.date as string | undefined
  const limit = Number(req.query.limit ?? 50)

  if (date) {
    res.json(get2DByDate(date))
  } else {
    res.json(get2DHistory(limit))
  }
})

publicRouter.get('/3d', (req, res) => {
  const limit = Number(req.query.limit ?? 50)
  res.json(get3DHistory(limit))
})

publicRouter.get('/calendar/dates', (_req, res) => {
  res.json(getUniqueDates())
})

publicRouter.get('/calendar/stats', (_req, res) => {
  res.json(getStats())
})

publicRouter.get('/settings', (_req, res) => {
  res.json(getCachedLive().settings)
})

publicRouter.get('/holidays', (_req, res) => {
  res.json(getHolidays())
})

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})
