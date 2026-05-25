# Bingo Game (bingo-js)

Full-stack **75-ball Bingo** with NestJS backend, Vue 3 frontend, Socket.IO live play, and optional Electron desktop packaging.

## Stack

- **Backend:** NestJS, TypeORM, PostgreSQL (server) / SQLite (Electron)
- **Frontend:** Vue 3, Vuetify 3, Pinia
- **Real-time:** Socket.IO (+ Redis adapter when available)

## Quick start (development)

### 1. Configure database

```bash
cp .env.example .env
```

Set `DB_TYPE` to match your database:

| `DB_TYPE` | Port | Notes |
|-----------|------|-------|
| `mysql` | 3306 | Default in `.env.example` (matches local MySQL/MariaDB) |
| `postgres` | 5432 | Use with `docker compose up -d` |

Create the database if needed:

```bash
mysql -uroot -p -e "CREATE DATABASE IF NOT EXISTS bingo;"
# or: docker compose up -d   # for PostgreSQL + Redis
```

### 2. Backend

```bash
npm install
npm run start:dev
```

API: `http://127.0.0.1:3000/api`  
Health: `http://127.0.0.1:3000/api/health`

### 3. Frontend

```bash
cd client
npm install
npm run serve
```

Open `http://localhost:8080`

Default admin (dev only, if no admin exists): `admin` / `admin123`  
**Production:** set `ADMIN_PASSWORD` (required when `NODE_ENV=production`).

## Routes

| Path | Description |
|------|-------------|
| `/` | Home — login & room list |
| `/admin` | Admin dashboard |
| `/bingo-rooms/:roomId` | Live game room |
| `/rooms/:roomId` | Redirects to bingo room (legacy URL) |

## Socket events (manager)

| Emit | Effect |
|------|--------|
| `new-match` | Start game |
| `play-match` | Resume calling |
| `pause-match` | Pause calling |
| `end-match` | End game, unlock cards |
| `reset-match` | Clear numbers & unlock |
| `change-speed` | Ball call interval (ms) |

## Production checklist

| Variable | Requirement |
|----------|-------------|
| `NODE_ENV=production` | Disables TypeORM `synchronize` (use migrations) |
| `SECRET_KEY` | Random string, **32+ characters** (startup fails if weak/missing) |
| `ADMIN_PASSWORD` | Required — bootstrap will not start without it |
| `CORS_ORIGIN` | Required — comma-separated frontend URLs (HTTP + WebSocket) |

Card IDs use **`ROOM{id}-CAR{0001}`** everywhere. Legacy `ROOM{id}-CARD{0001}` rows still resolve on lookup.

## Admin UI structure

`AdminDashboard.vue` is the shell (nav + layout). Tab content lives in:

- `client/src/components/admin/AdminDashboardTab.vue`
- `AdminRoomsTab.vue`, `AdminUsersTab.vue`, `AdminRegisterTab.vue`, `AdminCardsTab.vue`, `AdminProfileTab.vue`

Shared state: `useAdminDashboard()` composable (singleton).

- Build client: `cd client && npm run build`
- Run: `npm run build && npm run start:prod`

## Electron

The desktop app starts the Nest backend via `electron/main.js` with `ELECTRON_MODE=true` (SQL.js database in `~/.bingo/bingo.db` — no native SQLite build required).

Test Electron mode locally:

```bash
npm run build
ELECTRON_MODE=true NODE_ENV=development node dist/main.js
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Backend watch mode |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `cd client && npm run build` | Production frontend build |
