import 'dotenv/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { runMigrations } from './migrations/migrationRunner';

// ─── Types matching the new worldwide JSON format ────────────────────────────

interface RawCuisine {
  label: string;
  slug: string;
}

interface HoursSlot {
  closed: boolean;
  closes: string;
  opens: string;
}

interface RawRestaurant {
  externalId: string;
  name: string;
  slug: string;
  country: { name: string; code: string };
  region: { name: string };
  city: string;
  citySlug: string;
  postalCode: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  coverImageUrl: string | null;
  description: string | null;
  url: string | null;
  restaurant: {
    distinction: string | null;
    greenStar: boolean;
    cuisines: RawCuisine[];
    chef: string | null;
    currency: string | null;
    guideYear: number | null;
    facilities: string[];
    daysOpen: string[];
    hoursOfOperation: Record<string, HoursSlot[]> | null;
  };
}

interface RawHotel {
  externalId: string;
  name: string;
  slug: string;
  country: { name: string; code: string };
  region: { name: string };
  city: string;
  citySlug: string;
  postalCode: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  coverImageUrl: string | null;
  description: string | null;
  url: string | null;
  lodging: {
    keysLevel: number | null;
    lodgingType: string | null;
    roomsCount: number | null;
    amenities: { id: number; amenity: string }[];
    isPlus: boolean;
    neighborhood: string | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function derivePriceCategory(distinction: string | null, externalId: string): number {
  switch (distinction) {
    case 'three_stars': return 4;
    case 'two_stars':   return 3;
    case 'one_star':    return 2;
    case 'bib_gourmand': return 1;
    default: {
      // Deterministic spread 1–4 based on external ID so reruns stay consistent
      let hash = 0;
      for (let i = 0; i < externalId.length; i++) hash = (hash * 31 + externalId.charCodeAt(i)) >>> 0;
      return (hash % 4) + 1;
    }
  }
}

// ─── Mappings ────────────────────────────────────────────────────────────────

const DISTINCTION_MAP: Record<string, string> = {
  three_stars:  '3_stars',
  two_stars:    '2_stars',
  one_star:     '1_star',
  bib_gourmand: 'bib_gourmand',
  selected:     'selected',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJsonFile<T>(filePath: string): T[] {
  if (!existsSync(filePath)) {
    console.log(`  Skipping ${filePath} (not found)`);
    return [];
  }
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T[];
}

function dedupById<T extends { externalId: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.externalId)) return false;
    seen.add(item.externalId);
    return true;
  });
}

function prioritizeAndCap<T extends { country: { code: string }; citySlug: string }>(
  items: T[],
  cap: number,
): T[] {
  const lyon    = items.filter((e) => e.citySlug === 'lyon');
  const frOther = items.filter((e) => e.country.code === 'FR' && e.citySlug !== 'lyon');
  const rest    = items.filter((e) => e.country.code !== 'FR');
  return [...lyon, ...frOther, ...rest].slice(0, cap);
}

async function upsertRestaurantTags(
  pool: Pool,
  restaurants: RawRestaurant[],
): Promise<Map<string, number>> {
  const labels = new Set<string>();
  for (const r of restaurants) {
    for (const c of r.restaurant.cuisines ?? []) labels.add(c.label);
  }
  const tagIdMap = new Map<string, number>();
  for (const label of labels) {
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

async function upsertHotelTags(
  pool: Pool,
  hotels: RawHotel[],
): Promise<Map<string, number>> {
  const labels = new Set<string>();
  for (const h of hotels) {
    for (const a of h.lodging.amenities ?? []) labels.add(a.amenity);
  }
  const tagIdMap = new Map<string, number>();
  for (const label of labels) {
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

async function seedRestaurants(
  pool: Pool,
  restaurants: RawRestaurant[],
  tagIdMap: Map<string, number>,
): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const r of restaurants) {
    const michelinRank = r.restaurant.distinction
      ? (DISTINCTION_MAP[r.restaurant.distinction] ?? null)
      : null;
    const priceCategory = derivePriceCategory(r.restaurant.distinction ?? null, r.externalId);

    const res = await pool.query<{ id: string }>(
      `INSERT INTO restaurants
         (name, description, michelin_rank, price_category,
          phone, website_url, address, postal_code, city, country,
          latitude, longitude, external_id,
          slug, region, city_slug, email, michelin_url,
          green_star, chef, currency, guide_year,
          days_open, hours_of_operation, facilities)
       VALUES
         ($1,  $2,  $3::michelin_rank, $4,
          $5,  $6,  $7,  $8,  $9,  $10,
          $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22,
          $23, $24, $25)
       ON CONFLICT (external_id) DO NOTHING
       RETURNING id`,
      [
        r.name,
        r.description ? r.description.replace(/<[^>]*>/g, '') : null,
        michelinRank,
        priceCategory,
        r.phone,
        r.website,
        r.address || null,
        r.postalCode || null,
        r.city || null,
        r.country.name,
        r.lat,
        r.lng,
        r.externalId,
        r.slug || null,
        r.region?.name ?? null,
        r.citySlug || null,
        r.email,
        r.url,
        r.restaurant.greenStar ?? false,
        r.restaurant.chef,
        r.restaurant.currency,
        r.restaurant.guideYear,
        r.restaurant.daysOpen?.length ? r.restaurant.daysOpen : null,
        r.restaurant.hoursOfOperation ? JSON.stringify(r.restaurant.hoursOfOperation) : null,
        r.restaurant.facilities?.length ? r.restaurant.facilities : null,
      ],
    );

    const entityId = res.rows[0]?.id;
    if (!entityId) { skipped++; continue; }
    inserted++;

    if (r.coverImageUrl) {
      await pool.query(
        `INSERT INTO restaurant_images (restaurant_id, image_url) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [entityId, r.coverImageUrl],
      );
    }

    for (const cuisine of r.restaurant.cuisines ?? []) {
      const tagId = tagIdMap.get(cuisine.label);
      if (tagId === undefined) continue;
      await pool.query(
        `INSERT INTO restaurant_tags (restaurant_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [entityId, tagId],
      );
    }
  }

  console.log(`  restaurants: inserted ${inserted}, skipped ${skipped}`);
}

async function seedHotels(
  pool: Pool,
  hotels: RawHotel[],
  tagIdMap: Map<string, number>,
): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const h of hotels) {
    const hotelPriceCategory = derivePriceCategory(
      h.lodging.keysLevel ? `${h.lodging.keysLevel}_key` : null,
      h.externalId,
    );

    const res = await pool.query<{ id: string }>(
      `INSERT INTO hotels
         (name, description, michelin_rank, price_category,
          phone, website_url, address, postal_code, city, country,
          latitude, longitude, external_id,
          slug, region, city_slug, email, michelin_url,
          keys_level, lodging_type, rooms_count,
          amenities, is_plus, neighborhood)
       VALUES
         ($1,  $2,  $3::michelin_rank, $4,
          $5,  $6,  $7,  $8,  $9,  $10,
          $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21,
          $22, $23, $24)
       ON CONFLICT (external_id) DO NOTHING
       RETURNING id`,
      [
        h.name,
        h.description ? h.description.replace(/<[^>]*>/g, '') : null,
        null,
        hotelPriceCategory,
        h.phone,
        h.website,
        h.address || null,
        h.postalCode || null,
        h.city || null,
        h.country.name,
        h.lat,
        h.lng,
        h.externalId,
        h.slug || null,
        h.region?.name ?? null,
        h.citySlug || null,
        h.email,
        h.url,
        h.lodging.keysLevel,
        h.lodging.lodgingType,
        h.lodging.roomsCount,
        h.lodging.amenities?.length ? JSON.stringify(h.lodging.amenities) : null,
        h.lodging.isPlus ?? false,
        h.lodging.neighborhood,
      ],
    );

    const entityId = res.rows[0]?.id;
    if (!entityId) { skipped++; continue; }
    inserted++;

    if (h.coverImageUrl) {
      await pool.query(
        `INSERT INTO hotel_images (hotel_id, image_url) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [entityId, h.coverImageUrl],
      );
    }

    for (const amenity of h.lodging.amenities ?? []) {
      const tagId = tagIdMap.get(amenity.amenity);
      if (tagId === undefined) continue;
      await pool.query(
        `INSERT INTO hotel_tags (hotel_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [entityId, tagId],
      );
    }
  }

  console.log(`  hotels: inserted ${inserted}, skipped ${skipped}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SEED_CAP = 5_000;

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });

  try {
    console.log('Running migrations...');
    await runMigrations(pool);

    const dataDir = join(__dirname, 'datas');

    // ── Restaurants ───────────────────────────────────────────────────────
    console.log('\nSeeding restaurants...');
    const allRestaurants = dedupById(
      loadJsonFile<RawRestaurant>(join(dataDir, 'restaurants-worldwide.json')),
    );
    console.log(`Loaded ${allRestaurants.length} unique restaurants`);
    const restaurants = prioritizeAndCap(allRestaurants, SEED_CAP);
    console.log(`Seeding ${restaurants.length} (Lyon-first, France-priority, cap ${SEED_CAP})`);
    const restaurantTagMap = await upsertRestaurantTags(pool, restaurants);
    console.log(`Upserted ${restaurantTagMap.size} restaurant tags`);
    await seedRestaurants(pool, restaurants, restaurantTagMap);

    // ── Hotels ────────────────────────────────────────────────────────────
    console.log('\nSeeding hotels...');
    const allHotels = dedupById(
      loadJsonFile<RawHotel>(join(dataDir, 'hotels-worldwide.json')),
    );
    console.log(`Loaded ${allHotels.length} unique hotels`);
    const hotels = prioritizeAndCap(allHotels, SEED_CAP);
    console.log(`Seeding ${hotels.length} (Lyon-first, France-priority, cap ${SEED_CAP})`);
    const hotelTagMap = await upsertHotelTags(pool, hotels);
    console.log(`Upserted ${hotelTagMap.size} hotel tags`);
    await seedHotels(pool, hotels, hotelTagMap);

    console.log('\nSeeding complete.');
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
