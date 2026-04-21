import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { runMigrations } from './migrations/migrationRunner';

// ─── Types matching the JSON shape ──────────────────────────────────────────

interface RawImage {
  url: string;
  order: number;
}

interface RawCuisine {
  label: string;
  slug: string;
}

interface RawRestaurant {
  identifier: string;
  name: string;
  michelin_award: string | null;
  price_category: { code: string } | null;
  cuisines: RawCuisine[];
  images: RawImage[];
  _geoloc: { lat: number; lng: number } | null;
  city: { name: string } | null;
  country: { name: string } | null;
  _snippetResult?: { main_desc?: { value?: string } };
}

interface JsonFile {
  results: Array<{ hits: RawRestaurant[] }>;
}

// ─── Mappings ────────────────────────────────────────────────────────────────

const MICHELIN_RANK_MAP: Record<string, string> = {
  ONE_STAR: '1_star',
  TWO_STARS: '2_stars',
  THREE_STARS: '3_stars',
  BIB_GOURMAND: 'bib_gourmand',
  selected: 'selected',
};

const PRICE_MAP: Record<string, number> = {
  CAT_P01: 1,
  CAT_P02: 2,
  CAT_P03: 3,
  CAT_P04: 4,
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });

  try {
    console.log('Running migrations...');
    await runMigrations(pool);

    const dataDir = join(__dirname, 'datas');
    const files = ['restaurant1.json', 'restaurant2.json', 'restaurant3.json'];

    const allHits: RawRestaurant[] = [];
    for (const file of files) {
      const raw = readFileSync(join(dataDir, file), 'utf8');
      const parsed = JSON.parse(raw) as JsonFile;
      for (const result of parsed.results) {
        allHits.push(...result.hits);
      }
    }

    // Deduplicate by identifier
    const seen = new Set<string>();
    const restaurants: RawRestaurant[] = [];
    for (const r of allHits) {
      if (!seen.has(r.identifier)) {
        seen.add(r.identifier);
        restaurants.push(r);
      }
    }
    console.log(`Found ${restaurants.length} unique restaurants`);

    // ── 1. Collect all unique cuisine labels and upsert tags ──────────────
    const allCuisines = new Map<string, string>(); // label → slug
    for (const r of restaurants) {
      for (const c of r.cuisines) {
        allCuisines.set(c.label, c.slug);
      }
    }

    const tagIdMap = new Map<string, number>(); // label → db id

    for (const [label] of allCuisines) {
      const res = await pool.query<{ id: number }>(
        `INSERT INTO tags (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [label],
      );
      const row = res.rows[0];
      if (row) tagIdMap.set(label, row.id);
    }
    console.log(`Upserted ${tagIdMap.size} tags`);

    // ── 2. Insert restaurants ─────────────────────────────────────────────
    let inserted = 0;
    let skipped = 0;

    for (const r of restaurants) {
      const michelinRank = r.michelin_award
        ? (MICHELIN_RANK_MAP[r.michelin_award] ?? null)
        : null;
      const priceCategory = r.price_category
        ? (PRICE_MAP[r.price_category.code] ?? null)
        : null;
      const description = r._snippetResult?.main_desc?.value ?? null;
      const lat = r._geoloc?.lat ?? null;
      const lng = r._geoloc?.lng ?? null;
      const city = r.city?.name ?? null;
      const country = r.country?.name ?? null;

      const res = await pool.query<{ id: string }>(
        `INSERT INTO restaurants
           (name, description, michelin_rank, price_category,
            latitude, longitude, city, country, external_id)
         VALUES ($1, $2, $3::michelin_rank, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (external_id) DO NOTHING
         RETURNING id`,
        [r.name, description, michelinRank, priceCategory, lat, lng, city, country, r.identifier],
      );

      const restaurantId = res.rows[0]?.id;
      if (!restaurantId) {
        skipped++;
        continue;
      }
      inserted++;

      // Insert images (ordered)
      const sortedImages = [...(r.images ?? [])].sort((a, b) => a.order - b.order);
      for (const img of sortedImages) {
        await pool.query(
          `INSERT INTO restaurant_images (restaurant_id, image_url)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [restaurantId, img.url],
        );
      }

      // Link tags
      for (const cuisine of r.cuisines) {
        const tagId = tagIdMap.get(cuisine.label);
        if (tagId === undefined) continue;
        await pool.query(
          `INSERT INTO restaurant_tags (restaurant_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [restaurantId, tagId],
        );
      }
    }

    console.log(`Inserted: ${inserted} restaurants, skipped (already exist): ${skipped}`);
    console.log('Seeding complete.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
