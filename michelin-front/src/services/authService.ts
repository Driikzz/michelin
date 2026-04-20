import axios from 'axios';
import api from '../api/axiosInstance';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth';

export function extractApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ user: User }>('/api/auth/me');
    return data.user;
  },
};
