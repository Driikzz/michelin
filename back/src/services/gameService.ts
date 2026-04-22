import { gameStateManager } from '../game/gameStateManager';
import type { IGameSessionRepository } from '../repositories/IGameSessionRepository';
import type { IHotelRepository } from '../repositories/IHotelRepository';
import type { IRestaurantRepository } from '../repositories/IRestaurantRepository';
import type { IRoomRepository } from '../repositories/IRoomRepository';
import type { IUserRepository } from '../repositories/IUserRepository';
import type { IGameHistoryRepository } from '../repositories/IGameHistoryRepository';
import type { EntityType, GameSession } from '../types/game';
import type { Hotel } from '../types/hotel';
import type { Restaurant } from '../types/restaurant';
import { NoHotelsError, HotelService } from './hotelService';
import { NoRestaurantsError, RestaurantService } from './restaurantService';

export interface XpAwardResult {
  playerId: number;
  userId: string | null;
  nickname: string;
  xpGained: number;
  newXp: number;
  newLevel: number;
  newStreak: number;
}

export interface GameEndResult {
  winnerId: string;
  wasRandom: boolean;
  entity: Restaurant | Hotel;
  entityType: EntityType;
  xpAwards: XpAwardResult[];
}

export class GameService {
  constructor(
    private roomRepository: IRoomRepository,
    private sessionRepository: IGameSessionRepository,
    private restaurantRepository: IRestaurantRepository,
    private hotelRepository: IHotelRepository,
    private restaurantService: RestaurantService,
    private hotelService: HotelService,
    private userRepository: IUserRepository,
    private historyRepository: IGameHistoryRepository,
  ) {}

  async startGame(
    roomId: string,
    requestingPlayerId: number,
  ): Promise<{
    session: GameSession;
    entities: Restaurant[] | Hotel[];
    entityType: EntityType;
    timerSeconds: number;
  }> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Game already started or finished');

    if (!gameStateManager.isHostPlayer(roomId, requestingPlayerId)) {
      throw new Error('Only the host can start the game');
    }

    const players = await this.roomRepository.getPlayers(roomId);
    if (players.length < 2) throw new Error('Need at least 2 players to start');

    const entityType = room.entity_type;
    let tagIds = room.tag_ids;

    if (room.game_mode === 'CHAOS') {
      tagIds =
        entityType === 'HOTEL'
          ? await this.hotelService.getRandomTagIds(3)
          : await this.restaurantService.getRandomTagIds(3);
    }

    let entities: Restaurant[] | Hotel[] = [];

    if (room.game_mode !== 'CLASSIC') {
      const gameParams = {
        latitude: room.latitude,
        longitude: room.longitude,
        radiusKm: room.radius_km,
        priceFilters: room.price_filters ?? [],
        tagIds,
        count: 10,
      };

      try {
        if (entityType === 'HOTEL') {
          entities = await this.hotelService.getHotelsForGame(gameParams);
        } else {
          entities = await this.restaurantService.getRestaurantsForGame(gameParams);
        }
      } catch (err) {
        if (err instanceof NoRestaurantsError || err instanceof NoHotelsError) throw err;
        throw new Error(`Failed to fetch ${entityType.toLowerCase()}s`);
      }
    }

    const session = await this.sessionRepository.create(roomId);
    if (entities.length > 0) {
      await this.sessionRepository.addEntities(
        session.id,
        entities.map((e) => e.id),
        entityType,
      );
    }

    gameStateManager.setSessionId(roomId, session.id);
    if (entityType === 'HOTEL') {
      gameStateManager.setHotels(roomId, entities as Hotel[]);
    } else {
      gameStateManager.setRestaurants(roomId, entities as Restaurant[]);
    }

    await this.roomRepository.updateStatus(roomId, 'PLAYING');

    return { session, entities, entityType, timerSeconds: 60 };
  }

  async addEntityToPool(params: {
    sessionId: number;
    entityId: string;
    roomId: string;
    entityType: EntityType;
  }): Promise<Restaurant[] | Hotel[]> {
    if (params.entityType === 'HOTEL') {
      const hotel = await this.hotelRepository.findById(params.entityId);
      if (!hotel) throw new Error('Hotel not found');
      const added = gameStateManager.addHotel(params.roomId, hotel);
      if (!added) throw new Error('Hotel already in pool');
      await this.sessionRepository.addEntities(params.sessionId, [params.entityId], 'HOTEL');
      return gameStateManager.getHotels(params.roomId);
    } else {
      const restaurant = await this.restaurantRepository.findById(params.entityId);
      if (!restaurant) throw new Error('Restaurant not found');
      const added = gameStateManager.addRestaurant(params.roomId, restaurant);
      if (!added) throw new Error('Restaurant already in pool');
      await this.sessionRepository.addEntities(params.sessionId, [params.entityId], 'RESTAURANT');
      return gameStateManager.getRestaurants(params.roomId);
    }
  }

  async endVoting(sessionId: number, roomId: string): Promise<GameEndResult> {
    const state = gameStateManager.getRoom(roomId);
    const entityType: EntityType = state?.entityType ?? 'RESTAURANT';

    const summary = await this.sessionRepository.getVoteSummary(sessionId, entityType);
    const entityIds = await this.sessionRepository.getEntityIds(sessionId, entityType);
    const entities =
      entityType === 'HOTEL'
        ? gameStateManager.getHotels(roomId)
        : gameStateManager.getRestaurants(roomId);

    let winnerId: string;
    let wasRandom = false;

    if (summary.length === 0) {
      wasRandom = true;
      winnerId = randomFrom(entityIds);
    } else {
      const maxLikes = Math.max(...summary.map((s) => s.likeCount));
      if (maxLikes === 0) {
        wasRandom = true;
        winnerId = randomFrom(entityIds);
      } else {
        const top = summary.filter((s) => s.likeCount === maxLikes);
        if (top.length > 1) {
          wasRandom = true;
          winnerId = randomFrom(top.map((s) => s.entityId));
        } else {
          winnerId = top[0]!.entityId;
        }
      }
    }

    const entity =
      entities.find((e) => e.id === winnerId) ??
      (() => {
        throw new Error('Winner entity not found in session pool');
      })();

    const xpAwards = await this.awardXp(sessionId, winnerId, roomId, entityType);

    await this.sessionRepository.end(sessionId);
    await this.roomRepository.updateStatus(roomId, 'FINISHED');

    // Persist history for each authenticated player
    await Promise.allSettled(
      xpAwards
        .filter((a) => a.userId !== null)
        .map((a) =>
          this.historyRepository.addEntry({
            userId: a.userId!,
            roomId,
            entityId: entity.id,
            entityType,
            entityName: entity.name,
            entityImage: entity.images[0] ?? null,
            entityCity: entity.city ?? null,
            xpGained: a.xpGained,
          }),
        ),
    );

    return { winnerId, wasRandom, entity, entityType, xpAwards };
  }

  private async awardXp(
    sessionId: number,
    winnerId: string,
    roomId: string,
    entityType: EntityType,
  ): Promise<XpAwardResult[]> {
    const players = await this.roomRepository.getPlayers(roomId);
    const winnerVoterIds = await this.sessionRepository.getPlayerVotesForEntity(
      sessionId,
      winnerId,
      true,
      entityType,
    );
    const winnerSet = new Set(winnerVoterIds);
    const results: XpAwardResult[] = [];

    for (const player of players) {
      if (!player.user_id) {
        results.push({ playerId: player.id, userId: null, nickname: player.nickname, xpGained: 0, newXp: 0, newLevel: 1, newStreak: 0 });
        continue;
      }

      if (winnerSet.has(player.id)) {
        const user = await this.userRepository.findById(player.user_id);
        const xpGained = 10 + (user?.streak ?? 0) * 5;
        const stats = await this.userRepository.addXp(player.user_id, xpGained);
        results.push({ playerId: player.id, userId: player.user_id, nickname: player.nickname, xpGained, newXp: stats.xp, newLevel: stats.level, newStreak: stats.streak });
      } else {
        await this.userRepository.resetStreak(player.user_id);
        const user = await this.userRepository.findById(player.user_id);
        results.push({ playerId: player.id, userId: player.user_id, nickname: player.nickname, xpGained: 0, newXp: user?.xp ?? 0, newLevel: user?.level ?? 1, newStreak: 0 });
      }
    }

    return results;
  }
}

function randomFrom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array');
  return arr[Math.floor(Math.random() * arr.length)]!;
}
