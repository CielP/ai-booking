# 山景旅宿 — Hotel Room Booking System

A full-stack hotel room booking web app for a 5-room hotel (rooms 101–105). Features user authentication, role-based access control, an admin dashboard, and an AI customer service chatbot powered by Claude + RAG. The frontend uses a navy + gold design system with Navbar + Sidebar navigation and light/dark theme support.

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19 + Vite 8, plain CSS |
| Backend    | Node.js 20 + Express 4 |
| Database   | PostgreSQL 16 + pgvector |
| LLM        | Claude (Anthropic SDK) |
| Embedding  | OpenAI text-embedding-3-small |
| Auth       | JWT (httpOnly Cookie) + bcrypt |
| Infra (Dev)  | Docker Compose |
| Infra (Prod) | AWS ECS Fargate, RDS, ALB, Terraform |

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

### Production Deployment (AWS)

Production is deployed on AWS ECS Fargate at **https://wsterling.org/mountain-lodge/**.

**Infrastructure** (Terraform):
- VPC with 2 public + 2 private subnets
- ECS Fargate (Nginx + Node.js sidecar containers)
- RDS PostgreSQL 16 + pgvector (db.t3.micro)
- ALB + HTTPS (ACM certificate, DNS validation)
- Secrets Manager (JWT, DB password, API keys)
- ECR (frontend + backend repositories)
- CloudWatch Logs
- Region: `ap-northeast-1` (Tokyo)

**Deploy**:
```bash
# Build, push images to ECR, and update ECS service
./scripts/deploy.sh

# Initialize RDS database
./scripts/init-db.sh
```

See `terraform/` for infrastructure-as-code and `terraform/state/` for the S3 state backend configuration.

**Tear down** (destroy all AWS resources):
```bash
# 1. Destroy application resources (VPC, ECS, RDS, ALB, etc.)
cd terraform
terraform destroy

# 2. (Optional) Destroy state backend (S3 bucket + DynamoDB table)
#    Empty the S3 bucket first (including versioned objects), then destroy:
cd terraform/state
aws s3api list-object-versions --bucket mountain-lodge-terraform-state \
  --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json | \
  aws s3api delete-objects --bucket mountain-lodge-terraform-state --delete file:///dev/stdin
terraform destroy
```

> **Important**: Always destroy `terraform/` before `terraform/state/` — the state backend must exist while Terraform tracks which resources to delete. RDS data will be permanently lost after destroy.

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
- AI customer service chatbot (floating chat widget「小山 AI 客服」, Claude + RAG)
- Manage knowledge base (CRUD, Markdown import, re-embed)

### Anonymous visitor
- Browse available rooms only; all other actions require login
- Login and Register buttons are in the Navbar (top-right)

### Design & UX
- Navy (#1B2838) + gold (#C4A265) design system with CSS Custom Properties
- Light/dark theme toggle with localStorage persistence
- Sticky Navbar + collapsible Sidebar navigation (replaces tab layout)
- CSS gradient Hero section on the room search page (mountain imagery)
- Noto Serif TC + Inter fonts via Google Fonts
- Responsive: desktop ≥1024px, tablet 768–1023px, mobile <768px

## Project Structure

```
.
├── backend/
│   └── src/
│       ├── index.js              # Express entry point + /api/health
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
│   ├── Dockerfile.prod           # Multi-stage: Vite build → Nginx (production)
│   ├── nginx.conf                # Subpath /mountain-lodge/ routing + API proxy
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Navbar + Sidebar layout + theme toggle
│       ├── App.css               # Minimal (tokens in index.css)
│       ├── index.css             # Design system (CSS variables, all styles)
│       ├── config.js             # API_BASE from VITE_API_BASE env var
│       ├── context/
│       │   └── AuthContext.jsx   # Global auth state (useAuth hook)
│       ├── components/
│       │   └── ChatWidget.jsx    # Floating AI chat「小山 AI 客服」(admin-only, SSE)
│       ├── pages/
│       │   ├── AvailableRooms.jsx # Hero section + room search
│       │   ├── BookRoom.jsx
│       │   ├── MyBookings.jsx    # Includes inline cancel
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── AdminDashboard.jsx # 4 sub-tabs incl. knowledge mgmt
│       └── assets/
├── docker/
│   └── init.sql                  # Schema + seed data (incl. pgvector)
├── terraform/                    # AWS infrastructure (IaC)
│   ├── main.tf                   # Provider + S3 backend
│   ├── variables.tf              # Input variables
│   ├── outputs.tf                # ALB DNS, ECR URLs, RDS endpoint
│   ├── vpc.tf                    # VPC, subnets, IGW, route tables
│   ├── security_groups.tf        # ALB, ECS, RDS security groups
│   ├── ecr.tf                    # ECR repositories
│   ├── secrets.tf                # Secrets Manager
│   ├── rds.tf                    # RDS PostgreSQL 16 + pgvector
│   ├── acm.tf                    # ACM certificate (DNS validation)
│   ├── alb.tf                    # ALB + HTTPS listener + target group
│   ├── ecs.tf                    # ECS Fargate cluster + service + task def
│   ├── cloudwatch.tf             # CloudWatch Log Groups
│   └── state/
│       └── main.tf               # S3 + DynamoDB state backend
├── scripts/
│   ├── deploy.sh                 # Build, push ECR, update ECS service
│   └── init-db.sh                # Initialize RDS database
├── docker-compose.yml
└── .env.example
```

## API Reference

### Health Check

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check endpoint (returns 200) |

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

### Knowledge Base (requires admin role)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/admin/knowledge` | List all chunks (without embedding) |
| POST   | `/api/admin/knowledge` | Create chunk; auto-generates embedding |
| PATCH  | `/api/admin/knowledge/:id` | Update chunk; auto-regenerates embedding |
| DELETE | `/api/admin/knowledge/:id` | Delete chunk |
| POST   | `/api/admin/knowledge/import` | Split Markdown by H2; UPSERT on title |
| POST   | `/api/admin/knowledge/reembed` | Regenerate all embeddings |

### Chat (requires admin role)

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/chat` | SSE streaming; RAG + Claude + tool use |

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

knowledge_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) UNIQUE NOT NULL,
  content       TEXT,
  embedding     vector(1536),  -- pgvector; HNSW index (cosine)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
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

# AI (for chatbot & knowledge base)
ANTHROPIC_API_KEY # Claude API key for AI chatbot
OPENAI_API_KEY    # OpenAI API key for text-embedding-3-small

# Production only
CORS_ORIGIN       # Allowed CORS origin (e.g. https://wsterling.org)
VITE_API_BASE     # API base path prefix (empty string in dev)
VITE_BASE         # Vite base path (e.g. /mountain-lodge/)
```
