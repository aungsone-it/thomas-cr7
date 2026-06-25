# Supabase setup

Run once after creating your project at [supabase.com](https://supabase.com).

## 1. Database tables

**SQL Editor** → paste and run [`schema.sql`](./schema.sql)

## 2. Storage bucket

**Storage → New bucket**

| Setting | Value |
|---------|-------|
| Name | `assets` |
| Public | ✅ Yes |

## 3. Connect locally

Add to `server/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Project Settings → API → service_role
SUPABASE_STORAGE_BUCKET=assets
SET_MODE=public
SEED_DATA=none
```

Restart:

```bash
npm run dev:all
```

Server log should show: `DB=supabase (Supabase)`

## 4. Deploy (free)

See [DEPLOY-SUPABASE.md](../DEPLOY-SUPABASE.md) for Render + Vercel.

## 5. Later: VPS runs API, Supabase stays as DB

Keep `SUPABASE_URL` + keys on VPS → poller always on, no Render cold start.

When ready to drop Supabase billing, remove Supabase env vars → SQLite on VPS automatically.
