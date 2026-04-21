import { pool } from '../db/pool';
import type { GameSession } from '../types/game';
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

  async addRestaurants(sessionId: number, restaurantIds: string[]): Promise<void> {
    if (restaurantIds.length === 0) return;
    const values: unknown[] = [];
    const placeholders = restaurantIds.map((id, idx) => {
      values.push(sessionId, id, idx);
      const base = idx * 3 + 1;
      return `($${base}, $${base + 1}, $${base + 2})`;
    });
    await pool.query(
      `INSERT INTO game_restaurants (session_id, restaurant_id, display_order) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  async getRestaurantIds(sessionId: number): Promise<string[]> {
    const res = await pool.query<{ restaurant_id: string }>(
      'SELECT restaurant_id FROM game_restaurants WHERE session_id = $1 ORDER BY display_order',
      [sessionId],
    );
    return res.rows.map((r) => r.restaurant_id);
  }

  async recordVote(
    sessionId: number,
    playerId: number,
    restaurantId: string,
    vote: boolean,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO votes (session_id, player_id, restaurant_id, vote)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, player_id, restaurant_id) DO NOTHING`,
      [sessionId, playerId, restaurantId, vote],
    );
  }

  async getVoteSummary(
    sessionId: number,
  ): Promise<Array<{ restaurantId: string; likeCount: number; dislikeCount: number }>> {
    const res = await pool.query<{
      restaurant_id: string;
      like_count: string;
      dislike_count: string;
    }>(
      `SELECT restaurant_id,
              COUNT(*) FILTER (WHERE vote = true)  AS like_count,
              COUNT(*) FILTER (WHERE vote = false) AS dislike_count
       FROM votes
       WHERE session_id = $1
       GROUP BY restaurant_id`,
      [sessionId],
    );
    return res.rows.map((r) => ({
      restaurantId: r.restaurant_id,
      likeCount: parseInt(r.like_count, 10),
      dislikeCount: parseInt(r.dislike_count, 10),
    }));
  }

  async getPlayerVotesForRestaurant(
    sessionId: number,
    restaurantId: string,
    vote: boolean,
  ): Promise<number[]> {
    const res = await pool.query<{ player_id: number }>(
      'SELECT player_id FROM votes WHERE session_id = $1 AND restaurant_id = $2 AND vote = $3',
      [sessionId, restaurantId, vote],
    );
    return res.rows.map((r) => r.player_id);
  }

  async hasVoted(sessionId: number, playerId: number, restaurantId: string): Promise<boolean> {
    const res = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM votes WHERE session_id = $1 AND player_id = $2 AND restaurant_id = $3
       ) AS exists`,
      [sessionId, playerId, restaurantId],
    );
    return res.rows[0]?.exists ?? false;
  }
}
