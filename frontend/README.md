# Frontend — Hotel Room Booking

React 19 + Vite 8 single-page app. Part of the `ai-booking` Docker Compose stack.

## Development

The frontend is built into a Docker image and served via Vite dev server. Run from the project root:

```bash
docker compose up --build -d web
docker compose logs -f web
```

The Vite dev server proxies `/api/*` → `http://api:3000` (Docker internal hostname).

## Structure

```
src/
├── main.jsx
├── App.jsx                  # Tab layout (per role) + header auth buttons
├── index.css                # All styles (no CSS framework)
├── context/
│   └── AuthContext.jsx      # Global auth state via useAuth() hook
└── pages/
    ├── AvailableRooms.jsx
    ├── BookRoom.jsx
    ├── MyBookings.jsx
    ├── CancelBooking.jsx
    ├── Login.jsx
    ├── Register.jsx
    └── AdminDashboard.jsx
```

## Auth State

`useAuth()` returns `{ user, login, logout }`:
- `user === undefined` — loading (initial fetch to `/api/auth/me` in progress)
- `user === null` — anonymous
- `user === { id, name, email, role }` — logged in

All protected `fetch` calls include `credentials: 'include'` to send the JWT cookie.
