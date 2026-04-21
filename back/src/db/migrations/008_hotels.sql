CREATE TABLE hotels (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  description    TEXT,
  michelin_rank  michelin_rank,
  price_category SMALLINT CHECK (price_category BETWEEN 1 AND 4),
  phone          TEXT,
  website_url    TEXT,
  address        TEXT,
  postal_code    TEXT,
  city           TEXT,
  country        TEXT,
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  external_id    TEXT UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hotel_images (
  id        SERIAL PRIMARY KEY,
  hotel_id  UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

CREATE TABLE hotel_tags (
  hotel_id UUID    NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (hotel_id, tag_id)
);
