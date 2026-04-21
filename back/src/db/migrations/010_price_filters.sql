-- Replace single price_filter with an array to support multi-price selection
ALTER TABLE game_rooms
  ADD COLUMN IF NOT EXISTS price_filters SMALLINT[] NOT NULL DEFAULT '{}';

-- Migrate existing non-null price_filter values into the new array column
UPDATE game_rooms
  SET price_filters = ARRAY[price_filter::SMALLINT]
  WHERE price_filter IS NOT NULL;
