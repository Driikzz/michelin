import type { User, UserWithPassword } from '../types/user';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<UserWithPassword | null>;
  create(username: string, email: string, passwordHash: string): Promise<User>;
}
