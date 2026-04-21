import type { EntityType, GameSession } from '../types/game';

export interface IGameSessionRepository {
  create(roomId: string): Promise<GameSession>;
  findActiveByRoomId(roomId: string): Promise<GameSession | null>;
  end(sessionId: number): Promise<void>;

  addEntities(sessionId: number, entityIds: string[], entityType: EntityType): Promise<void>;
  getEntityIds(sessionId: number, entityType: EntityType): Promise<string[]>;

  recordVote(
    sessionId: number,
    playerId: number,
    entityId: string,
    vote: boolean,
    entityType: EntityType,
  ): Promise<void>;

  getVoteSummary(
    sessionId: number,
    entityType: EntityType,
  ): Promise<Array<{ entityId: string; likeCount: number; dislikeCount: number }>>;

  getPlayerVotesForEntity(
    sessionId: number,
    entityId: string,
    vote: boolean,
    entityType: EntityType,
  ): Promise<number[]>;

  hasVoted(
    sessionId: number,
    playerId: number,
    entityId: string,
    entityType: EntityType,
  ): Promise<boolean>;
}
