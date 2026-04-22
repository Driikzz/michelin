CREATE TABLE IF NOT EXISTS game_history (
  id           SERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id      UUID REFERENCES game_rooms(id) ON DELETE SET NULL,
  entity_id    UUID NOT NULL,
  entity_type  entity_type NOT NULL,
  entity_name  VARCHAR(255) NOT NULL,
  entity_image TEXT,
  entity_city  VARCHAR(100),
  xp_gained    INTEGER NOT NULL DEFAULT 0,
  played_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id, played_at DESC);
