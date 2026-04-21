import type { GameSession } from '../types/game';

export interface IGameSessionRepository {
  create(roomId: string): Promise<GameSession>;
  findActiveByRoomId(roomId: string): Promise<GameSession | null>;
  end(sessionId: number): Promise<void>;

  addRestaurants(sessionId: number, restaurantIds: string[]): Promise<void>;
  getRestaurantIds(sessionId: number): Promise<string[]>;

  recordVote(
    sessionId: number,
    playerId: number,
    restaurantId: string,
    vote: boolean,
  ): Promise<void>;

  getVoteSummary(
    sessionId: number,
  ): Promise<Array<{ restaurantId: string; likeCount: number; dislikeCount: number }>>;

  getPlayerVotesForRestaurant(
    sessionId: number,
    restaurantId: string,
    vote: boolean,
  ): Promise<number[]>;

  hasVoted(sessionId: number, playerId: number, restaurantId: string): Promise<boolean>;
}
