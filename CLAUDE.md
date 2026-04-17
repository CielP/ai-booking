# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

「山景旅宿」— a hotel room booking website for a 5-room hotel (rooms 101–105). Built with React (Vite) frontend, Express backend, and PostgreSQL + pgvector — all orchestrated via Docker Compose. The system has full user authentication (JWT + httpOnly Cookie) and RBAC (roles: `admin` / `guest`). It includes an AI customer service chatbot (admin-only) powered by Claude + RAG with a pgvector-backed knowledge base. The frontend uses a navy + gold design system with Navbar + Sidebar navigation, light/dark theme support, and a CSS gradient hero section. The repo also uses **OpenSpec**, a spec-driven workflow framework for AI-assisted development.

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
**Services**: [backend/src/services/](backend/src/services/) — `embedding.js` (OpenAI text-embedding-3-small wrapper), `rag.js` (pgvector cosine similarity search)  
**System prompt**: [backend/src/prompts/system.md](backend/src/prompts/system.md) — Claude system prompt template with `{{user_name}}`, `{{current_page}}`, `{{prefill_date}}`, `{{knowledge_context}}` placeholders

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

**Knowledge routes** (`backend/src/routes/knowledge.js`), all require `requireAdmin`:
- `GET /api/admin/knowledge` — list all chunks (without embedding column)
- `POST /api/admin/knowledge` — create chunk; auto-generates embedding
- `PATCH /api/admin/knowledge/:id` — update chunk; auto-regenerates embedding
- `DELETE /api/admin/knowledge/:id` — delete chunk
- `POST /api/admin/knowledge/import` — split Markdown by H2 headings, UPSERT on title
- `POST /api/admin/knowledge/reembed` — regenerate embeddings for all chunks

**Chat route** (`backend/src/routes/chat.js`), requires `requireAdmin`:
- `POST /api/chat` — SSE streaming endpoint; RAG search → Claude with tool use (`check_availability`) → streamed response; events: `{type:"text",content:"..."}`, `{type:"done"}`

All routes return `{ error: "<message>" }` on failure. Date overlap logic: a conflict exists when `check_in < existing.check_out AND check_out > existing.check_in` (adjacent bookings are allowed).

## Frontend

**Entry**: [frontend/src/main.jsx](frontend/src/main.jsx) → [frontend/src/App.jsx](frontend/src/App.jsx)  
**Auth context**: [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) — provides `{ user, login, logout }` via `useAuth()` hook; `user === undefined` means loading, `null` means anonymous

### Brand & Design System

Brand name: **山景旅宿**. All styles in [frontend/src/index.css](frontend/src/index.css) (no CSS framework). Design tokens defined as CSS Custom Properties in `:root` / `[data-theme="dark"]`:
- Primary: `#1B2838` (navy), Accent: `#C4A265` (gold), Background: `#F8F6F1` (warm white, light) / `#0F1923` (dark navy, dark)
- Fonts: Noto Serif TC (headings) + Inter (body) via Google Fonts CDN
- Light/dark theme toggle with localStorage persistence; index.html inline script prevents flash

### Layout

Sticky top **Navbar** + collapsible left **Sidebar** (replaces previous tab navigation):
- Navbar: brand name (🏔️ 山景旅宿), theme toggle (🌙/☀️), user info / auth buttons
- Sidebar: collapsed 60px (icon-only) ↔ expanded 220px (icon + text); state persisted in localStorage
- Mobile (<768px): Sidebar hidden by default, opens as overlay with backdrop
- Main content max-width: 1200px
- Responsive breakpoints: desktop ≥1024px, tablet 768–1023px, mobile <768px

Sidebar nav items depend on auth state:
- **Anonymous**: 查詢空房
- **Guest**: 查詢空房, 預訂房間, 我的訂單
- **Admin**: all guest items + 管理後台

Admin users also see a floating chat widget (bottom-right, branded as 「小山 AI 客服」).

Navbar right side: anonymous shows theme toggle + 登入 + 註冊 buttons; logged-in shows theme toggle + user name, role badge (admin only), and 登出 button.

Pages under [frontend/src/pages/](frontend/src/pages/):
- `AvailableRooms.jsx` — CSS gradient Hero section (mountain imagery + brand tagline「寧靜山林間的舒適住所」) → date search → room grid; clicking a room prefills BookRoom
- `BookRoom.jsx` — booking form; name/email auto-filled from JWT (not editable); accepts `prefill` prop `{ room, checkIn, checkOut }` from AvailableRooms
- `MyBookings.jsx` — auto-fetches own bookings via JWT cookie on mount; each active booking card has an inline cancel button (uses `window.confirm` + `DELETE /api/bookings/:id`)
- `Login.jsx` — email + password form
- `Register.jsx` — name + email + password form (password ≥ 8 chars)
- `AdminDashboard.jsx` — four sub-tabs: 訂單管理, 帳號管理, 房間管理, 知識庫管理

Components under [frontend/src/components/](frontend/src/components/):
- `ChatWidget.jsx` — floating chat FAB (💬/✕) with expandable chat window; SSE streaming; sends context (userName, currentPage, prefillDate); chat history kept in React state (last 10 messages)

All styles are in [frontend/src/index.css](frontend/src/index.css) (no CSS framework). The Vite dev server proxies `/api` → `http://api:3000` (Docker internal hostname). All protected `fetch` calls use `credentials: 'include'`.

## Database Schema

Defined in [docker/init.sql](docker/init.sql). Four tables:
- `users(id UUID PK, email UNIQUE, password_hash, name, role, is_active, created_at)` — seeded with one admin account on init
- `rooms(room_number INT PK, description)` — seeded with 101–105 on init
- `bookings(id UUID PK, room_number FK, user_id FK → users, guest_name, guest_email, check_in DATE, check_out DATE, notes, status, created_at)` — `status` is `active` or `cancelled`; `user_id` is nullable for legacy rows
- `knowledge_chunks(id UUID PK, title UNIQUE, content, embedding vector(1536), created_at, updated_at)` — HNSW index on embedding (cosine distance); used for RAG semantic search

## Environment Variables

See `.env.example`. Required vars:
```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
PGADMIN_EMAIL, PGADMIN_PASSWORD
JWT_SECRET        # sign/verify JWT tokens
JWT_EXPIRES_IN    # e.g. 7d
ADMIN_PASSWORD    # password for the seeded admin@hotel.com account
ANTHROPIC_API_KEY # Claude API key for AI chatbot
OPENAI_API_KEY    # OpenAI API key for text-embedding-3-small
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
