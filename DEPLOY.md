# Production deploy guide

One VPS (~$5/mo) runs **everything**: React app + API + SQLite + SET poller.

---

## Before you deploy (checklist)

- [ ] Domain pointed to your VPS IP (optional but recommended for HTTPS)
- [ ] `ADMIN_TOKEN` chosen (32+ random characters)
- [ ] Client confirmed **2D/3D formula** (pick in `/admin` after deploy)
- [ ] SET API key from [SMART Marketplace](https://www.set.or.th/en/services/connectivity-and-data/data/smart-marketplace) (when ready for live data)

---

## Option A — Docker (recommended)

### 1. Get a VPS

Hetzner CX22, DigitalOcean $6 droplet, or similar. Ubuntu 24.04.

### 2. Install Docker on VPS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in
```

### 3. Upload project

```bash
git clone <your-repo> mm2d3d
cd mm2d3d
```

### 4. Configure environment

```bash
cp .env.production.example .env
nano .env
```

Set at minimum:

```env
ADMIN_TOKEN=your-long-secret-token-here
SET_MODE=mock          # change to realtime when you have SET_API_KEY
SET_API_KEY=
DOMAIN=yourdomain.com  # if using HTTPS
```

### 5. Build and run

**HTTP only (port 3001):**

```bash
docker compose up -d --build
```

Open `http://YOUR_VPS_IP:3001`

**With automatic HTTPS (Caddy):**

```bash
docker compose --profile with-https up -d --build
```

Open `https://yourdomain.com`

### 6. Verify

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/live | head -c 200
```

Admin panel: `https://yourdomain.com/admin` → login with `ADMIN_TOKEN`

### 7. Updates

```bash
git pull
docker compose up -d --build
```

Data persists in Docker volume `lottery-data`.

---

## Option B — PM2 (no Docker)

### 1. Install Node 22 on VPS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 2. Build on VPS

```bash
git clone <your-repo> mm2d3d && cd mm2d3d
bash scripts/build-production.sh
```

### 3. Configure

```bash
cp .env.production.example server/.env
nano server/.env
# Set ADMIN_TOKEN, SET_MODE, SET_API_KEY
```

Load env in PM2 — edit `ecosystem.config.cjs` or export vars before start.

### 4. Start with PM2

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # follow instructions for boot on restart
```

### 5. Nginx reverse proxy (HTTPS)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Use Certbot for free SSL: `sudo certbot --nginx -d yourdomain.com`

---

## Enable live SET data

1. Register at [SET SMART Marketplace](https://www.set.or.th/en/services/connectivity-and-data/data/smart-marketplace)
2. Create API key
3. Update `.env`:

```env
SET_MODE=realtime
SET_API_KEY=your-set-api-key
```

4. Restart:

```bash
docker compose up -d --build
# or: pm2 restart mm2d3d
```

Poller runs every **15 seconds**. Draw results lock at **09:30, 12:01, 14:00, 16:30 MMT** on weekdays.

---

## Give admin access to your client

1. Send them: `https://yourdomain.com/admin`
2. Send them the `ADMIN_TOKEN` (use a password manager, not SMS if possible)
3. They can change colors, app name, formula — no developer needed

---

## Backup SQLite database

**Docker:**

```bash
docker compose exec app cat /data/lottery.db > backup-$(date +%F).db
```

**PM2:**

```bash
cp server/data/lottery.db backup-$(date +%F).db
```

Schedule weekly with cron.

---

## Monthly cost

| Item | Cost |
|------|------|
| Hetzner / DO VPS | ~$5–6 |
| Domain | ~$1/mo |
| Cloudflare (optional CDN) | $0 |
| SET API | varies (client pays) |
| **Total** | **~$6–10/mo** |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | Check `docker compose logs app` — static files must exist in image |
| Admin 503 | Set `ADMIN_TOKEN` in `.env` and restart |
| Live numbers not updating | Check `SET_MODE` and `SET_API_KEY`; use admin "Poll SET now" |
| Wrong draw times | Server uses **Asia/Yangon (MMT)** — VPS timezone doesn't matter |
| 429 errors | Rate limit is 120 req/min/IP on `/api` — normal for polling |

---

## Local production test (before VPS)

```bash
bash scripts/build-production.sh
cp .env.production.example .env
# set ADMIN_TOKEN in .env

export $(grep -v '^#' .env | xargs)
export SERVE_STATIC=true
export STATIC_DIR=./dist
export DB_PATH=./server/data/lottery.db
node server/dist/index.js
```

Open http://localhost:3001 — same as production.
