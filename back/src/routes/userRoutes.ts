import { Router } from 'express';
import { UserRepository } from '../repositories/userRepository';
import { UserService } from '../services/userService';
import { UserController } from '../controllers/userController';

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);

export default router;
