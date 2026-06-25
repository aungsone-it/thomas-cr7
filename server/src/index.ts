import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import multer from 'multer'
import { initDb, getDbProvider } from './db/index.js'
import { publicRouter } from './routes/public.js'
import { adminRouter } from './routes/admin.js'
import { startPoller, stopPoller } from './poller.js'
import { buildLivePayload } from './cache.js'
import { setupStaticFrontend } from './static.js'
import { setupUploads } from './uploads.js'
import { rateLimit } from './middleware/rateLimit.js'
import { isSupabaseEnabled } from './supabase/client.js'
import { getSetMode } from './setClient.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? true

async function bootstrap() {
  await initDb()
  await buildLivePayload()
  startPoller()

  const app = express()
  app.set('trust proxy', 1)

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })

  app.use(cors({ origin: corsOrigin }))
  app.use(express.json({ limit: '256kb' }))
  app.use('/api', rateLimit(120, 60_000))
  setupUploads(app)
  app.use('/api', publicRouter)
  app.use('/api/admin', adminRouter)
  setupStaticFrontend(app)

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message
      res.status(400).json({ error: msg })
      return
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message })
      return
    }
    next(err)
  })

  const server = app.listen(PORT, HOST, () => {
    console.log(`[server] http://${HOST}:${PORT}`)
    console.log(`[server] DB=${getDbProvider()}${isSupabaseEnabled() ? ' (Supabase)' : ' (SQLite local)'}`)
    console.log(`[server] SET_MODE=${getSetMode()}`)
    console.log(`[server] Timezone: Asia/Yangon (MMT)`)
  })

  function shutdown() {
    console.log('[server] Shutting down…')
    stopPoller()
    server.close(() => process.exit(0))
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

bootstrap().catch((err) => {
  console.error('[server] Failed to start:', err)
  process.exit(1)
})
