import { Router } from 'express';
import { UserRepository } from '../repositories/userRepository';
import { AuthService } from '../services/authService';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

export default router;
