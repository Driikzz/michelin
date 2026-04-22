import type { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import type { IUserRepository } from '../repositories/IUserRepository';

export class AuthController {
  constructor(
    private authService: AuthService,
    private userRepository: IUserRepository,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password } = req.body as {
        username?: unknown;
        email?: unknown;
        password?: unknown;
      };

      if (
        typeof username !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
      ) {
        res.status(400).json({ error: 'username, email and password are required' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      const result = await this.authService.register({ username, email, password });
      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      res.status(400).json({ error: message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body as { email?: unknown; password?: unknown };

      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'email and password are required' });
        return;
      }

      const result = await this.authService.login({ email, password });
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await this.userRepository.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  };
}
