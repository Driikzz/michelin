import { Router } from 'express';
import { UserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/authenticate';

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/', authenticate, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);

export default router;
