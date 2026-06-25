# Publish FREE with Supabase (no VPS needed)

Deploy now for **$0/month**. Move to VPS later — same code, just remove Supabase env vars.

## Architecture

```
Vercel (frontend)  →  free
Render (API)       →  free tier
Supabase           →  free tier (DB + image storage)
```

**Monthly cost: $0** until you outgrow free tiers.

---

## Step 1 — Create Supabase project (5 min)

1. Go to [supabase.com](https://supabase.com) → **Start your project** (free)
2. Create a project → wait for it to finish provisioning
3. **SQL Editor** → paste contents of `supabase/schema.sql` → **Run**
4. **Storage** → **New bucket** → name: `assets` → **Public bucket** ✅

---

## Step 2 — Get your keys

**Project Settings → API:**

| Key | Use for |
|-----|---------|
| `Project URL` | `SUPABASE_URL` |
| `service_role` (secret!) | `SUPABASE_SERVICE_ROLE_KEY` on Render only |
| `anon` `public` | optional, not needed for this setup |

⚠️ Never put `service_role` in frontend code or git.

---

## Step 3 — Deploy API on Render (free)

1. Push code to **GitHub**
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your repo
4. Settings:

| Field | Value |
|-------|-------|
| Root Directory | *(leave empty)* |
| Build Command | `npm install && npm install --prefix server && npm run build:prod` |
| Start Command | `NODE_ENV=production SERVE_STATIC=false node server/dist/index.js` |
| Instance | **Free** |

5. **Environment variables:**

```env
NODE_ENV=production
PORT=10000
ADMIN_TOKEN=your-long-secret-token
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_STORAGE_BUCKET=assets
SET_MODE=public
SEED_DATA=none
CORS_ORIGIN=https://your-app.vercel.app
```

6. Deploy → copy your Render URL: `https://mm2d3d-api.onrender.com`

---

## Step 4 — Deploy frontend on Vercel (free)

1. Go to [vercel.com](https://vercel.com) → **Import** your GitHub repo
2. Framework: **Vite**
3. **Environment variable:**

```env
VITE_API_URL=https://mm2d3d-api.onrender.com/api
```

4. Deploy → your app is live at `https://your-app.vercel.app`

---

## Step 5 — Login & configure

| URL | Purpose |
|-----|---------|
| `https://your-app.vercel.app` | Public app |
| `https://your-app.vercel.app/admin` | Admin panel |

Login with your `ADMIN_TOKEN`.

Upload logos/banners → stored in **Supabase Storage** (free tier).

---

## Local dev (still works without Supabase)

```bash
npm run dev:all
```

Uses **SQLite** locally. No Supabase account needed for development.

To test Supabase locally, add to `server/.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_STORAGE_BUCKET=assets
```

Restart server → logs will show `DB=supabase`.

---

## Later: VPS for always-on API (save Render sleep issues)

**Recommended hybrid** — keep Supabase DB, move only the API to VPS:

| Service | Role |
|---------|------|
| Supabase | Database + image storage (free tier) |
| VPS ($5/mo) | Always-on API + SET poller (no 30s cold start) |
| Vercel | Frontend (free) |

On VPS, set the same Supabase env vars. The poller runs 24/7 and locks real draw numbers into Supabase.

When you outgrow Supabase free tier, remove `SUPABASE_URL` from VPS env → app falls back to **SQLite on disk** automatically.

Full VPS guide: [DEPLOY.md](./DEPLOY.md)

---

## Real lottery numbers (not mock)

The app uses **live Thailand SET index** (free, no API key) when `SET_MODE=public`:

- SET bar updates every 15 seconds from real market data
- During draw windows (9:30–12:01 & 2:00–4:30 PM MMT, weekdays), the 2D number updates live from SET
- At exact draw times (9:30, 12:01, 2:00, 4:30), results are **locked** into the database

Clear old demo data locally:

```bash
npm run reset:db
npm run dev:all
```

Optional paid SET API (more reliable): set `SET_MODE=realtime` + `SET_API_KEY` from [SET Marketplace](https://marketplace.set.or.th).

---

## Later: full VPS-only ($5/mo)

When ready, deploy with Docker (see `DEPLOY.md`):

1. Remove `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env
2. App automatically uses **SQLite** on the VPS
3. Images stored locally in `data/uploads/`

Same codebase — zero rewrite.

---

## Free tier limits (plenty for launch)

| Service | Free limit |
|---------|-------------|
| Supabase DB | 500 MB |
| Supabase Storage | 1 GB |
| Supabase bandwidth | 5 GB/mo |
| Render | 750 hrs/mo (spins down after 15min idle) |
| Vercel | 100 GB bandwidth |

Fine for hundreds of daily users.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Render slow first load | Free tier sleeps — first request wakes it (~30s) |
| Admin 401 | `ADMIN_TOKEN` must match on Render |
| CORS error | Set `CORS_ORIGIN` on Render to your exact Vercel URL |
| Upload fails | Check `assets` bucket exists and is **public** |
| DB error | Re-run `supabase/schema.sql` |
