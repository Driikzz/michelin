CREATE TABLE votes (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id     INTEGER NOT NULL REFERENCES room_players(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  vote          BOOLEAN NOT NULL,
  voted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, restaurant_id)
);
