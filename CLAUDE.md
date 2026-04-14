# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A hotel room booking website for a 5-room hotel (rooms 101–105). Built with React (Vite) frontend, Express backend, and PostgreSQL — all orchestrated via Docker Compose. The system has full user authentication (JWT + httpOnly Cookie) and RBAC (roles: `admin` / `guest`). The repo also uses **OpenSpec**, a spec-driven workflow framework for AI-assisted development.

## Running the Application

```bash
# Start all services (db, api, frontend, pgAdmin)
docker compose up --build -d

# Stop services
docker compose down

# View logs
docker compose logs -f api
docker compose logs -f web
```

| Service  | URL                   | Notes                                     |
|----------|-----------------------|-------------------------------------------|
| Frontend | http://localhost:5173 | React + Vite dev server                   |
| API      | http://localhost:3000 | Express REST API                          |
| pgAdmin  | http://localhost:5050 | Login: see `.env` for credentials         |

Copy `.env.example` to `.env` before first run. The database is initialized automatically from `docker/init.sql` on first start. The default admin account is `admin@hotel.com` with password from `ADMIN_PASSWORD` in `.env`.

## Backend

**Entry point**: [backend/src/index.js](backend/src/index.js)  
**DB connection pool**: [backend/src/db.js](backend/src/db.js) — uses `pg.Pool`, reads `DB_*` env vars  
**Auth middleware**: [backend/src/middleware/auth.js](backend/src/middleware/auth.js) — `authenticate` (soft), `requireAuth` (401), `requireAdmin` (403)

**Auth routes** (`backend/src/routes/auth.js`):
- `POST /api/auth/register` — creates guest account; sets JWT httpOnly cookie on success
- `POST /api/auth/login` — validates credentials; sets JWT httpOnly cookie
- `POST /api/auth/logout` — clears JWT cookie
- `GET /api/auth/me` — returns current user from JWT cookie, or 401

**Booking routes** (`backend/src/routes/bookings.js`), all require `requireAuth`:
- `GET /api/bookings` — guest sees own bookings; admin sees all
- `POST /api/bookings` — creates booking; `guest_name`/`guest_email` come from JWT, not request body; uses a transaction with `SELECT ... FOR UPDATE` to prevent double-booking
- `DELETE /api/bookings/:id` — guest can only cancel own bookings (403 otherwise); admin can cancel any

**Admin routes** (`backend/src/routes/admin.js`), all require `requireAdmin`:
- `GET /api/admin/users` — list all users
- `PATCH /api/admin/users/:id` — update role or is_active; cannot self-disable
- `DELETE /api/admin/users/:id` — soft delete (sets `is_active = false`)
- `GET /api/admin/rooms` — list all rooms
- `PATCH /api/admin/rooms/:room_number` — update room description

**Room routes** (`backend/src/routes/rooms.js`), public:
- `GET /api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` — returns rooms not conflicting with active bookings

All routes return `{ error: "<message>" }` on failure. Date overlap logic: a conflict exists when `check_in < existing.check_out AND check_out > existing.check_in` (adjacent bookings are allowed).

## Frontend

**Entry**: [frontend/src/main.jsx](frontend/src/main.jsx) → [frontend/src/App.jsx](frontend/src/App.jsx)  
**Auth context**: [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) — provides `{ user, login, logout }` via `useAuth()` hook; `user === undefined` means loading, `null` means anonymous

App is a single-page tab layout. Visible tabs depend on auth state:
- **Anonymous**: 查詢空房, 登入, 註冊
- **Guest**: 查詢空房, 預訂, 我的訂單, 取消訂單, 登出
- **Admin**: all guest tabs + 管理後台

Pages under [frontend/src/pages/](frontend/src/pages/):
- `AvailableRooms.jsx` — date search → room grid; clicking a room prefills BookRoom
- `BookRoom.jsx` — booking form; name/email auto-filled from JWT (not editable); accepts `prefill` prop `{ room, checkIn, checkOut }` from AvailableRooms
- `MyBookings.jsx` — auto-fetches own bookings via JWT cookie on mount
- `CancelBooking.jsx` — cancel by booking UUID; ownership verified server-side via JWT
- `Login.jsx` — email + password form
- `Register.jsx` — name + email + password form (password ≥ 8 chars)
- `AdminDashboard.jsx` — three sub-tabs: 訂單管理, 帳號管理, 房間管理

All styles are in [frontend/src/index.css](frontend/src/index.css) (no CSS framework). The Vite dev server proxies `/api` → `http://api:3000` (Docker internal hostname). All protected `fetch` calls use `credentials: 'include'`.

## Database Schema

Defined in [docker/init.sql](docker/init.sql). Three tables:
- `users(id UUID PK, email UNIQUE, password_hash, name, role, is_active, created_at)` — seeded with one admin account on init
- `rooms(room_number INT PK, description)` — seeded with 101–105 on init
- `bookings(id UUID PK, room_number FK, user_id FK → users, guest_name, guest_email, check_in DATE, check_out DATE, notes, status, created_at)` — `status` is `active` or `cancelled`; `user_id` is nullable for legacy rows

## Environment Variables

See `.env.example`. Required vars:
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
PGADMIN_EMAIL, PGADMIN_PASSWORD
JWT_SECRET        # sign/verify JWT tokens
JWT_EXPIRES_IN    # e.g. 7d
ADMIN_PASSWORD    # password for the seeded admin@hotel.com account
```

## OpenSpec Workflow

The `/opsx:*` slash commands drive spec-first development. Use them when adding new features:

| Command | Purpose |
|---|---|
| `/opsx:propose <name>` | Create a change with all artifacts at once |
| `/opsx:apply <name>` | Implement tasks from a change's `tasks.md` |
| `/opsx:verify <name>` | Verify implementation against artifacts |
| `/opsx:archive <name>` | Archive a completed change |

Key `openspec` CLI commands:
```bash
openspec status --change "<name>" --json   # Check artifact status
openspec instructions apply --change "<name>" --json  # Get apply context
openspec list --json                        # List active changes
```

Accepted specs live in [openspec/specs/](openspec/specs/). Update [openspec/config.yaml](openspec/config.yaml) with tech stack context so artifact generation is accurate — the `context:` field is passed to Claude when creating proposals, specs, and designs.
