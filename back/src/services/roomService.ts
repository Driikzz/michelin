import type { IGuestRepository } from '../repositories/IGuestRepository';
import type { IRoomRepository } from '../repositories/IRoomRepository';
import type { IUserRepository } from '../repositories/IUserRepository';
import type { EntityType, GameMode, GameRoom, RoomPlayer } from '../types/game';

export class RoomService {
  constructor(
    private roomRepository: IRoomRepository,
    private userRepository: IUserRepository,
    private guestRepository: IGuestRepository,
  ) {}

  async createRoom(params: {
    hostUserId: string;
    gameMode: GameMode;
    entityType: EntityType;
    latitude: number;
    longitude: number;
    priceFilter: number | null;
    radiusKm: number;
    tagIds: number[];
    nickname: string;
  }): Promise<{ room: GameRoom; hostPlayer: RoomPlayer }> {
    const user = await this.userRepository.findById(params.hostUserId);
    if (!user) throw new Error('User not found');

    const room = await this.roomRepository.create({
      hostUserId: params.hostUserId,
      gameMode: params.gameMode,
      entityType: params.entityType,
      latitude: params.latitude,
      longitude: params.longitude,
      priceFilter: params.priceFilter,
      radiusKm: params.radiusKm,
      tagIds: params.tagIds,
    });

    const hostPlayer = await this.roomRepository.addPlayer({
      roomId: room.id,
      userId: params.hostUserId,
      nickname: params.nickname,
    });

    return { room, hostPlayer };
  }

  async getRoomWithPlayers(
    roomId: string,
  ): Promise<{ room: GameRoom; players: RoomPlayer[] } | null> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) return null;
    const players = await this.roomRepository.getPlayers(roomId);
    return { room, players };
  }

  async joinRoom(params: {
    roomId: string;
    userId?: string;
    guestId?: string;
    nickname: string;
  }): Promise<RoomPlayer> {
    const room = await this.roomRepository.findById(params.roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Room is not accepting new players');

    const existing = await this.roomRepository.findPlayerByIdentity(
      params.roomId,
      params.userId,
      params.guestId,
    );
    if (existing) throw new Error('Already in this room');

    if (params.userId) {
      const user = await this.userRepository.findById(params.userId);
      if (!user) throw new Error('User not found');
    } else if (params.guestId) {
      const guest = await this.guestRepository.findById(params.guestId);
      if (!guest) throw new Error('Guest not found');
    } else {
      throw new Error('User or guest identity required');
    }

    return this.roomRepository.addPlayer({
      roomId: params.roomId,
      ...(params.userId !== undefined && { userId: params.userId }),
      ...(params.guestId !== undefined && { guestId: params.guestId }),
      nickname: params.nickname,
    });
  }
}
