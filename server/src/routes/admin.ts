import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  getFormula,
  getSettings,
  saveFormula,
  saveSettings,
  upsert2DResult,
  upsert3DResult,
  upsertHoliday,
} from '../db.js'
import { buildLivePayload, invalidateCache } from '../cache.js'
import { pollOnce } from '../poller.js'
import type { FormulaConfig, Result2D, Result3D, SiteSettings } from '../types.js'

export const adminRouter = Router()

adminRouter.use(requireAdmin)

adminRouter.get('/settings', (_req, res) => {
  res.json(getSettings())
})

adminRouter.put('/settings', (req, res) => {
  const settings = saveSettings(req.body as SiteSettings)
  invalidateCache()
  buildLivePayload()
  res.json(settings)
})

adminRouter.get('/formula', (_req, res) => {
  res.json(getFormula())
})

adminRouter.put('/formula', (req, res) => {
  const formula = saveFormula(req.body as FormulaConfig)
  invalidateCache()
  res.json(formula)
})

adminRouter.post('/2d', (req, res) => {
  const body = req.body as Omit<Result2D, 'id'>
  const result = upsert2DResult(body)
  invalidateCache()
  buildLivePayload()
  res.json(result)
})

adminRouter.post('/3d', (req, res) => {
  const body = req.body as Omit<Result3D, 'id'>
  const result = upsert3DResult(body)
  invalidateCache()
  buildLivePayload()
  res.json(result)
})

adminRouter.post('/holidays', (req, res) => {
  upsertHoliday(req.body)
  res.json({ ok: true })
})

adminRouter.post('/poll-now', async (_req, res) => {
  await pollOnce()
  res.json(buildLivePayload())
})

adminRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    setMode: process.env.SET_MODE ?? 'mock',
    hasSetApiKey: Boolean(process.env.SET_API_KEY),
  })
})

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = process.env.ADMIN_TOKEN
  if (!token || token === 'change-me-to-a-long-random-string') {
    res.status(503).json({ error: 'Set ADMIN_TOKEN in server/.env before using admin API' })
    return
  }

  const auth = req.headers.authorization
  if (auth !== `Bearer ${token}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
