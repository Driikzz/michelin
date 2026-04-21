import type { EntityType, GameMode, GameRoom, RoomPlayer, RoomStatus } from '../types/game';

export interface IRoomRepository {
  create(params: {
    hostUserId: string;
    gameMode: GameMode;
    entityType: EntityType;
    latitude: number;
    longitude: number;
    priceFilter: number | null;
    radiusKm: number;
    tagIds: number[];
  }): Promise<GameRoom>;

  findById(id: string): Promise<GameRoom | null>;
  updateStatus(id: string, status: RoomStatus): Promise<void>;

  addPlayer(params: {
    roomId: string;
    userId?: string;
    guestId?: string;
    nickname: string;
  }): Promise<RoomPlayer>;

  getPlayers(roomId: string): Promise<RoomPlayer[]>;
  findPlayerByIdentity(
    roomId: string,
    userId?: string,
    guestId?: string,
  ): Promise<RoomPlayer | null>;
}
