# Acquisition — Docker + Neon DB Setup

This project uses **[Neon](https://neon.tech)** as its Postgres database. The Docker setup is split into two environments:

| Environment     | Database                                       | Compose file              |
| --------------- | ---------------------------------------------- | ------------------------- |
| **Development** | Neon Local proxy → ephemeral Neon cloud branch | `docker-compose.dev.yml`  |
| **Production**  | Neon Cloud directly (no proxy)                 | `docker-compose.prod.yml` |

---

## How `DATABASE_URL` switches between environments

| File               | `DATABASE_URL` points to                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `.env.development` | `postgres://neon:npg@neon-local:5432/neondb?sslmode=require` (Neon Local proxy inside the Compose network) |
| `.env.production`  | Your real Neon cloud pooled endpoint                                                                       |

`src/config/database.js` reads `NEON_LOCAL=true` in development and reconfigures the Neon serverless driver to route HTTP queries through the local proxy:

```js
if (!isProduction && isNeonLocal) {
  neonConfig.fetchEndpoint = `http://${neonLocalHost}:${neonLocalPort}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}
```

In production `NEON_LOCAL=false`, so the driver connects directly to Neon Cloud over WebSockets/HTTPS.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- A [Neon](https://console.neon.tech) account and project
- **macOS only:** in Docker Desktop → Settings → Virtual Machine → use **gRPC FUSE** (not VirtioFS) to avoid a known issue with Neon Local volume mounts

---

## Development — Neon Local

### 1. Copy and fill the development env file

```bash
cp .env.development.example .env.development
```

Edit `.env.development` and supply:

| Variable           | Where to find it                                                                      |
| ------------------ | ------------------------------------------------------------------------------------- |
| `NEON_API_KEY`     | [Neon Console → Account → API Keys](https://console.neon.tech/app/settings/api-keys)  |
| `NEON_PROJECT_ID`  | Neon Console → your project → **Settings → General**                                  |
| `PARENT_BRANCH_ID` | _(optional)_ Branch ID to fork from. Leave blank to use the project's primary branch. |
| `ARCJET_KEY`       | Your Arcjet developer key                                                             |

> The `DATABASE_URL` in `.env.development` is already pre-filled to connect to the `neon-local` service inside the Compose network — **do not change it**.

### 2. Start the stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

What happens:

1. **`neon-local`** starts, authenticates to Neon Cloud and creates an **ephemeral branch** (a full copy of `PARENT_BRANCH_ID`).
2. The app waits for `neon-local` to pass its healthcheck, then starts with `npm run dev` (hot-reload via `--watch`).
3. When you `docker compose down`, Neon Local **deletes the ephemeral branch** automatically.

### 3. Run migrations (first time or after schema changes)

In a separate terminal while the stack is running:

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

Or push the schema directly (no migration files):

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:push
```

### 4. Drizzle Studio (database browser)

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:studio
```

### 5. Stop the stack

```bash
# Stops containers and deletes the ephemeral Neon branch
docker compose -f docker-compose.dev.yml down
```

---

## Production — Neon Cloud

### 1. Copy and fill the production env file

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

| Variable       | Description                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Your Neon **pooled** connection string (Dashboard → Connection Details → Pooled connection) |
| `ARCJET_KEY`   | Your production Arcjet key                                                                  |

> **Never commit `.env.production`.** In CI/CD, inject these as secrets (GitHub Actions secrets, AWS Secrets Manager, etc.) instead of using a file.

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The container will:

1. Run `npx drizzle-kit migrate` to apply any pending migrations.
2. Start the Express server with `npm start`.

### 3. Check logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

### 4. Stop

```bash
docker compose -f docker-compose.prod.yml down
```

---

## Environment variable reference

### Shared variables

| Variable       | Description                                          | Default |
| -------------- | ---------------------------------------------------- | ------- |
| `PORT`         | HTTP port the Express server listens on              | `3000`  |
| `NODE_ENV`     | `development` or `production`                        | —       |
| `LOG_LEVEL`    | Winston log level (`debug`, `info`, `warn`, `error`) | `info`  |
| `DATABASE_URL` | Postgres connection string                           | —       |
| `ARCJET_KEY`   | Arcjet security key                                  | —       |

### Development-only (Neon Local)

| Variable           | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `NEON_API_KEY`     | Neon API key — used by the `neon-local` container                   |
| `NEON_PROJECT_ID`  | Neon project ID — used by the `neon-local` container                |
| `PARENT_BRANCH_ID` | Branch to fork from; omit to use the primary branch                 |
| `NEON_LOCAL`       | Set to `true` to enable the Neon Local driver shim in `database.js` |
| `NEON_LOCAL_HOST`  | Hostname of the `neon-local` service (`neon-local`)                 |
| `NEON_LOCAL_PORT`  | Port of the `neon-local` service (`5432`)                           |

---

## Project structure

```
.
├── Dockerfile                  # Multi-stage: base → dev-deps → prod-deps → dev → prod
├── docker-compose.dev.yml      # Dev stack: app + neon-local proxy
├── docker-compose.prod.yml     # Prod stack: app only (Neon Cloud is external)
├── .env.development.example    # ← copy to .env.development and fill in
├── .env.production.example     # ← copy to .env.production and fill in
├── drizzle.config.js           # Drizzle Kit config (reads DATABASE_URL)
├── drizzle/                    # Migration files
└── src/
    ├── config/
    │   └── database.js         # Neon serverless driver + Neon Local shim
    └── ...
```

---

## Troubleshooting

### `neon-local` container exits immediately

- Verify `NEON_API_KEY` and `NEON_PROJECT_ID` are correct in `.env.development`.
- Run `docker compose -f docker-compose.dev.yml logs neon-local` for the error message.

### App can't connect to `neon-local`

- Confirm `DATABASE_URL` in `.env.development` contains `@neon-local:5432` (not `localhost`).
- Make sure `NEON_LOCAL=true` so `database.js` switches the fetch endpoint.

### macOS VirtioFS volume issue

Go to **Docker Desktop → Settings → General → Virtual Machine** and switch to **gRPC FUSE**.

### Running migrations on production

The `docker-compose.prod.yml` command runs `drizzle-kit migrate` before `npm start`. To run migrations separately (e.g., from CI):

```bash
docker run --rm --env-file .env.production \
  $(docker build -q --target prod .) \
  npx drizzle-kit migrate
```
