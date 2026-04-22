import { Router } from 'express';
import { UserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { UserController } from '../controllers/userController';
import { GameHistoryRepository } from '../repositories/gameHistoryRepository';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const historyRepository = new GameHistoryRepository();
const userController = new UserController(userService, historyRepository);

// /me/history must be before /:id to avoid being swallowed by the param route
router.get('/me/history', authenticate, userController.getMyHistory);
router.get('/', authenticate, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);

export default router;
