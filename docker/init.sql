CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'guest',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
  room_number INT PRIMARY KEY,
  description TEXT
);

CREATE TABLE bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number  INT NOT NULL REFERENCES rooms(room_number),
  guest_name   VARCHAR(100) NOT NULL,
  guest_email  VARCHAR(255) NOT NULL,
  check_in     DATE NOT NULL,
  check_out    DATE NOT NULL,
  notes        TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id      UUID REFERENCES users(id),
  CONSTRAINT chk_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_bookings_room_dates ON bookings(room_number, check_in, check_out);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

INSERT INTO rooms (room_number, description) VALUES
  (101, '標準雙人房'),
  (102, '標準雙人房'),
  (103, '標準雙人房'),
  (104, '標準雙人房'),
  (105, '標準雙人房');

-- 預設 admin 帳號：admin@hotel.com
-- 密碼由 ADMIN_PASSWORD 環境變數控制，後端啟動時會自動同步
-- 此處的 hash 為初始值，實際密碼以環境變數為準
INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@hotel.com', '$2b$10$k69JJ1B6exKxppbiYCtQe.UOhlNj.GI4mfu1jyBk1k71zumeTqlOW', '系統管理員', 'admin');

-- 知識庫 chunks 表
CREATE TABLE knowledge_chunks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(200) NOT NULL UNIQUE,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_embedding ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);
