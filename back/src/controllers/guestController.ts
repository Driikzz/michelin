import type { Request, Response } from 'express';
import { GuestRepository } from '../repositories/guestRepository';
import { GuestService } from '../services/guestService';

const guestService = new GuestService(new GuestRepository());

export const guestController = {
  async create(req: Request, res: Response): Promise<void> {
    const { nickname } = req.body as { nickname?: unknown };
    if (typeof nickname !== 'string' || !nickname.trim()) {
      res.status(400).json({ error: 'nickname is required' });
      return;
    }
    try {
      const guest = await guestService.createGuest(nickname);
      res.status(201).json(guest);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
};
