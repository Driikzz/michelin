import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import { initializeDatabase } from './db/pool';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

initializeDatabase().catch((error) => {
  console.error('Failed to initialize the database:', error);
});

export default app;
