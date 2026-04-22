export type GameMode = 'FAST' | 'CLASSIC' | 'CHAOS';
export type EntityType = 'RESTAURANT' | 'HOTEL';

export interface GameHistoryEntry {
  id: number;
  room_id: string | null;
  entity_id: string;
  entity_type: EntityType;
  entity_name: string;
  entity_image: string | null;
  entity_city: string | null;
  xp_gained: number;
  played_at: string;
  latitude: number | null;
  longitude: number | null;
}
export type RoomPhase = 'WAITING' | 'BUILDING' | 'VOTING' | 'FINISHED';
export type MichelinRank = '1_star' | '2_stars' | '3_stars' | 'bib_gourmand' | 'selected';

export interface Tag {
  id: number;
  name: string;
}

export interface Entity {
  id: string;
  name: string;
  description: string | null;
  michelin_rank: MichelinRank | null;
  price_category: number | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  tags: Tag[];
}

export interface Player {
  id: number;
  room_id: string;
  user_id: string | null;
  guest_id: string | null;
  nickname: string;
  joined_at: string;
}

export interface GameRoom {
  id: string;
  host_user_id: string;
  game_mode: GameMode;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  entity_type: EntityType;
  latitude: number;
  longitude: number;
  price_filter: number | null;
  price_filters: number[];
  radius_km: number;
  tag_ids: number[];
  created_at: string;
}

export interface XpAward {
  playerId: number;
  userId: string | null;
  nickname: string;
  xpGained: number;
  newXp: number;
  newLevel: number;
  newStreak: number;
}

export interface GameEndPayload {
  winnerId: string;
  entity: Entity;
  entityType: EntityType;
  wasRandom: boolean;
  xpAwards: XpAward[];
}
