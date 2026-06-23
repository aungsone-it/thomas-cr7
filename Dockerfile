# ── Build frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY public ./public
COPY src ./src
ENV VITE_API_URL=/api
RUN npm run build

# ── Build backend ───────────────────────────────────────────
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ── Production image ────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV SERVE_STATIC=true
ENV STATIC_DIR=/app/public
ENV DB_PATH=/data/lottery.db
ENV PORT=3001
ENV HOST=0.0.0.0

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=server-build /app/server/dist ./dist
COPY --from=frontend-build /app/dist ./public

RUN mkdir -p /data
VOLUME /data
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

RUN mkdir -p /data && chown -R node:node /app /data
USER node
CMD ["node", "dist/index.js"]
