import { gameStateManager } from '../game/gameStateManager';
import type { IGameSessionRepository } from '../repositories/IGameSessionRepository';
import type { IRestaurantRepository } from '../repositories/IRestaurantRepository';
import type { IRoomRepository } from '../repositories/IRoomRepository';
import type { IUserRepository } from '../repositories/IUserRepository';
import type { GameSession } from '../types/game';
import type { Restaurant } from '../types/restaurant';
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
  winnerRestaurantId: string;
  wasRandom: boolean;
  restaurant: Restaurant;
  xpAwards: XpAwardResult[];
}

export class GameService {
  constructor(
    private roomRepository: IRoomRepository,
    private sessionRepository: IGameSessionRepository,
    private restaurantRepository: IRestaurantRepository,
    private restaurantService: RestaurantService,
    private userRepository: IUserRepository,
  ) {}

  async startGame(
    roomId: string,
    requestingPlayerId: number,
  ): Promise<{ session: GameSession; restaurants: Restaurant[]; timerSeconds: number }> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'WAITING') throw new Error('Game already started or finished');

    if (!gameStateManager.isHostPlayer(roomId, requestingPlayerId)) {
      throw new Error('Only the host can start the game');
    }

    const players = await this.roomRepository.getPlayers(roomId);
    if (players.length < 2) throw new Error('Need at least 2 players to start');

    let tagIds = room.tag_ids;

    if (room.game_mode === 'CHAOS') {
      tagIds = await this.restaurantService.getRandomTagIds(3);
    }

    let restaurants: Restaurant[];
    try {
      restaurants = await this.restaurantService.getRestaurantsForGame({
        latitude: room.latitude,
        longitude: room.longitude,
        radiusKm: room.radius_km,
        priceFilter: room.price_filter,
        tagIds,
        count: 10,
      });
    } catch (err) {
      if (err instanceof NoRestaurantsError) throw err;
      throw new Error('Failed to fetch restaurants');
    }

    const session = await this.sessionRepository.create(roomId);
    await this.sessionRepository.addRestaurants(
      session.id,
      restaurants.map((r) => r.id),
    );

    gameStateManager.setSessionId(roomId, session.id);
    gameStateManager.setRestaurants(roomId, restaurants);
    await this.roomRepository.updateStatus(roomId, 'PLAYING');

    return { session, restaurants, timerSeconds: 60 };
  }

  async addRestaurantToPool(params: {
    sessionId: number;
    restaurantId: string;
    roomId: string;
  }): Promise<Restaurant[]> {
    const restaurant = await this.restaurantRepository.findById(params.restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const added = gameStateManager.addRestaurant(params.roomId, restaurant);
    if (!added) throw new Error('Restaurant already in pool');

    await this.sessionRepository.addRestaurants(params.sessionId, [params.restaurantId]);
    return gameStateManager.getRestaurants(params.roomId);
  }

  async endVoting(sessionId: number, roomId: string): Promise<GameEndResult> {
    const summary = await this.sessionRepository.getVoteSummary(sessionId);
    const restaurantIds = await this.sessionRepository.getRestaurantIds(sessionId);
    const restaurants = gameStateManager.getRestaurants(roomId);

    let winnerRestaurantId: string;
    let wasRandom = false;

    if (summary.length === 0) {
      wasRandom = true;
      winnerRestaurantId = randomFrom(restaurantIds);
    } else {
      const maxLikes = Math.max(...summary.map((s) => s.likeCount));
      if (maxLikes === 0) {
        wasRandom = true;
        winnerRestaurantId = randomFrom(restaurantIds);
      } else {
        const topEntries = summary.filter((s) => s.likeCount === maxLikes);
        if (topEntries.length > 1) {
          wasRandom = true;
          winnerRestaurantId = randomFrom(topEntries.map((s) => s.restaurantId));
        } else {
          winnerRestaurantId = topEntries[0]!.restaurantId;
        }
      }
    }

    const restaurant =
      restaurants.find((r) => r.id === winnerRestaurantId) ??
      (() => {
        throw new Error('Winner restaurant not found in session pool');
      })();

    const xpAwards = await this.awardXp(sessionId, winnerRestaurantId, roomId);

    await this.sessionRepository.end(sessionId);
    await this.roomRepository.updateStatus(roomId, 'FINISHED');

    return { winnerRestaurantId, wasRandom, restaurant, xpAwards };
  }

  private async awardXp(
    sessionId: number,
    winnerRestaurantId: string,
    roomId: string,
  ): Promise<XpAwardResult[]> {
    const players = await this.roomRepository.getPlayers(roomId);
    const winnerVoterIds = await this.sessionRepository.getPlayerVotesForRestaurant(
      sessionId,
      winnerRestaurantId,
      true,
    );
    const winnerSet = new Set(winnerVoterIds);

    const results: XpAwardResult[] = [];

    for (const player of players) {
      if (!player.user_id) {
        results.push({
          playerId: player.id,
          userId: null,
          nickname: player.nickname,
          xpGained: 0,
          newXp: 0,
          newLevel: 1,
          newStreak: 0,
        });
        continue;
      }

      if (winnerSet.has(player.id)) {
        const user = await this.userRepository.findById(player.user_id);
        const currentStreak = user?.streak ?? 0;
        const xpGained = 10 + currentStreak * 5;
        const stats = await this.userRepository.addXp(player.user_id, xpGained);
        results.push({
          playerId: player.id,
          userId: player.user_id,
          nickname: player.nickname,
          xpGained,
          newXp: stats.xp,
          newLevel: stats.level,
          newStreak: stats.streak,
        });
      } else {
        await this.userRepository.resetStreak(player.user_id);
        const user = await this.userRepository.findById(player.user_id);
        results.push({
          playerId: player.id,
          userId: player.user_id,
          nickname: player.nickname,
          xpGained: 0,
          newXp: user?.xp ?? 0,
          newLevel: user?.level ?? 1,
          newStreak: 0,
        });
      }
    }

    return results;
  }
}

function randomFrom<T>(arr: T[]): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array');
  return arr[Math.floor(Math.random() * arr.length)]!;
}
