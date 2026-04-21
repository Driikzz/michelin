CREATE TYPE entity_type AS ENUM ('RESTAURANT', 'HOTEL');

ALTER TABLE game_rooms
  ADD COLUMN entity_type entity_type NOT NULL DEFAULT 'RESTAURANT';

CREATE TABLE game_hotels (
  id            SERIAL PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  hotel_id      UUID    NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  display_order SMALLINT NOT NULL DEFAULT 0
);

ALTER TABLE votes ALTER COLUMN restaurant_id DROP NOT NULL;
ALTER TABLE votes ADD COLUMN hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE;

ALTER TABLE votes ADD CONSTRAINT votes_one_entity CHECK (
  (restaurant_id IS NOT NULL AND hotel_id IS NULL) OR
  (restaurant_id IS NULL AND hotel_id IS NOT NULL)
);

ALTER TABLE votes DROP CONSTRAINT votes_session_id_player_id_restaurant_id_key;
CREATE UNIQUE INDEX votes_restaurant_unique
  ON votes(session_id, player_id, restaurant_id) WHERE restaurant_id IS NOT NULL;
CREATE UNIQUE INDEX votes_hotel_unique
  ON votes(session_id, player_id, hotel_id) WHERE hotel_id IS NOT NULL;
