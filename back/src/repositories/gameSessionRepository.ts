import { pool } from '../db/pool';
import type { EntityType, GameSession } from '../types/game';
import type { IGameSessionRepository } from './IGameSessionRepository';

export class GameSessionRepository implements IGameSessionRepository {
  async create(roomId: string): Promise<GameSession> {
    const res = await pool.query<GameSession>(
      'INSERT INTO game_sessions (room_id) VALUES ($1) RETURNING *',
      [roomId],
    );
    const row = res.rows[0];
    if (!row) throw new Error('Session creation failed');
    return row;
  }

  async findActiveByRoomId(roomId: string): Promise<GameSession | null> {
    const res = await pool.query<GameSession>(
      'SELECT * FROM game_sessions WHERE room_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
      [roomId],
    );
    return res.rows[0] ?? null;
  }

  async end(sessionId: number): Promise<void> {
    await pool.query('UPDATE game_sessions SET ended_at = now() WHERE id = $1', [sessionId]);
  }

  async addEntities(sessionId: number, entityIds: string[], entityType: EntityType): Promise<void> {
    if (entityIds.length === 0) return;
    const table = entityType === 'HOTEL' ? 'game_hotels' : 'game_restaurants';
    const col = entityType === 'HOTEL' ? 'hotel_id' : 'restaurant_id';
    const values: unknown[] = [];
    const placeholders = entityIds.map((id, idx) => {
      values.push(sessionId, id, idx);
      const base = idx * 3 + 1;
      return `($${base}, $${base + 1}, $${base + 2})`;
    });
    await pool.query(
      `INSERT INTO ${table} (session_id, ${col}, display_order) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  async getEntityIds(sessionId: number, entityType: EntityType): Promise<string[]> {
    const table = entityType === 'HOTEL' ? 'game_hotels' : 'game_restaurants';
    const col = entityType === 'HOTEL' ? 'hotel_id' : 'restaurant_id';
    const res = await pool.query<{ entity_id: string }>(
      `SELECT ${col} AS entity_id FROM ${table} WHERE session_id = $1 ORDER BY display_order`,
      [sessionId],
    );
    return res.rows.map((r) => r.entity_id);
  }

  async recordVote(
    sessionId: number,
    playerId: number,
    entityId: string,
    vote: boolean,
    entityType: EntityType,
  ): Promise<void> {
    const col = entityType === 'HOTEL' ? 'hotel_id' : 'restaurant_id';
    await pool.query(
      `INSERT INTO votes (session_id, player_id, ${col}, vote)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [sessionId, playerId, entityId, vote],
    );
  }

  async getVoteSummary(
    sessionId: number,
    entityType: EntityType,
  ): Promise<Array<{ entityId: string; likeCount: number; dislikeCount: number }>> {
    const col = entityType === 'HOTEL' ? 'hotel_id' : 'restaurant_id';
    const res = await pool.query<{
      entity_id: string;
      like_count: string;
      dislike_count: string;
    }>(
      `SELECT ${col} AS entity_id,
              COUNT(*) FILTER (WHERE vote = true)  AS like_count,
              COUNT(*) FILTER (WHERE vote = false) AS dislike_count
       FROM votes
       WHERE session_id = $1 AND ${col} IS NOT NULL
       GROUP BY ${col}`,
      [sessionId],
    );
    return res.rows.map((r) => ({
      entityId: r.entity_id,
      likeCount: parseInt(r.like_count, 10),
      dislikeCount: parseInt(r.dislike_count, 10),
    }));
  }

  async getPlayerVotesForEntity(
    sessionId: number,
    entityId: string,
    vote: boolean,
    entityType: EntityType,
  ): Promise<number[]> {
    const col = entityType === 'HOTEL' ? 'hotel_id' : 'restaurant_id';
    const res = await pool.query<{ player_id: number }>(
      `SELECT player_id FROM votes WHERE session_id = $1 AND ${col} = $2 AND vote = $3`,
      [sessionId, entityId, vote],
    );
    return res.rows.map((r) => r.player_id);
  }

  async hasVoted(
    sessionId: number,
    playerId: number,
    entityId: string,
    entityType: EntityType,
  ): Promise<boolean> {
    const col = entityType === 'HOTEL' ? 'hotel_id' : 'restaurant_id';
    const res = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM votes WHERE session_id = $1 AND player_id = $2 AND ${col} = $3
       ) AS exists`,
      [sessionId, playerId, entityId],
    );
    return res.rows[0]?.exists ?? false;
  }
}
