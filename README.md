# MM 2D3D Live

Myanmar 2D/3D lottery app — **production-ready** with React + Node/SQLite (~$5/month VPS).

## Quick start (development)

```bash
npm install && npm install --prefix server
cp server/.env.example server/.env   # set ADMIN_TOKEN
npm run dev:all
```

- App: http://localhost:5173  
- Admin: http://localhost:5173/admin

## Production deploy

**Free (no VPS):** [DEPLOY-SUPABASE.md](./DEPLOY-SUPABASE.md) — Supabase + Render + Vercel ($0/mo)

**VPS ($5/mo):** [DEPLOY.md](./DEPLOY.md) — Docker on Hetzner/DigitalOcean

```bash
# Build
npm run build:prod

# Configure
cp .env.production.example .env
# Edit .env — set ADMIN_TOKEN (required)

# Docker (recommended)
docker compose up -d --build

# Or run directly
npm run start:prod
```

Open http://localhost:3001 (or your domain with HTTPS via Caddy).

## What's included

| Feature | Status |
|---------|--------|
| Live 2D/3D results | ✅ SET poller (mock or real API) |
| SQLite history | ✅ Auto-seeded, persists on VPS |
| Admin panel `/admin` | ✅ Colors, formula, branding |
| **Image uploads** | ✅ Logo, loading banner, background |
| MMT timezone | ✅ Draw times use Asia/Yangon |
| Docker + Caddy HTTPS | ✅ One-command deploy |
| PM2 config | ✅ Alternative to Docker |
| Rate limiting | ✅ 120 req/min/IP on API |

## Architecture

```
Users → GET /api/live (cached) → Node server → SQLite
                                      ↓ polls every 15s
                                   SET Index API
```

## Monthly cost

~**$5–10/month** (VPS + domain). No Supabase/Firebase.

## Disclaimer

Informational purposes only. Data derived from Stock Exchange of Thailand (SET).
