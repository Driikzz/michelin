CREATE TYPE game_mode AS ENUM ('FAST', 'CLASSIC', 'CHAOS');
CREATE TYPE room_status AS ENUM ('WAITING', 'PLAYING', 'FINISHED');

CREATE TABLE game_rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_mode    game_mode NOT NULL,
  status       room_status NOT NULL DEFAULT 'WAITING',
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  price_filter SMALLINT CHECK (price_filter BETWEEN 1 AND 4),
  radius_km    DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  tag_ids      INTEGER[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_players (
  id        SERIAL PRIMARY KEY,
  room_id   UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_id  UUID REFERENCES guests(id) ON DELETE SET NULL,
  nickname  TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_player_identity CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  )
);
