import express from 'express';
import userRoutes from './routes/userRoutes';
import healthRoutes from './routes/healthRoutes';

const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/health', healthRoutes);

export default app;
