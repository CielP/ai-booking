# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A hotel room booking website for a 5-room hotel (rooms 101–105). Built with React (Vite) frontend, Express backend, and PostgreSQL — all orchestrated via Docker Compose. The repo also uses **OpenSpec**, a spec-driven workflow framework for AI-assisted development.

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

Copy `.env.example` to `.env` before first run. The database is initialized automatically from `docker/init.sql` on first start.

## Backend

**Entry point**: [backend/src/index.js](backend/src/index.js)  
**DB connection pool**: [backend/src/db.js](backend/src/db.js) — uses `pg.Pool`, reads `DB_*` env vars  
**Routes**:
- `GET /api/rooms/available?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` — returns rooms not conflicting with active bookings
- `POST /api/bookings` — creates booking; uses a transaction with `SELECT ... FOR UPDATE` to prevent double-booking
- `GET /api/bookings?email=` — lists bookings by guest email
- `DELETE /api/bookings/:id` — cancels booking after verifying `email` in request body matches `guest_email`

All routes return `{ error: "<message>" }` on failure. Date overlap logic: a conflict exists when `check_in < existing.check_out AND check_out > existing.check_in` (adjacent bookings are allowed).

## Frontend

**Entry**: [frontend/src/main.jsx](frontend/src/main.jsx) → [frontend/src/App.jsx](frontend/src/App.jsx)  
App is a single-page tab layout with four pages under [frontend/src/pages/](frontend/src/pages/):
- `AvailableRooms.jsx` — date search → room grid; clicking a room navigates to BookRoom with prefill
- `BookRoom.jsx` — booking form; accepts a `prefill` prop `{ room, checkIn, checkOut }` from AvailableRooms
- `MyBookings.jsx` — lookup by email
- `CancelBooking.jsx` — cancel by booking UUID + email

All styles are in [frontend/src/index.css](frontend/src/index.css) (no CSS framework). The Vite dev server proxies `/api` → `http://api:3000` (Docker internal hostname).

## Database Schema

Defined in [docker/init.sql](docker/init.sql). Two tables:
- `rooms(room_number PK, description)` — seeded with 101–105 on init
- `bookings(id UUID PK, room_number FK, guest_name, guest_email, check_in DATE, check_out DATE, notes, status, created_at)` — `status` is `active` or `cancelled`

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
