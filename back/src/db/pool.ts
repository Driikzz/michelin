import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase() {

  try {
    await pool.query("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY,username VARCHAR(50) NOT NULL UNIQUE, email VARCHAR(100) NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);");
    console.log('Database initialized with user table');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
