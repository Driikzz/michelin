CREATE TYPE michelin_rank AS ENUM ('1_star', '2_stars', '3_stars', 'bib_gourmand', 'selected');

CREATE TABLE restaurants (
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
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE restaurant_images (
  id            SERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL
);

CREATE TABLE tags (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE restaurant_tags (
  restaurant_id UUID    NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  tag_id        INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (restaurant_id, tag_id)
);
