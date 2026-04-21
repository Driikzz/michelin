import { pool } from '../db/pool';
import type { User, UserWithPassword } from '../types/user';
import type { IUserRepository } from './IUserRepository';

export class UserRepository implements IUserRepository {
  async findAll(): Promise<User[]> {
    const res = await pool.query<User>(
      'SELECT id, username, email, xp, level, streak, created_at, updated_at FROM users',
    );
    return res.rows;
  }

  async findById(id: string): Promise<User | null> {
    const res = await pool.query<User>(
      'SELECT id, username, email, xp, level, streak, created_at, updated_at FROM users WHERE id = $1',
      [id],
    );
    return res.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const res = await pool.query<UserWithPassword>(
      'SELECT id, username, email, password_hash, xp, level, streak, created_at, updated_at FROM users WHERE email = $1',
      [email],
    );
    return res.rows[0] ?? null;
  }

  async create(
    username: string | null,
    email: string | null,
    passwordHash: string | null,
  ): Promise<User> {
    const res = await pool.query<User>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, xp, level, streak, created_at, updated_at`,
      [username, email, passwordHash],
    );
    const row = res.rows[0];
    if (!row) throw new Error('User creation failed unexpectedly');
    return row;
  }

  async addXp(id: string, amount: number): Promise<{ xp: number; level: number; streak: number }> {
    const res = await pool.query<{ xp: number; level: number; streak: number }>(
      `UPDATE users
       SET xp         = xp + $2,
           streak     = streak + 1,
           level      = FLOOR(SQRT((xp + $2) / 10.0))::INT,
           updated_at = now()
       WHERE id = $1
       RETURNING xp, level, streak`,
      [id, amount],
    );
    const row = res.rows[0];
    if (!row) throw new Error('User not found');
    return row;
  }

  async resetStreak(id: string): Promise<void> {
    await pool.query('UPDATE users SET streak = 0, updated_at = now() WHERE id = $1', [id]);
  }
}
