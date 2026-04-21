import type { WebSocket } from 'ws';
import { gameStateManager } from '../../game/gameStateManager';
import * as timerManager from '../../game/timerManager';
import { GameSessionRepository } from '../../repositories/gameSessionRepository';
import { RestaurantRepository } from '../../repositories/restaurantRepository';
import type { GameService } from '../../services/gameService';
import { broadcastToRoom, sendError, triggerEndVoting } from '../websocketServer';

const sessionRepository = new GameSessionRepository();
const restaurantRepository = new RestaurantRepository();

interface VotePayload {
  sessionId?: unknown;
  restaurantId?: unknown;
  vote?: unknown;
}

interface AddRestaurantPayload {
  sessionId?: unknown;
  restaurantId?: unknown;
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

  const { sessionId, restaurantId, vote } = payload;

  if (
    typeof sessionId !== 'number' ||
    typeof restaurantId !== 'string' ||
    typeof vote !== 'boolean'
  ) {
    sendError(ws, 'Invalid vote payload: sessionId (number), restaurantId (string), vote (boolean) required');
    return;
  }

  if (state.sessionId !== sessionId) {
    sendError(ws, 'Invalid session');
    return;
  }

  const restaurants = gameStateManager.getRestaurants(roomId);
  if (!restaurants.some((r) => r.id === restaurantId)) {
    sendError(ws, 'Restaurant not in session pool');
    return;
  }

  const recorded = gameStateManager.recordVote(roomId, playerId, restaurantId, vote);
  if (!recorded) {
    sendError(ws, 'Already voted on this restaurant');
    return;
  }

  await sessionRepository.recordVote(sessionId, playerId, restaurantId, vote);

  // Broadcast aggregate like count for this restaurant
  let likeCount = 0;
  for (const playerVotes of gameStateManager.getVotes(roomId).values()) {
    if (playerVotes.get(restaurantId) === true) likeCount++;
  }
  broadcastToRoom(roomId, 'game:vote_update', { restaurantId, likeCount });

  if (gameStateManager.allPlayersVotedAll(roomId)) {
    timerManager.stopTimer(roomId);
    await triggerEndVoting(roomId, sessionId, gameService);
  }
}

export async function handleAddRestaurant(
  ws: WebSocket,
  payload: AddRestaurantPayload,
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

  const { sessionId, restaurantId } = payload;

  if (typeof sessionId !== 'number' || typeof restaurantId !== 'string') {
    sendError(ws, 'Invalid payload: sessionId (number) and restaurantId (string) required');
    return;
  }

  if (state.sessionId !== sessionId) {
    sendError(ws, 'Invalid session');
    return;
  }

  // Verify restaurant exists before trying to add
  const existing = await restaurantRepository.findById(restaurantId);
  if (!existing) {
    sendError(ws, 'Restaurant not found');
    return;
  }

  try {
    const updatedRestaurants = await gameService.addRestaurantToPool({
      sessionId,
      restaurantId,
      roomId,
    });
    broadcastToRoom(roomId, 'room:update', { phase: 'BUILDING', restaurants: updatedRestaurants });
  } catch (err) {
    sendError(ws, (err as Error).message);
  }
}
