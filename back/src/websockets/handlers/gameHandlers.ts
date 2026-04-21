import type { WebSocket } from 'ws';
import { gameStateManager } from '../../game/gameStateManager';
import * as timerManager from '../../game/timerManager';
import { GameSessionRepository } from '../../repositories/gameSessionRepository';
import type { GameService } from '../../services/gameService';
import { broadcastToRoom, sendError, triggerEndVoting } from '../websocketServer';

const sessionRepository = new GameSessionRepository();

interface VotePayload {
  sessionId?: unknown;
  entityId?: unknown;
  vote?: unknown;
}

interface AddEntityPayload {
  sessionId?: unknown;
  entityId?: unknown;
}

export async function handleGameVote(
  ws: WebSocket,
  payload: VotePayload,
  context: { playerId: number; roomId: string },
  gameService: GameService,
): Promise<void> {
  const { playerId, roomId } = context;
  const state = gameStateManager.getRoom(roomId);

  if (!state || state.phase !== 'VOTING') {
    sendError(ws, 'Not in voting phase');
    return;
  }

  const { sessionId, entityId, vote } = payload;

  if (typeof sessionId !== 'number' || typeof entityId !== 'string' || typeof vote !== 'boolean') {
    sendError(ws, 'Invalid vote payload: sessionId (number), entityId (string), vote (boolean) required');
    return;
  }

  if (state.sessionId !== sessionId) {
    sendError(ws, 'Invalid session');
    return;
  }

  const entities = gameStateManager.getEntities(roomId);
  if (!entities.some((e) => e.id === entityId)) {
    sendError(ws, 'Entity not in session pool');
    return;
  }

  const recorded = gameStateManager.recordVote(roomId, playerId, entityId, vote);
  if (!recorded) {
    sendError(ws, 'Already voted on this entity');
    return;
  }

  await sessionRepository.recordVote(sessionId, playerId, entityId, vote, state.entityType);

  let likeCount = 0;
  for (const playerVotes of gameStateManager.getVotes(roomId).values()) {
    if (playerVotes.get(entityId) === true) likeCount++;
  }
  broadcastToRoom(roomId, 'game:vote_update', { entityId, likeCount, entityType: state.entityType });

  if (gameStateManager.allPlayersVotedAll(roomId)) {
    timerManager.stopTimer(roomId);
    await triggerEndVoting(roomId, sessionId, gameService);
  }
}

export async function handleAddEntity(
  ws: WebSocket,
  payload: AddEntityPayload,
  context: { playerId: number; roomId: string },
  gameService: GameService,
): Promise<void> {
  const { roomId } = context;
  const state = gameStateManager.getRoom(roomId);

  if (!state) {
    sendError(ws, 'Room not found');
    return;
  }
  if (state.gameMode !== 'CLASSIC') {
    sendError(ws, 'Only available in CLASSIC mode');
    return;
  }
  if (state.phase !== 'BUILDING') {
    sendError(ws, 'Not in building phase');
    return;
  }

  const { sessionId, entityId } = payload;

  if (typeof sessionId !== 'number' || typeof entityId !== 'string') {
    sendError(ws, 'Invalid payload: sessionId (number) and entityId (string) required');
    return;
  }

  if (state.sessionId !== sessionId) {
    sendError(ws, 'Invalid session');
    return;
  }

  try {
    const updatedEntities = await gameService.addEntityToPool({
      sessionId,
      entityId,
      roomId,
      entityType: state.entityType,
    });
    broadcastToRoom(roomId, 'room:update', {
      phase: 'BUILDING',
      entities: updatedEntities,
      entityType: state.entityType,
    });
  } catch (err) {
    sendError(ws, (err as Error).message);
  }
}
