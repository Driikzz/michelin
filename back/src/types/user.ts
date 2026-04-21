export interface User {
  id: string;
  username: string | null;
  email: string | null;
  xp: number;
  level: number;
  streak: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string | null;
}
