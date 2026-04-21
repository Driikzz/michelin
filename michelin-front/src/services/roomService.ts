import api from '../api/axiosInstance';
import type { EntityType, GameMode, GameRoom, Player } from '../types/api';

export interface CreateRoomParams {
  gameMode: GameMode;
  entityType: EntityType;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  priceFilter?: number | null;
  tagIds?: number[];
  nickname?: string;
}

export interface CreateRoomResponse {
  roomId: string;
  playerId: number;
  entityType: EntityType;
}

export const roomService = {
  async createRoom(params: CreateRoomParams): Promise<CreateRoomResponse> {
    const { data } = await api.post<CreateRoomResponse>('/api/rooms', params);
    return data;
  },

  async joinRoom(
    roomId: string,
    body: { nickname: string; guestId?: string },
  ): Promise<{ playerId: number; nickname: string }> {
    const { data } = await api.post<{ playerId: number; nickname: string }>(
      `/api/rooms/${roomId}/join`,
      body,
    );
    return data;
  },

  async getRoom(roomId: string): Promise<{ room: GameRoom; players: Player[] }> {
    const { data } = await api.get<{ room: GameRoom; players: Player[] }>(`/api/rooms/${roomId}`);
    return data;
  },

  async createGuest(nickname: string): Promise<{ id: string; nickname: string }> {
    const { data } = await api.post<{ id: string; nickname: string }>('/api/guests', { nickname });
    return data;
  },
};
