import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import guestRoutes from './routes/guestRoutes';
import roomRoutes from './routes/roomRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import hotelRoutes from './routes/hotelRoutes';
import { initializeDatabase } from './db/pool';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/hotels', hotelRoutes);

initializeDatabase().catch((error) => {
  console.error('Failed to initialize the database:', error);
  process.exit(1);
});

export default app;
