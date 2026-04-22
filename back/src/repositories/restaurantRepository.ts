import { pool } from '../db/pool';
import type { Restaurant, RestaurantSearchParams, Tag } from '../types/restaurant';
import type { IRestaurantRepository } from './IRestaurantRepository';

type RestaurantRow = Omit<Restaurant, 'images' | 'tags'>;

export class RestaurantRepository implements IRestaurantRepository {
  async search(params: RestaurantSearchParams): Promise<Restaurant[]> {
    const values: unknown[] = [];
    let i = 1;

    const lat = params.lat ?? 0;
    const lng = params.lng ?? 0;
    values.push(lat, lng);
    const distanceExpr = `(6371 * acos(LEAST(1.0,
      cos(radians($${i})) * cos(radians(r.latitude))
      * cos(radians(r.longitude) - radians($${i + 1}))
      + sin(radians($${i})) * sin(radians(r.latitude))
    )))`;
    i += 2;

    const conditions: string[] = [];
    let tagJoin = '';
    let tagHaving = '';

    if (params.prices && params.prices.length > 0) {
      conditions.push(`r.price_category = ANY($${i++}::smallint[])`);
      values.push(params.prices);
    }

    if (params.query) {
      conditions.push(`r.name ILIKE $${i++}`);
      values.push(`%${params.query}%`);
    }

    if (params.tags && params.tags.length > 0) {
      tagJoin = 'JOIN restaurant_tags rt ON rt.restaurant_id = r.id';
      conditions.push(`rt.tag_id = ANY($${i++})`);
      values.push(params.tags);
      tagHaving = '';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const radius = params.radius ?? 5;
    const limit = params.limit ?? 50;
    values.push(radius, limit);

    const sql = `
      SELECT sub.id FROM (
        SELECT r.id, ${distanceExpr} AS distance_km
        FROM restaurants r ${tagJoin}
        ${whereClause}
        GROUP BY r.id, r.latitude, r.longitude
        ${tagHaving}
      ) sub
      WHERE sub.distance_km < $${i++}
      ORDER BY sub.distance_km ASC
      LIMIT $${i}
    `;

    const res = await pool.query<{ id: string }>(sql, values);
    const ids = res.rows.map((r) => r.id);
    if (ids.length === 0) return [];
    return this.findByIds(ids);
  }

  async findById(id: string): Promise<Restaurant | null> {
    const rows = await this.findByIds([id]);
    return rows[0] ?? null;
  }

  async findByIds(ids: string[]): Promise<Restaurant[]> {
    if (ids.length === 0) return [];

    const res = await pool.query<RestaurantRow>(
      `SELECT id, name, description, michelin_rank, price_category,
              phone, website_url, address, postal_code, city, country,
              latitude, longitude, created_at,
              slug, region, city_slug, email, michelin_url,
              green_star, chef, currency, guide_year,
              days_open, hours_of_operation, facilities
       FROM restaurants
       WHERE id = ANY($1)`,
      [ids],
    );

    const imageRes = await pool.query<{ restaurant_id: string; image_url: string }>(
      'SELECT restaurant_id, image_url FROM restaurant_images WHERE restaurant_id = ANY($1)',
      [ids],
    );

    const tagRes = await pool.query<{ restaurant_id: string; tag_id: number; tag_name: string }>(
      `SELECT rt.restaurant_id, t.id AS tag_id, t.name AS tag_name
       FROM restaurant_tags rt JOIN tags t ON t.id = rt.tag_id
       WHERE rt.restaurant_id = ANY($1)`,
      [ids],
    );

    const imageMap = new Map<string, string[]>();
    for (const row of imageRes.rows) {
      const list = imageMap.get(row.restaurant_id) ?? [];
      list.push(row.image_url);
      imageMap.set(row.restaurant_id, list);
    }

    const tagMap = new Map<string, Tag[]>();
    for (const row of tagRes.rows) {
      const list = tagMap.get(row.restaurant_id) ?? [];
      list.push({ id: row.tag_id, name: row.tag_name });
      tagMap.set(row.restaurant_id, list);
    }

    return res.rows.map((r) => ({
      ...r,
      images: imageMap.get(r.id) ?? [],
      tags: tagMap.get(r.id) ?? [],
    }));
  }

  async getAllTags(): Promise<Tag[]> {
    const res = await pool.query<Tag>('SELECT id, name FROM tags ORDER BY name');
    return res.rows;
  }

  async getRandomTagIds(count: number): Promise<number[]> {
    const res = await pool.query<{ id: number }>(
      'SELECT id FROM tags ORDER BY random() LIMIT $1',
      [count],
    );
    return res.rows.map((r) => r.id);
  }
}
