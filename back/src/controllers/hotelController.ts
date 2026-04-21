import type { Request, Response } from 'express';
import { HotelRepository } from '../repositories/hotelRepository';
import { HotelService } from '../services/hotelService';

const hotelService = new HotelService(new HotelRepository());

export const hotelController = {
  async search(req: Request, res: Response): Promise<void> {
    const q = req.query['q'] as string | undefined;
    const price = req.query['price'] ? Number(req.query['price']) : undefined;
    const lat = req.query['lat'] ? Number(req.query['lat']) : undefined;
    const lng = req.query['lng'] ? Number(req.query['lng']) : undefined;
    const radius = req.query['radius'] ? Number(req.query['radius']) : undefined;
    const tagsParam = req.query['tags'] as string | undefined;
    const tags = tagsParam ? tagsParam.split(',').map(Number).filter(Boolean) : undefined;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'lat and lng are required' });
      return;
    }

    try {
      const hotels = await hotelService.search({
        ...(q !== undefined && { query: q }),
        ...(tags !== undefined && { tags }),
        ...(price !== undefined && { price }),
        lat,
        lng,
        ...(radius !== undefined && { radius }),
      });
      res.json({ hotels });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },

  async getTags(_req: Request, res: Response): Promise<void> {
    try {
      const tags = await hotelService.getAllTags();
      res.json({ tags });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },
};
