import { pool } from '../db/pool';
import type { GameMode, GameRoom, RoomPlayer, RoomStatus } from '../types/game';
import type { IRoomRepository } from './IRoomRepository';

export class RoomRepository implements IRoomRepository {
  async create(params: {
    hostUserId: string;
    gameMode: GameMode;
    latitude: number;
    longitude: number;
    priceFilter: number | null;
    radiusKm: number;
    tagIds: number[];
  }): Promise<GameRoom> {
    const res = await pool.query<GameRoom>(
      `INSERT INTO game_rooms (host_user_id, game_mode, latitude, longitude, price_filter, radius_km, tag_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        params.hostUserId,
        params.gameMode,
        params.latitude,
        params.longitude,
        params.priceFilter,
        params.radiusKm,
        params.tagIds,
      ],
    );
    const row = res.rows[0];
    if (!row) throw new Error('Room creation failed');
    return row;
  }

  async findById(id: string): Promise<GameRoom | null> {
    const res = await pool.query<GameRoom>('SELECT * FROM game_rooms WHERE id = $1', [id]);
    return res.rows[0] ?? null;
  }

  async updateStatus(id: string, status: RoomStatus): Promise<void> {
    await pool.query('UPDATE game_rooms SET status = $2 WHERE id = $1', [id, status]);
  }

  async addPlayer(params: {
    roomId: string;
    userId?: string;
    guestId?: string;
    nickname: string;
  }): Promise<RoomPlayer> {
    const res = await pool.query<RoomPlayer>(
      `INSERT INTO room_players (room_id, user_id, guest_id, nickname)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [params.roomId, params.userId ?? null, params.guestId ?? null, params.nickname],
    );
    const row = res.rows[0];
    if (!row) throw new Error('Player join failed');
    return row;
  }

  async getPlayers(roomId: string): Promise<RoomPlayer[]> {
    const res = await pool.query<RoomPlayer>(
      'SELECT * FROM room_players WHERE room_id = $1 ORDER BY joined_at',
      [roomId],
    );
    return res.rows;
  }

  async findPlayerByIdentity(
    roomId: string,
    userId?: string,
    guestId?: string,
  ): Promise<RoomPlayer | null> {
    if (userId) {
      const res = await pool.query<RoomPlayer>(
        'SELECT * FROM room_players WHERE room_id = $1 AND user_id = $2',
        [roomId, userId],
      );
      return res.rows[0] ?? null;
    }
    if (guestId) {
      const res = await pool.query<RoomPlayer>(
        'SELECT * FROM room_players WHERE room_id = $1 AND guest_id = $2',
        [roomId, guestId],
      );
      return res.rows[0] ?? null;
    }
    return null;
  }
}
