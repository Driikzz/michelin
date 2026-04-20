import type { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  constructor(private userService: UserService) {}

  getAllUsers = async (req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();
    res.json(users);
  };

  getUserById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const user = await this.userService.getUserById(id);
    if (user) res.json(user);
    else res.status(404).json({ error: 'User not found' });
  };

  createUser = async (req: Request, res: Response) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Missing fields' });
    const user = await this.userService.createUser({ name, email });
    res.status(201).json(user);
  };
}
