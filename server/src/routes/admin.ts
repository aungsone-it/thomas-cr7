import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  getFormula,
  getSettings,
  saveFormula,
  saveSettings,
  upsert2DResult,
  upsert3DResult,
  upsertHoliday,
} from '../db/index.js'
import { buildLivePayload, invalidateCache } from '../cache.js'
import { pollOnce } from '../poller.js'
import { handleDeleteUpload, handleUpload, removeOldFiles, uploadMiddleware, getUploadDir } from '../uploads.js'
import type { UploadKind } from '../uploads.js'
import { isSupabaseEnabled } from '../supabase/client.js'
import type { FormulaConfig, Result2D, Result3D, SiteSettings } from '../types.js'
import { getDbProvider } from '../db/index.js'
import { getSetMode } from '../setClient.js'

export const adminRouter = Router()

adminRouter.use(requireAdmin)

adminRouter.get('/settings', async (_req, res) => {
  try {
    res.json(await getSettings())
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.put('/settings', async (req, res) => {
  try {
    const settings = await saveSettings(req.body as SiteSettings)
    invalidateCache()
    await buildLivePayload()
    res.json(settings)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.post(
  '/upload/:kind',
  (req, _res, next) => {
    if (!isSupabaseEnabled()) {
      removeOldFiles(getUploadDir(), req.params.kind as UploadKind)
    }
    next()
  },
  uploadMiddleware.single('file'),
  (req, res) => { handleUpload(req, res).catch((e) => res.status(500).json({ error: e.message })) },
)

adminRouter.delete('/upload/:kind', (req, res) => {
  handleDeleteUpload(req, res).catch((e) => res.status(500).json({ error: e.message }))
})

adminRouter.get('/formula', async (_req, res) => {
  try {
    res.json(await getFormula())
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.put('/formula', async (req, res) => {
  try {
    const formula = await saveFormula(req.body as FormulaConfig)
    invalidateCache()
    res.json(formula)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.post('/2d', async (req, res) => {
  try {
    const result = await upsert2DResult(req.body as Omit<Result2D, 'id'>)
    invalidateCache()
    await buildLivePayload()
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.post('/3d', async (req, res) => {
  try {
    const result = await upsert3DResult(req.body as Omit<Result3D, 'id'>)
    invalidateCache()
    await buildLivePayload()
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.post('/holidays', async (req, res) => {
  try {
    await upsertHoliday(req.body)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.post('/poll-now', async (_req, res) => {
  try {
    await pollOnce()
    res.json(await buildLivePayload())
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
})

adminRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    db: getDbProvider(),
    setMode: getSetMode(),
    hasSetApiKey: Boolean(process.env.SET_API_KEY),
    seedData: process.env.SEED_DATA ?? (getSetMode() === 'mock' ? 'mock' : 'none'),
  })
})

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = process.env.ADMIN_TOKEN
  if (!token || token === 'change-me-to-a-long-random-string') {
    res.status(503).json({ error: 'Set ADMIN_TOKEN before using admin API' })
    return
  }
  if (req.headers.authorization !== `Bearer ${token}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
