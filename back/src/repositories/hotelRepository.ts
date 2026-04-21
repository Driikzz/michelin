import { pool } from '../db/pool';
import type { Hotel, HotelSearchParams } from '../types/hotel';
import type { Tag } from '../types/restaurant';
import type { IHotelRepository } from './IHotelRepository';

type HotelRow = Omit<Hotel, 'images' | 'tags'>;

export class HotelRepository implements IHotelRepository {
  async search(params: HotelSearchParams): Promise<Hotel[]> {
    const values: unknown[] = [];
    let i = 1;

    const lat = params.lat ?? 0;
    const lng = params.lng ?? 0;
    values.push(lat, lng);
    const distanceExpr = `(6371 * acos(LEAST(1.0,
      cos(radians($${i})) * cos(radians(h.latitude))
      * cos(radians(h.longitude) - radians($${i + 1}))
      + sin(radians($${i})) * sin(radians(h.latitude))
    )))`;
    i += 2;

    const conditions: string[] = [];
    let tagJoin = '';
    let tagHaving = '';

    if (params.price !== undefined) {
      conditions.push(`h.price_category = $${i++}`);
      values.push(params.price);
    }

    if (params.query) {
      conditions.push(`h.name ILIKE $${i++}`);
      values.push(`%${params.query}%`);
    }

    if (params.tags && params.tags.length > 0) {
      tagJoin = 'JOIN hotel_tags ht ON ht.hotel_id = h.id';
      conditions.push(`ht.tag_id = ANY($${i++})`);
      values.push(params.tags);
      tagHaving = `HAVING COUNT(DISTINCT ht.tag_id) = ${params.tags.length}`;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const radius = params.radius ?? 5;
    const limit = params.limit ?? 50;
    values.push(radius, limit);

    const sql = `
      SELECT sub.id FROM (
        SELECT h.id, ${distanceExpr} AS distance_km
        FROM hotels h ${tagJoin}
        ${whereClause}
        GROUP BY h.id, h.latitude, h.longitude
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

  async findById(id: string): Promise<Hotel | null> {
    const rows = await this.findByIds([id]);
    return rows[0] ?? null;
  }

  async findByIds(ids: string[]): Promise<Hotel[]> {
    if (ids.length === 0) return [];

    const res = await pool.query<HotelRow>(
      `SELECT id, name, description, michelin_rank, price_category,
              phone, website_url, address, postal_code, city, country,
              latitude, longitude, created_at
       FROM hotels
       WHERE id = ANY($1)`,
      [ids],
    );

    const imageRes = await pool.query<{ hotel_id: string; image_url: string }>(
      'SELECT hotel_id, image_url FROM hotel_images WHERE hotel_id = ANY($1)',
      [ids],
    );

    const tagRes = await pool.query<{ hotel_id: string; tag_id: number; tag_name: string }>(
      `SELECT ht.hotel_id, t.id AS tag_id, t.name AS tag_name
       FROM hotel_tags ht JOIN tags t ON t.id = ht.tag_id
       WHERE ht.hotel_id = ANY($1)`,
      [ids],
    );

    const imageMap = new Map<string, string[]>();
    for (const row of imageRes.rows) {
      const list = imageMap.get(row.hotel_id) ?? [];
      list.push(row.image_url);
      imageMap.set(row.hotel_id, list);
    }

    const tagMap = new Map<string, Tag[]>();
    for (const row of tagRes.rows) {
      const list = tagMap.get(row.hotel_id) ?? [];
      list.push({ id: row.tag_id, name: row.tag_name });
      tagMap.set(row.hotel_id, list);
    }

    return res.rows.map((h) => ({
      ...h,
      images: imageMap.get(h.id) ?? [],
      tags: tagMap.get(h.id) ?? [],
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
