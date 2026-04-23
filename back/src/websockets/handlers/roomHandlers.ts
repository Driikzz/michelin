import type { WebSocket } from 'ws';
import { gameStateManager } from '../../game/gameStateManager';
import * as timerManager from '../../game/timerManager';
import type { GameService } from '../../services/gameService';
import { NoRestaurantsError } from '../../services/restaurantService';
import { NoHotelsError } from '../../services/hotelService';
import { broadcastToRoom, sendError, sendToPlayer, triggerEndVoting } from '../websocketServer';

const BUILD_DURATION_SECONDS = 60;
const VOTE_DURATION_SECONDS = 60;

function startVotingPhase(roomId: string, gameService: GameService): void {
  const state = gameStateManager.getRoom(roomId);
  if (!state || state.phase !== 'BUILDING') return;

  const entities = gameStateManager.getEntities(roomId);
  if (entities.length === 0) return;

  const sessionId = state.sessionId!;
  gameStateManager.setPhase(roomId, 'VOTING');

  timerManager.startTimer({
    roomId,
    durationSeconds: VOTE_DURATION_SECONDS,
    onTick: (remaining) => broadcastToRoom(roomId, 'game:timer_update', { remaining }),
    onExpire: () => triggerEndVoting(roomId, sessionId, gameService),
  });

  broadcastToRoom(roomId, 'game:start', {
    phase: 'VOTING',
    sessionId,
    entities,
    entityType: state.entityType,
    timerSeconds: VOTE_DURATION_SECONDS,
    timerEndsAt: state.timerEndsAt,
  });
}

export function handleRoomJoin(
  ws: WebSocket,
  _payload: object,
  context: { playerId: number; roomId: string },
): void {
  const { roomId } = context;
  const state = gameStateManager.getRoom(roomId);
  if (!state) {
    sendError(ws, 'Room not in active state');
    return;
  }

  sendToPlayer(ws, 'room:update', {
    phase: state.phase,
    gameMode: state.gameMode,
    entityType: state.entityType,
    entities: gameStateManager.getEntities(roomId),
    timerEndsAt: state.timerEndsAt,
    sessionId: state.sessionId,
    hostPlayerId: state.hostPlayerId,
  });
}

export async function handleRoomStart(
  ws: WebSocket,
  _payload: object,
  context: { playerId: number; roomId: string },
  gameService: GameService,
): Promise<void> {
  const { playerId, roomId } = context;
  const state = gameStateManager.getRoom(roomId);

  if (!state) {
    sendError(ws, 'Room not in active state');
    return;
  }

  // CLASSIC: second call transitions BUILDING → VOTING
  if (state.phase === 'BUILDING') {
    if (!gameStateManager.isHostPlayer(roomId, playerId)) {
      sendError(ws, 'Only the host can start voting');
      return;
    }
    const entities = gameStateManager.getEntities(roomId);
    if (entities.length === 0) {
      sendError(ws, 'No entities in pool');
      return;
    }
    timerManager.stopTimer(roomId);
    startVotingPhase(roomId, gameService);
    return;
  }

  if (state.phase !== 'WAITING') {
    sendError(ws, 'Game already in progress or finished');
    return;
  }

  try {
    const { session, entities, entityType, timerSeconds } = await gameService.startGame(
      roomId,
      playerId,
    );

    if (state.gameMode === 'CLASSIC') {
      gameStateManager.setPhase(roomId, 'BUILDING');

      timerManager.startTimer({
        roomId,
        durationSeconds: BUILD_DURATION_SECONDS,
        onTick: (remaining) => broadcastToRoom(roomId, 'game:timer_update', { remaining }),
        onExpire: async () => { startVotingPhase(roomId, gameService); },
      });

      broadcastToRoom(roomId, 'game:start', {
        phase: 'BUILDING',
        sessionId: session.id,
        entities,
        entityType,
        timerSeconds: BUILD_DURATION_SECONDS,
        timerEndsAt: gameStateManager.getRoom(roomId)?.timerEndsAt,
      });
    } else {
      gameStateManager.setPhase(roomId, 'VOTING');

      timerManager.startTimer({
        roomId,
        durationSeconds: timerSeconds,
        onTick: (remaining) => broadcastToRoom(roomId, 'game:timer_update', { remaining }),
        onExpire: () => triggerEndVoting(roomId, session.id, gameService),
      });

      broadcastToRoom(roomId, 'game:start', {
        phase: 'VOTING',
        sessionId: session.id,
        entities,
        entityType,
        timerSeconds,
        timerEndsAt: gameStateManager.getRoom(roomId)?.timerEndsAt,
      });
    }
  } catch (err) {
    const isNoEntity = err instanceof NoRestaurantsError || err instanceof NoHotelsError;
    sendError(ws, isNoEntity ? (err as Error).message : `Could not start game: ${(err as Error).message}`);
  }
}
