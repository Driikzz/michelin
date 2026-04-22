import type { Request, Response } from 'express';
import { UserService } from '../services/userService';
import type { IGameHistoryRepository } from '../repositories/IGameHistoryRepository';

export class UserController {
  constructor(
    private userService: UserService,
    private historyRepository: IGameHistoryRepository,
  ) {}

  getAllUsers = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.getAllUsers();
    res.json(users);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params['id'];
    const id = Array.isArray(idParam) ? (idParam[0] ?? '') : (idParam ?? '');
    const user = await this.userService.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  };

  getMyHistory = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const history = await this.historyRepository.getByUserId(userId, 20);
    res.json(history);
  };
}
