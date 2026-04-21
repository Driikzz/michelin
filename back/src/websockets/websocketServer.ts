import type { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { gameStateManager } from '../game/gameStateManager';
import { RoomRepository } from '../repositories/roomRepository';
import { RestaurantRepository } from '../repositories/restaurantRepository';
import { HotelRepository } from '../repositories/hotelRepository';
import { GameSessionRepository } from '../repositories/gameSessionRepository';
import { UserRepository } from '../repositories/userRepository';
import { GameService } from '../services/gameService';
import { RestaurantService } from '../services/restaurantService';
import { HotelService } from '../services/hotelService';
import type { GameEndResult } from '../services/gameService';
import type { WsMessage } from '../types/game';
import { resolveWsIdentity } from './wsAuth';
import { getContext, registerConnection, unregisterConnection } from './wsRegistry';
import { handleGameVote, handleAddEntity } from './handlers/gameHandlers';
import { handleRoomJoin, handleRoomStart } from './handlers/roomHandlers';

function makeGameService(): GameService {
  const roomRepo = new RoomRepository();
  const sessionRepo = new GameSessionRepository();
  const restaurantRepo = new RestaurantRepository();
  const hotelRepo = new HotelRepository();
  const restaurantService = new RestaurantService(restaurantRepo);
  const hotelService = new HotelService(hotelRepo);
  const userRepo = new UserRepository();
  return new GameService(roomRepo, sessionRepo, restaurantRepo, hotelRepo, restaurantService, hotelService, userRepo);
}

const gameService = makeGameService();

export function sendToPlayer(ws: WebSocket, event: string, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, payload }));
  }
}

export function sendError(ws: WebSocket, message: string): void {
  sendToPlayer(ws, 'error', { message });
}

export function broadcastToRoom(roomId: string, event: string, payload: unknown): void {
  const playerIds = gameStateManager.getConnectedPlayerIds(roomId);
  const msg = JSON.stringify({ event, payload });
  for (const playerId of playerIds) {
    const ws = gameStateManager.getSocket(roomId, playerId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

export async function triggerEndVoting(
  roomId: string,
  sessionId: number,
  gs: GameService,
): Promise<void> {
  const state = gameStateManager.getRoom(roomId);
  if (!state || state.phase !== 'VOTING') return;

  gameStateManager.setPhase(roomId, 'FINISHED');

  let result: GameEndResult;
  try {
    result = await gs.endVoting(sessionId, roomId);
  } catch (err) {
    console.error(`[game] endVoting failed for room ${roomId}:`, err);
    broadcastToRoom(roomId, 'error', { message: 'Failed to compute game result' });
    return;
  }

  broadcastToRoom(roomId, 'game:end', {
    winnerId: result.winnerId,
    entity: result.entity,
    entityType: result.entityType,
    wasRandom: result.wasRandom,
    xpAwards: result.xpAwards,
  });

  setTimeout(() => gameStateManager.destroyRoom(roomId), 30_000);
}

export function initializeWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    resolveWsIdentity(req)
      .then((identity) => {
        if (!identity) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, identity);
        });
      })
      .catch((err: unknown) => {
        console.error('[ws] upgrade error:', err);
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      });
  });

  wss.on(
    'connection',
    (ws: WebSocket, identity: Awaited<ReturnType<typeof resolveWsIdentity>> & object) => {
      if (!identity) return;

      const { roomId } = identity;
      const roomRepo = new RoomRepository();

      void (async () => {
        let playerId: number | null = null;

        try {
          const players = await roomRepo.getPlayers(roomId);
          if (identity.type === 'user') {
            const found = players.find((p) => p.user_id === identity.userId);
            if (found) playerId = found.id;
          } else {
            const found = players.find((p) => p.guest_id === identity.guestId);
            if (found) playerId = found.id;
          }
        } catch (err) {
          console.error('[ws] failed to resolve player:', err);
        }

        if (playerId === null) {
          sendError(ws, 'You are not a member of this room. Call POST /api/rooms/:id/join first.');
          ws.close(4003, 'Not a room member');
          return;
        }

        const state = gameStateManager.getRoom(roomId);
        if (!state) {
          sendError(ws, 'Room is not active');
          ws.close(4004, 'Room not active');
          return;
        }

        if (state.phase !== 'WAITING' && state.phase !== 'BUILDING') {
          const existingVotes = state.votes.get(playerId);
          if (!existingVotes || existingVotes.size === 0) {
            sendError(ws, 'Game already in progress. Cannot join mid-game.');
            ws.close(4005, 'Game in progress');
            return;
          }
        }

        registerConnection(ws, playerId, roomId);
        gameStateManager.registerSocket(roomId, playerId, ws);

        try {
          const players = await roomRepo.getPlayers(roomId);
          broadcastToRoom(roomId, 'room:update', {
            phase: state.phase,
            players,
            timerEndsAt: state.timerEndsAt,
          });
        } catch {
          // non-fatal
        }

        ws.on('message', (raw) => {
          let msg: WsMessage;
          try {
            msg = JSON.parse(raw.toString()) as WsMessage;
          } catch {
            ws.close(4000, 'Invalid JSON');
            return;
          }

          const ctx = getContext(ws);
          if (!ctx) return;

          switch (msg.event) {
            case 'room:join':
              handleRoomJoin(ws, msg.payload as object, ctx);
              break;

            case 'room:start':
              void handleRoomStart(ws, msg.payload as object, ctx, gameService);
              break;

            case 'game:vote':
              void handleGameVote(ws, msg.payload as object, ctx, gameService);
              break;

            case 'game:add_entity':
            case 'game:add_restaurant': // backwards compat alias
              void handleAddEntity(ws, msg.payload as object, ctx, gameService);
              break;

            default:
              sendError(ws, `Unknown event: ${String(msg.event)}`);
          }
        });

        ws.on('close', () => {
          const ctx = getContext(ws);
          if (ctx) {
            gameStateManager.removeSocket(ctx.roomId, ctx.playerId);
            unregisterConnection(ws);
            broadcastToRoom(ctx.roomId, 'room:update', {
              disconnectedPlayerId: ctx.playerId,
            });
          }
        });

        ws.on('error', (err) => {
          console.error('[ws] socket error:', err);
        });
      })();
    },
  );

  console.log('WebSocket server initialized');
}
