import { pool } from '../db/pool';
import type { User, UserWithPassword } from '../types/user';
import type { IUserRepository } from './IUserRepository';

export class UserRepository implements IUserRepository {
  async findAll(): Promise<User[]> {
    const res = await pool.query<User>('SELECT id, username, email FROM users');
    return res.rows;
  }

  async findById(id: number): Promise<User | null> {
    const res = await pool.query<User>(
      'SELECT id, username, email FROM users WHERE id = $1',
      [id],
    );
    return res.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const res = await pool.query<UserWithPassword>(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1',
      [email],
    );
    return res.rows[0] ?? null;
  }

  async create(username: string, email: string, passwordHash: string): Promise<User> {
    const res = await pool.query<User>(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, passwordHash],
    );
    const row = res.rows[0];
    if (!row) throw new Error('User creation failed unexpectedly');
    return row;
  }
}
