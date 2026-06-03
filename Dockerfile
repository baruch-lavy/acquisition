# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev-deps
RUN npm ci

FROM base AS prod-deps
RUN npm ci --omit=dev

# ── Development image ────────────────────────────────────────────────────────────
# Mounts the full source via a Compose volume for live-reload (npm run dev).
FROM node:22-bookworm-slim AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["npm", "run", "dev"]

# ── Production image ─────────────────────────────────────────────────────────────
# Only production dependencies and application source are included; no dev tooling.
FROM node:22-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./
COPY drizzle ./drizzle
COPY drizzle.config.js ./
COPY src ./src
RUN mkdir -p logs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["npm", "start"]
