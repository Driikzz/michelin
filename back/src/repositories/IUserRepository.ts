import type { User } from '../types/user';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
}
