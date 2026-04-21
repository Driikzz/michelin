export type GameMode = 'FAST' | 'CLASSIC' | 'CHAOS';
export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';
export type EntityType = 'RESTAURANT' | 'HOTEL';

export interface GameRoom {
  id: string;
  host_user_id: string;
  game_mode: GameMode;
  status: RoomStatus;
  entity_type: EntityType;
  latitude: number;
  longitude: number;
  price_filter: number | null;
  radius_km: number;
  tag_ids: number[];
  created_at: Date;
}

export interface RoomPlayer {
  id: number;
  room_id: string;
  user_id: string | null;
  guest_id: string | null;
  nickname: string;
  joined_at: Date;
}

export interface GameSession {
  id: number;
  room_id: string;
  started_at: Date;
  ended_at: Date | null;
}

export interface WsMessage {
  event: string;
  payload: unknown;
}
