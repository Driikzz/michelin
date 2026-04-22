import type { EntityType } from '../types/game';

export interface GameHistoryEntry {
  id: number;
  user_id: string;
  room_id: string | null;
  entity_id: string;
  entity_type: EntityType;
  entity_name: string;
  entity_image: string | null;
  entity_city: string | null;
  xp_gained: number;
  played_at: Date;
  latitude: number | null;
  longitude: number | null;
}

export interface AddHistoryEntryParams {
  userId: string;
  roomId: string;
  entityId: string;
  entityType: EntityType;
  entityName: string;
  entityImage: string | null;
  entityCity: string | null;
  xpGained: number;
}

export interface IGameHistoryRepository {
  addEntry(params: AddHistoryEntryParams): Promise<void>;
  getByUserId(userId: string, limit?: number): Promise<GameHistoryEntry[]>;
}
