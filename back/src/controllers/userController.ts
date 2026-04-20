import type { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  constructor(private userService: UserService) {}

  getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAllUsers();
    res.json(users);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params['id']);
    const user = await this.userService.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  };
}
