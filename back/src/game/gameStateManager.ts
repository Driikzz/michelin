import type { WebSocket } from 'ws';
import type { GameMode } from '../types/game';
import type { Restaurant } from '../types/restaurant';

export type RoomPhase = 'WAITING' | 'BUILDING' | 'VOTING' | 'FINISHED';

interface RoomState {
  roomId: string;
  sessionId: number | null;
  phase: RoomPhase;
  gameMode: GameMode;
  restaurants: Restaurant[];
  connectedPlayers: Map<number, WebSocket>;
  votes: Map<number, Map<string, boolean>>;
  timerHandle: ReturnType<typeof setInterval> | null;
  tickHandle: ReturnType<typeof setInterval> | null;
  timerEndsAt: number | null;
  hostPlayerId: number;
}

class GameStateManager {
  private rooms: Map<string, RoomState> = new Map();

  initRoom(roomId: string, gameMode: GameMode, hostPlayerId: number): void {
    this.rooms.set(roomId, {
      roomId,
      sessionId: null,
      phase: 'WAITING',
      gameMode,
      restaurants: [],
      connectedPlayers: new Map(),
      votes: new Map(),
      timerHandle: null,
      tickHandle: null,
      timerEndsAt: null,
      hostPlayerId,
    });
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  destroyRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.timerHandle) clearTimeout(room.timerHandle);
      if (room.tickHandle) clearInterval(room.tickHandle);
    }
    this.rooms.delete(roomId);
  }

  registerSocket(roomId: string, playerId: number, ws: WebSocket): void {
    this.rooms.get(roomId)?.connectedPlayers.set(playerId, ws);
  }

  removeSocket(roomId: string, playerId: number): void {
    this.rooms.get(roomId)?.connectedPlayers.delete(playerId);
  }

  getSocket(roomId: string, playerId: number): WebSocket | undefined {
    return this.rooms.get(roomId)?.connectedPlayers.get(playerId);
  }

  getConnectedPlayerIds(roomId: string): number[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.connectedPlayers.keys());
  }

  setRestaurants(roomId: string, restaurants: Restaurant[]): void {
    const room = this.rooms.get(roomId);
    if (room) room.restaurants = restaurants;
  }

  addRestaurant(roomId: string, restaurant: Restaurant): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.restaurants.some((r) => r.id === restaurant.id)) return false;
    room.restaurants.push(restaurant);
    return true;
  }

  getRestaurants(roomId: string): Restaurant[] {
    return this.rooms.get(roomId)?.restaurants ?? [];
  }

  recordVote(roomId: string, playerId: number, restaurantId: string, vote: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    let playerVotes = room.votes.get(playerId);
    if (!playerVotes) {
      playerVotes = new Map();
      room.votes.set(playerId, playerVotes);
    }
    if (playerVotes.has(restaurantId)) return false;
    playerVotes.set(restaurantId, vote);
    return true;
  }

  getVotes(roomId: string): Map<number, Map<string, boolean>> {
    return this.rooms.get(roomId)?.votes ?? new Map();
  }

  allPlayersVotedAll(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.restaurants.length === 0) return false;
    const restaurantCount = room.restaurants.length;
    for (const playerId of room.connectedPlayers.keys()) {
      const playerVotes = room.votes.get(playerId);
      if (!playerVotes || playerVotes.size < restaurantCount) return false;
    }
    return room.connectedPlayers.size > 0;
  }

  setPhase(roomId: string, phase: RoomPhase): void {
    const room = this.rooms.get(roomId);
    if (room) room.phase = phase;
  }

  setTimer(
    roomId: string,
    timerHandle: ReturnType<typeof setInterval>,
    tickHandle: ReturnType<typeof setInterval>,
    endsAt: number,
  ): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.timerHandle = timerHandle;
      room.tickHandle = tickHandle;
      room.timerEndsAt = endsAt;
    }
  }

  clearTimer(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.timerHandle) clearTimeout(room.timerHandle);
      if (room.tickHandle) clearInterval(room.tickHandle);
      room.timerHandle = null;
      room.tickHandle = null;
    }
  }

  setSessionId(roomId: string, sessionId: number): void {
    const room = this.rooms.get(roomId);
    if (room) room.sessionId = sessionId;
  }

  isHostPlayer(roomId: string, playerId: number): boolean {
    return this.rooms.get(roomId)?.hostPlayerId === playerId;
  }
}

export const gameStateManager = new GameStateManager();
