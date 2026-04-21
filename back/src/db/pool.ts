import { Pool } from 'pg';
import { runMigrations } from './migrations/migrationRunner';

export const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

export async function initializeDatabase(): Promise<void> {
  try {
    await runMigrations(pool);
    console.log('Database migrations applied');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
