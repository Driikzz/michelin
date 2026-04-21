CREATE TABLE game_sessions (
  id         SERIAL PRIMARY KEY,
  room_id    UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at   TIMESTAMPTZ
);

CREATE TABLE game_restaurants (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  display_order SMALLINT NOT NULL DEFAULT 0
);
