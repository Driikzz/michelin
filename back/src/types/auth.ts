export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  username: string | null;
  email: string | null;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string | null;
    email: string | null;
    xp: number;
    level: number;
    streak: number;
  };
}
