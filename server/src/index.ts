import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import { publicRouter } from './routes/public.js'
import { adminRouter } from './routes/admin.js'
import { startPoller, stopPoller } from './poller.js'
import { buildLivePayload } from './cache.js'
import { setupStaticFrontend } from './static.js'
import { rateLimit } from './middleware/rateLimit.js'

const PORT = Number(process.env.PORT ?? 3001)
const HOST = process.env.HOST ?? '0.0.0.0'
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? true

initDb()
buildLivePayload()
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
app.use('/api', publicRouter)
app.use('/api/admin', adminRouter)

setupStaticFrontend(app)

const server = app.listen(PORT, HOST, () => {
  console.log(`[server] http://${HOST}:${PORT}`)
  console.log(`[server] NODE_ENV=${process.env.NODE_ENV ?? 'development'}`)
  console.log(`[server] SET_MODE=${process.env.SET_MODE ?? 'mock'}`)
  console.log(`[server] Timezone: Asia/Yangon (MMT)`)
})

function shutdown() {
  console.log('[server] Shutting down…')
  stopPoller()
  server.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
