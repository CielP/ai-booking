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
  CONSTRAINT chk_dates CHECK (check_out > check_in)
);

CREATE INDEX idx_bookings_email ON bookings(guest_email);
CREATE INDEX idx_bookings_room_dates ON bookings(room_number, check_in, check_out);

INSERT INTO rooms (room_number, description) VALUES
  (101, '標準雙人房'),
  (102, '標準雙人房'),
  (103, '標準雙人房'),
  (104, '標準雙人房'),
  (105, '標準雙人房');
