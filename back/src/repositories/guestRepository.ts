import { pool } from '../db/pool';
import type { IGuestRepository } from './IGuestRepository';

type GuestRow = { id: string; nickname: string; created_at: Date };

export class GuestRepository implements IGuestRepository {
  async create(nickname: string): Promise<GuestRow> {
    const res = await pool.query<GuestRow>(
      'INSERT INTO guests (nickname) VALUES ($1) RETURNING id, nickname, created_at',
      [nickname],
    );
    const row = res.rows[0];
    if (!row) throw new Error('Guest creation failed');
    return row;
  }

  async findById(id: string): Promise<{ id: string; nickname: string } | null> {
    const res = await pool.query<{ id: string; nickname: string }>(
      'SELECT id, nickname FROM guests WHERE id = $1',
      [id],
    );
    return res.rows[0] ?? null;
  }
}
