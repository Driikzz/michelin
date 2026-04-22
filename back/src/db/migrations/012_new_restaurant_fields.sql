ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS slug               TEXT,
  ADD COLUMN IF NOT EXISTS region             TEXT,
  ADD COLUMN IF NOT EXISTS city_slug          TEXT,
  ADD COLUMN IF NOT EXISTS email              TEXT,
  ADD COLUMN IF NOT EXISTS michelin_url       TEXT,
  ADD COLUMN IF NOT EXISTS green_star         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS chef               TEXT,
  ADD COLUMN IF NOT EXISTS currency           TEXT,
  ADD COLUMN IF NOT EXISTS guide_year         SMALLINT,
  ADD COLUMN IF NOT EXISTS days_open          TEXT[],
  ADD COLUMN IF NOT EXISTS hours_of_operation JSONB,
  ADD COLUMN IF NOT EXISTS facilities         TEXT[];
