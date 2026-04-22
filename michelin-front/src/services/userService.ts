import api from '../api/axiosInstance';
import type { GameHistoryEntry } from '../types/api';

export const userService = {
  async getMyHistory(): Promise<GameHistoryEntry[]> {
    const res = await api.get<GameHistoryEntry[]>('/api/users/me/history');
    return res.data;
  },
};
