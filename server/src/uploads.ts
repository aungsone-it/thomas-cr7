import { mkdirSync, existsSync, unlinkSync, readdirSync, writeFileSync } from 'fs'
import path from 'path'
import multer from 'multer'
import type { Express, Request, Response } from 'express'
import express from 'express'
import sharp from 'sharp'
import { getSettings, saveSettings } from './db/index.js'
import { invalidateCache, buildLivePayload } from './cache.js'
import { isSupabaseEnabled, getSupabase, getStoragePublicUrl, STORAGE_BUCKET } from './supabase/client.js'
import type { SiteSettings } from './types.js'

export type UploadKind = 'logo' | 'loading' | 'background'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024
const TARGET_BYTES = 500 * 1024

const SETTINGS_KEY: Record<UploadKind, keyof SiteSettings> = {
  logo: 'logoUrl',
  loading: 'loadingBannerUrl',
  background: 'backgroundImageUrl',
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

export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? path.resolve('./data/uploads')
  mkdirSync(dir, { recursive: true })
  return dir
}

export function removeOldFiles(dir: string, kind: UploadKind, keep?: string): void {
  if (!existsSync(dir)) return
  for (const file of readdirSync(dir)) {
    if (keep && file === keep) continue
    if (file.startsWith(`${kind}.`) || file.startsWith(`${kind}-`)) {
      try { unlinkSync(path.join(dir, file)) } catch { /* ignore */ }
    }
  }
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
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
  if (isSupabaseEnabled()) {
    console.log(`[uploads] Using Supabase Storage bucket: ${STORAGE_BUCKET}`)
    return
  }
  const dir = getUploadDir()
  app.use('/uploads', express.static(dir, { maxAge: '1h' }))
  console.log(`[uploads] Serving local files from ${dir}`)
}

async function uploadToSupabase(kind: UploadKind, buffer: Buffer, mime: string): Promise<string> {
  const ext = extForMime(mime)
  const filePath = `${kind}${ext}`
  const sb = getSupabase()

  const { data: existing } = await sb.storage.from(STORAGE_BUCKET).list('', { search: kind })
  if (existing?.length) {
    await sb.storage.from(STORAGE_BUCKET).remove(existing.map((f) => f.name))
  }

  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(filePath, buffer, {
    contentType: mime,
    upsert: true,
  })
  if (error) throw error

  return `${getStoragePublicUrl(filePath)}?v=${Date.now()}`
}

async function compressToWebp(input: Buffer): Promise<Buffer> {
  const dimensions = [1920, 1600, 1280, 1024, 800, 640]
  const qualities = [82, 72, 62, 52, 42, 35]
  let smallest: Buffer | null = null

  for (const dim of dimensions) {
    for (const quality of qualities) {
      const out = await sharp(input, { animated: false })
        .rotate()
        .resize({ width: dim, height: dim, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toBuffer()

      if (!smallest || out.byteLength < smallest.byteLength) {
        smallest = out
      }
      if (out.byteLength <= TARGET_BYTES) {
        return out
      }
    }
  }

  if (!smallest) {
    throw new Error('Image processing failed')
  }
  return smallest
}

export async function handleUpload(req: Request, res: Response): Promise<void> {
  const kind = req.params.kind as UploadKind
  if (!['logo', 'loading', 'background'].includes(kind)) {
    res.status(400).json({ error: 'Invalid upload type' })
    return
  }
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const compressed = await compressToWebp(req.file.buffer)
  const outputMime = 'image/webp'
  const outputFilename = `${kind}.webp`
  let url: string

  if (isSupabaseEnabled()) {
    url = await uploadToSupabase(kind, compressed, outputMime)
  } else {
    const dir = getUploadDir()
    removeOldFiles(dir, kind, outputFilename)
    writeFileSync(path.join(dir, outputFilename), compressed)
    url = `/uploads/${outputFilename}?v=${Date.now()}`
  }

  const settings = await getSettings()
  const updated = await saveSettings({ ...settings, [SETTINGS_KEY[kind]]: url })
  invalidateCache()
  await buildLivePayload()
  res.json({ url, settings: updated })
}

export async function handleDeleteUpload(req: Request, res: Response): Promise<void> {
  const kind = req.params.kind as UploadKind
  if (!['logo', 'loading', 'background'].includes(kind)) {
    res.status(400).json({ error: 'Invalid upload type' })
    return
  }

  if (isSupabaseEnabled()) {
    const sb = getSupabase()
    const { data } = await sb.storage.from(STORAGE_BUCKET).list('', { search: kind })
    if (data?.length) {
      await sb.storage.from(STORAGE_BUCKET).remove(data.map((f) => f.name))
    }
  } else {
    removeOldFiles(getUploadDir(), kind)
  }

  const settings = await getSettings()
  const updated = await saveSettings({ ...settings, [SETTINGS_KEY[kind]]: '' })
  invalidateCache()
  await buildLivePayload()
  res.json({ settings: updated })
}
