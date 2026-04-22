export interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}
