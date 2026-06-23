import { mkdirSync, existsSync, unlinkSync, readdirSync } from 'fs'
import path from 'path'
import multer from 'multer'
import type { Express, Request, Response } from 'express'
import express from 'express'
import { getSettings, saveSettings } from './db.js'
import { invalidateCache, buildLivePayload } from './cache.js'
import type { SiteSettings } from './types.js'

export type UploadKind = 'logo' | 'loading' | 'background'

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const MAX_BYTES = 5 * 1024 * 1024

const SETTINGS_KEY: Record<UploadKind, keyof SiteSettings> = {
  logo: 'logoUrl',
  loading: 'loadingBannerUrl',
  background: 'backgroundImageUrl',
}

export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? path.resolve('./data/uploads')
  mkdirSync(dir, { recursive: true })
  return dir
}

function extForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  }
  return map[mime] ?? '.bin'
}

export function removeOldFiles(dir: string, kind: UploadKind, keep?: string): void {
  if (!existsSync(dir)) return
  for (const file of readdirSync(dir)) {
    if (keep && file === keep) continue
    if (file.startsWith(`${kind}.`) || file.startsWith(`${kind}-`)) {
      try {
        unlinkSync(path.join(dir, file))
      } catch {
        /* ignore */
      }
    }
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, getUploadDir())
  },
  filename(req, file, cb) {
    const kind = req.params.kind as UploadKind
    const ext = extForMime(file.mimetype)
    cb(null, `${kind}${ext}`)
  },
})

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'))
      return
    }
    cb(null, true)
  },
})

export function setupUploads(app: Express): void {
  const dir = getUploadDir()
  app.use('/uploads', express.static(dir, { maxAge: '1h' }))
  console.log(`[uploads] Serving from ${dir}`)
}

export function handleUpload(req: Request, res: Response): void {
  const kind = req.params.kind as UploadKind
  if (!['logo', 'loading', 'background'].includes(kind)) {
    res.status(400).json({ error: 'Invalid upload type' })
    return
  }

  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const url = `/uploads/${req.file.filename}?v=${Date.now()}`
  const settings = getSettings()
  const updated = saveSettings({ ...settings, [SETTINGS_KEY[kind]]: url })
  invalidateCache()
  buildLivePayload()

  res.json({ url, settings: updated })
}

export function handleDeleteUpload(req: Request, res: Response): void {
  const kind = req.params.kind as UploadKind
  if (!['logo', 'loading', 'background'].includes(kind)) {
    res.status(400).json({ error: 'Invalid upload type' })
    return
  }

  removeOldFiles(getUploadDir(), kind)

  const settings = getSettings()
  const updated = saveSettings({ ...settings, [SETTINGS_KEY[kind]]: '' })
  invalidateCache()
  buildLivePayload()

  res.json({ settings: updated })
}
