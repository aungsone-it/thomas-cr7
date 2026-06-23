import type { Request, Response, NextFunction } from 'express'

const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(maxPerWindow: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? 'unknown'
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    if (entry.count >= maxPerWindow) {
      res.status(429).json({ error: 'Too many requests. Try again shortly.' })
      return
    }

    entry.count++
    next()
  }
}
