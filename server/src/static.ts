import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Express, Request, Response, NextFunction } from 'express'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function setupStaticFrontend(app: Express): boolean {
  const serve =
    process.env.SERVE_STATIC === 'true' || process.env.NODE_ENV === 'production'

  if (!serve) return false

  const staticDir =
    process.env.STATIC_DIR ?? path.resolve(__dirname, '../../../dist')

  if (!existsSync(staticDir)) {
    console.warn(`[static] Folder not found: ${staticDir}`)
    return false
  }

  app.use(express.static(staticDir, { maxAge: '1h' }))

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(staticDir, 'index.html'))
  })

  console.log(`[static] Serving frontend from ${staticDir}`)
  return true
}
