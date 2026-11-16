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

Set the dynamic `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the environment for
first-run admin bootstrap. No administrator account or password is embedded in
the application.

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

The desktop app starts the Nest backend via `electron/main.js` with `ELECTRON_MODE=true` and stores its local SQLite database in `~/.bingo/bingo.db`.

### Account synchronization

The desktop backend keeps Bingo gameplay and financial data local. When configured,
it synchronizes only account identity, bcrypt password verifiers, role, and active
state with a separate NestJS instance running in `SYNC_SERVER_MODE=true`.

The central service uses MySQL and must be deployed separately from the desktop
database. Set `SYNC_DB_HOST`, `SYNC_DB_PORT`, `SYNC_DB_USER`, `SYNC_DB_PASS`,
`SYNC_DB_NAME`, `SYNC_SERVER_SECRET`, `SYNC_ENROLLMENT_TOKEN`, and
`SYNC_ADMIN_TOKEN` on the central service. Use HTTPS for `SYNC_SERVER_URL`.
See [`sync-server.env.example`](./sync-server.env.example) for the central
service configuration template.

### Central synchronization deployment

The synchronization server is a separate process and must not use a desktop
SQLite database. Provision MySQL and a least-privilege database user using
placeholders appropriate to your environment:

```sql
CREATE DATABASE bingo_sync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bingo_sync_app'@'%' IDENTIFIED BY '<GENERATE-AND-STORE-SECURELY>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
  ON bingo_sync.* TO 'bingo_sync_app'@'%';
FLUSH PRIVILEGES;
```

On the server, copy `sync-server.env.example` to a protected environment
file, set `SYNC_SERVER_MODE=true`, all `SYNC_DB_*` values, and independently
generated values for `SECRET_KEY`, `SYNC_SERVER_SECRET`,
`SYNC_ENROLLMENT_TOKEN`, `SYNC_PUBLISH_ENROLLMENT_TOKEN`, and
`SYNC_ADMIN_TOKEN`. Do not commit this file or put these values in an
installer. Install and build with:

```bash
npm ci
npm run build
SYNC_SERVER_MODE=true NODE_ENV=production node dist/main.js
```

Startup runs the central TypeORM migrations with `synchronize=false`. Confirm
`GET https://<YOUR-SYNC-HOST>/api/health` through the HTTPS reverse proxy before
enrolling devices. Terminate TLS at a maintained reverse proxy, restrict the
application port to localhost/private networking, rotate enrollment and admin
tokens, and apply request rate limiting at the proxy.

Back up MySQL using your approved encrypted backup process, for example
`mysqldump --single-transaction bingo_sync > <BACKUP_PATH>`. Test restoring to a
separate database before recovery. Device enrollment is performed by the
desktop with `SYNC_ENROLLMENT_TOKEN` (reader) or
`SYNC_PUBLISH_ENROLLMENT_TOKEN` (publisher); device revocation and central
account administration use `x-sync-admin-token` from an authenticated
administrative tool, never from the Vue application.

Packaged Electron builds do not contain secrets. Place runtime configuration in
`%APPDATA%\\Bingo\\config.json` before starting the application, for example:

```json
{
  "SECRET_KEY": "replace-with-a-random-32-character-secret",
  "ADMIN_PASSWORD": "set-the-existing-admin-password",
  "CORS_ORIGIN": "http://127.0.0.1:3000",
  "SYNC_SERVER_URL": "https://sync.example.com",
  "SYNC_ADMIN_TOKEN": "central-sync-admin-token",
  "SYNC_ENROLLMENT_TOKEN": "device-enrollment-token",
  "SYNC_PUBLISH_ENROLLMENT_TOKEN": "publisher-enrollment-token",
  "SYNC_DEVICE_ROLE": "reader",
  "OFFLINE_AUTH_DAYS": "30"
}
```

Laptop A, which publishes administrator-created accounts, must use
`SYNC_DEVICE_ROLE=publisher` and the separate
`SYNC_PUBLISH_ENROLLMENT_TOKEN`. Other laptops should use the reader token and
cannot upload accounts.

The per-installation device identity is generated once and stored in Windows
Credential Manager through `keytar`; it is not stored in the SQLite database.
Offline account authentication remains local and is permitted for 30 days after
the last successful synchronization by default.

Reader devices receive only explicitly assigned ordinary user accounts;
administrator account verifiers remain restricted to publisher devices. After
the publisher uploads an account, assign it to a reader with the central
administration API:

```bash
curl -X POST \
  -H "x-sync-admin-token: <SYNC_ADMIN_TOKEN>" \
  https://<YOUR-SYNC-HOST>/api/sync/devices/<DEVICE_ID>/users/<CENTRAL_USER_ID>
```

Remove an assignment with the corresponding
`PATCH /api/sync/devices/<DEVICE_ID>/users/<CENTRAL_USER_ID>/revoke` endpoint.
The reader receives the account on its next successful synchronization. Device
revocation still disables all synchronization and offline access for that
installation.

Test Electron mode locally:

```bash
npm run build
ELECTRON_MODE=true NODE_ENV=development node dist/main.js
```

Build the Windows installer with:

```bash
npm ci
npm run build
npm --prefix client ci
npm --prefix client run build
npm run dist
```

The installer contains no deployment secrets. Before first launch, create
`%APPDATA%\\Bingo\\config.json` with the required runtime values. On Laptop A
use publisher enrollment; on Laptop B use reader enrollment. Test the
workflow only with a real HTTPS central service: activate and synchronize
Laptop A, create a user, synchronize again, activate/synchronize Laptop B,
verify online login, disconnect the network, restart the application and
Windows, verify offline login and gameplay, then reconnect and verify account
deactivation and device revocation. Record each result; builds alone do not
prove the two-laptop workflow.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Backend watch mode |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `cd client && npm run build` | Production frontend build |
