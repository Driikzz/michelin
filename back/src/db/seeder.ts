import { existsSync, readFileSync } from 'fs';
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

interface RawEntity {
  identifier: string;
  name: string;
  michelin_award: string | null;
  price_category: { code: string } | null;
  cuisines: RawCuisine[];
  images: RawImage[] | null;
  _geoloc: { lat: number; lng: number } | null;
  city: { name: string } | null;
  country: { name: string } | null;
  _snippetResult?: { main_desc?: { value?: string } };
}

interface JsonFile {
  results: Array<{ hits: RawEntity[] }>;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadFiles(dataDir: string, fileNames: string[]): RawEntity[] {
  const allHits: RawEntity[] = [];
  for (const file of fileNames) {
    const filePath = join(dataDir, file);
    if (!existsSync(filePath)) {
      console.log(`  Skipping ${file} (not found)`);
      continue;
    }
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as JsonFile;
    for (const result of parsed.results) {
      allHits.push(...result.hits);
    }
  }
  return allHits;
}

function dedup(hits: RawEntity[]): RawEntity[] {
  const seen = new Set<string>();
  return hits.filter((r) => {
    if (seen.has(r.identifier)) return false;
    seen.add(r.identifier);
    return true;
  });
}

async function upsertTags(
  pool: Pool,
  entities: RawEntity[],
): Promise<Map<string, number>> {
  const allCuisines = new Map<string, string>();
  for (const r of entities) {
    for (const c of r.cuisines ?? []) {
      allCuisines.set(c.label, c.slug);
    }
  }

  const tagIdMap = new Map<string, number>();
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
  return tagIdMap;
}

async function seedEntities(
  pool: Pool,
  entities: RawEntity[],
  tagIdMap: Map<string, number>,
  table: 'restaurants' | 'hotels',
  imageTable: 'restaurant_images' | 'hotel_images',
  tagTable: 'restaurant_tags' | 'hotel_tags',
  fkCol: 'restaurant_id' | 'hotel_id',
): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const r of entities) {
    const michelinRank = r.michelin_award ? (MICHELIN_RANK_MAP[r.michelin_award] ?? null) : null;
    const priceCategory = r.price_category ? (PRICE_MAP[r.price_category.code] ?? null) : null;
    const description = r._snippetResult?.main_desc?.value ?? null;
    const lat = r._geoloc?.lat ?? null;
    const lng = r._geoloc?.lng ?? null;
    const city = r.city?.name ?? null;
    const country = r.country?.name ?? null;

    const res = await pool.query<{ id: string }>(
      `INSERT INTO ${table}
         (name, description, michelin_rank, price_category,
          latitude, longitude, city, country, external_id)
       VALUES ($1, $2, $3::michelin_rank, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (external_id) DO NOTHING
       RETURNING id`,
      [r.name, description, michelinRank, priceCategory, lat, lng, city, country, r.identifier],
    );

    const entityId = res.rows[0]?.id;
    if (!entityId) { skipped++; continue; }
    inserted++;

    const sortedImages = [...(r.images ?? [])].sort((a, b) => a.order - b.order);
    for (const img of sortedImages) {
      await pool.query(
        `INSERT INTO ${imageTable} (${fkCol}, image_url) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [entityId, img.url],
      );
    }

    for (const cuisine of r.cuisines ?? []) {
      const tagId = tagIdMap.get(cuisine.label);
      if (tagId === undefined) continue;
      await pool.query(
        `INSERT INTO ${tagTable} (${fkCol}, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [entityId, tagId],
      );
    }
  }

  console.log(`  ${table}: inserted ${inserted}, skipped ${skipped}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });

  try {
    console.log('Running migrations...');
    await runMigrations(pool);

    const dataDir = join(__dirname, 'datas');

    // ── Restaurants ───────────────────────────────────────────────────────
    console.log('\nSeeding restaurants...');
    const restaurantFiles = ['restaurant1.json', 'restaurant2.json', 'restaurant3.json'];
    const restaurantHits = dedup(loadFiles(dataDir, restaurantFiles));
    console.log(`Found ${restaurantHits.length} unique restaurants`);
    const restaurantTagMap = await upsertTags(pool, restaurantHits);
    console.log(`Upserted ${restaurantTagMap.size} tags`);
    await seedEntities(pool, restaurantHits, restaurantTagMap,
      'restaurants', 'restaurant_images', 'restaurant_tags', 'restaurant_id');

    // ── Hotels ────────────────────────────────────────────────────────────
    console.log('\nSeeding hotels...');
    const hotelFiles = ['hotel1.json', 'hotel2.json', 'hotel3.json'];
    const hotelHits = dedup(loadFiles(dataDir, hotelFiles));
    console.log(`Found ${hotelHits.length} unique hotels`);
    if (hotelHits.length > 0) {
      const hotelTagMap = await upsertTags(pool, hotelHits);
      console.log(`Upserted ${hotelTagMap.size} tags`);
      await seedEntities(pool, hotelHits, hotelTagMap,
        'hotels', 'hotel_images', 'hotel_tags', 'hotel_id');
    } else {
      console.log('  No hotel files found, skipping.');
    }

    console.log('\nSeeding complete.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
