import { pool } from '../db/pool';
import type { User } from '../types/user';
import type { IUserRepository } from './IUserRepository';

export class UserRepository implements IUserRepository {
  async findAll(): Promise<User[]> {
    const res = await pool.query('SELECT id, name, email FROM users');
    return res.rows;
  }

  async findById(id: number): Promise<User | null> {
    const res = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const res = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
      [user.name, user.email]
    );
    return res.rows[0];
  }
}
