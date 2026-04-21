import type { WebSocket } from 'ws';

interface WsContext {
  playerId: number;
  roomId: string;
}

const socketToContext: WeakMap<WebSocket, WsContext> = new WeakMap();

export function registerConnection(ws: WebSocket, playerId: number, roomId: string): void {
  socketToContext.set(ws, { playerId, roomId });
}

export function getContext(ws: WebSocket): WsContext | undefined {
  return socketToContext.get(ws);
}

export function unregisterConnection(ws: WebSocket): void {
  socketToContext.delete(ws);
}
