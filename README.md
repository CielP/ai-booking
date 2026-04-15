# AI Booking — Hotel Room Booking System

A full-stack hotel room booking web app for a 5-room hotel (rooms 101–105). Features user authentication, role-based access control, an admin dashboard, and an AI customer service chatbot powered by Claude + RAG.

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + Vite 8, plain CSS |
| Backend    | Node.js 20 + Express 4 |
| Database   | PostgreSQL 16 + pgvector |
| LLM        | Claude (Anthropic SDK) |
| Embedding  | OpenAI text-embedding-3-small |
| Auth       | JWT (httpOnly Cookie) + bcrypt |
| Infra      | Docker Compose |

## Getting Started

### Prerequisites

- Docker + Docker Compose

### Setup

```bash
# 1. Copy environment file and fill in values
cp .env.example .env

# 2. Start all services
docker compose up --build -d
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| API      | http://localhost:3000 |
| pgAdmin  | http://localhost:5050 |

The database schema and seed data (including the admin account) are applied automatically from `docker/init.sql` on first start.

### Default Admin Account

| Field    | Value |
|----------|-------|
| Email    | `admin@hotel.com` |
| Password | value of `ADMIN_PASSWORD` in `.env` |

## Features

### Guest (registered user)
- Browse available rooms by date range
- Book a room (name/email auto-filled from account)
- View own booking history
- Cancel own bookings (inline button on each active booking)

### Admin
- All guest features
- View all bookings across all users
- Cancel any booking
- Manage user accounts (change role, enable/disable)
- Edit room descriptions
- AI customer service chatbot (floating chat widget, Claude + RAG)
- Manage knowledge base (CRUD, Markdown import, re-embed)

### Anonymous visitor
- Browse available rooms only; all other actions require login
- Login and Register buttons are in the top-right header

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── index.js              # Express entry point
│       ├── db.js                 # pg.Pool instance
│       ├── middleware/
│       │   └── auth.js           # authenticate / requireAuth / requireAdmin
│       ├── services/
│       │   ├── embedding.js      # OpenAI embedding wrapper
│       │   └── rag.js            # pgvector cosine similarity search
│       ├── prompts/
│       │   └── system.md         # Claude system prompt template
│       └── routes/
│           ├── auth.js           # /api/auth/*
│           ├── bookings.js       # /api/bookings/*
│           ├── rooms.js          # /api/rooms/*
│           ├── admin.js          # /api/admin/users, /api/admin/rooms
│           ├── knowledge.js      # /api/admin/knowledge/*
│           └── chat.js           # /api/chat (SSE)
├── frontend/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Tab layout (per role) + header auth buttons
│       ├── context/
│       │   └── AuthContext.jsx   # Global auth state (useAuth hook)
│       ├── components/
│       │   └── ChatWidget.jsx    # Floating AI chat (admin-only, SSE)
│       ├── pages/
│       │   ├── AvailableRooms.jsx
│       │   ├── BookRoom.jsx
│       │   ├── MyBookings.jsx    # Includes inline cancel
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── AdminDashboard.jsx # 4 sub-tabs incl. knowledge mgmt
│       └── index.css
├── docker/
│   └── init.sql                  # Schema + seed data (incl. pgvector)
├── docker-compose.yml
└── .env.example
```

## API Reference

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create guest account; sets JWT cookie |
| POST | `/api/auth/login` | Login; sets JWT cookie |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET  | `/api/auth/me` | Return current user from cookie |

### Rooms (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rooms/available?check_in=&check_out=` | List rooms with no conflicts in date range |

### Bookings (requires login)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/bookings` | Guest: own bookings. Admin: all bookings |
| POST   | `/api/bookings` | Create booking; name/email taken from JWT |
| DELETE | `/api/bookings/:id` | Cancel booking; guest owns only, admin unrestricted |

### Admin (requires admin role)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/admin/users` | List all users |
| PATCH  | `/api/admin/users/:id` | Update role or is_active |
| DELETE | `/api/admin/users/:id` | Soft-delete (set is_active = false) |
| GET    | `/api/admin/rooms` | List all rooms |
| PATCH  | `/api/admin/rooms/:room_number` | Update room description |

All error responses use `{ "error": "<message>" }`.

## Database Schema

```sql
users (
  id            UUID PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'guest',  -- 'guest' | 'admin'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)

rooms (
  room_number   INT PRIMARY KEY,
  description   TEXT
)

bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number   INT REFERENCES rooms,
  user_id       UUID REFERENCES users,
  guest_name    VARCHAR(100),
  guest_email   VARCHAR(255),
  check_in      DATE,
  check_out     DATE,
  notes         TEXT,
  status        VARCHAR(20) DEFAULT 'active',  -- 'active' | 'cancelled'
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

Date conflict rule: `check_in < existing.check_out AND check_out > existing.check_in` (adjacent bookings are allowed).

## Environment Variables

See `.env.example` for all required variables:

```
# Database
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# pgAdmin
PGADMIN_EMAIL, PGADMIN_PASSWORD

# Auth
JWT_SECRET        # Secret key for signing JWT tokens
JWT_EXPIRES_IN    # Token lifetime, e.g. 7d
ADMIN_PASSWORD    # Password for the seeded admin@hotel.com account
```
