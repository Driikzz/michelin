import type { User, UserWithPassword } from '../types/user';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithPassword | null>;
  create(username: string | null, email: string | null, passwordHash: string | null): Promise<User>;
  addXp(id: string, amount: number): Promise<{ xp: number; level: number; streak: number }>;
  resetStreak(id: string): Promise<void>;
}
