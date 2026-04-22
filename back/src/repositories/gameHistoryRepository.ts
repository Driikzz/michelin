import { pool } from '../db/pool';
import type { AddHistoryEntryParams, GameHistoryEntry, IGameHistoryRepository } from './IGameHistoryRepository';

export class GameHistoryRepository implements IGameHistoryRepository {
  async addEntry(params: AddHistoryEntryParams): Promise<void> {
    await pool.query(
      `INSERT INTO game_history
         (user_id, room_id, entity_id, entity_type, entity_name, entity_image, entity_city, xp_gained)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        params.userId,
        params.roomId,
        params.entityId,
        params.entityType,
        params.entityName,
        params.entityImage ?? null,
        params.entityCity ?? null,
        params.xpGained,
      ],
    );
  }

  async getByUserId(userId: string, limit = 20): Promise<GameHistoryEntry[]> {
    const res = await pool.query<GameHistoryEntry>(
      `SELECT gh.id, gh.user_id, gh.room_id, gh.entity_id, gh.entity_type,
              gh.entity_name, gh.entity_image, gh.entity_city, gh.xp_gained, gh.played_at,
              COALESCE(r.latitude,  h.latitude)  AS latitude,
              COALESCE(r.longitude, h.longitude) AS longitude
       FROM game_history gh
       LEFT JOIN restaurants r ON gh.entity_id = r.id AND gh.entity_type = 'RESTAURANT'
       LEFT JOIN hotels      h ON gh.entity_id = h.id AND gh.entity_type = 'HOTEL'
       WHERE gh.user_id = $1
       ORDER BY gh.played_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return res.rows;
  }
}
