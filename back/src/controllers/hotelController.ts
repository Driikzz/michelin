import type { Request, Response } from 'express';
import { HotelRepository } from '../repositories/hotelRepository';
import { HotelService } from '../services/hotelService';

const hotelService = new HotelService(new HotelRepository());

export const hotelController = {
  async search(req: Request, res: Response): Promise<void> {
    const q = req.query['q'] as string | undefined;
    const pricesParam = req.query['prices'] as string | undefined;
    const allPrices = pricesParam ? pricesParam.split(',').map(Number).filter(Boolean) : undefined;
    // selecting all 4 price levels = no restriction (same as selecting none)
    const prices = allPrices && allPrices.length > 0 && allPrices.length < 4 ? allPrices : undefined;
    const lat = req.query['lat'] ? Number(req.query['lat']) : undefined;
    const lng = req.query['lng'] ? Number(req.query['lng']) : undefined;
    const radius = req.query['radius'] ? Number(req.query['radius']) : undefined;
    const tagsParam = req.query['tags'] as string | undefined;
    const tags = tagsParam ? tagsParam.split(',').map(Number).filter(Boolean) : undefined;
    const limit = req.query['limit'] ? Number(req.query['limit']) : undefined;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'lat and lng are required' });
      return;
    }

    try {
      const hotels = await hotelService.search({
        ...(q !== undefined && { query: q }),
        ...(tags !== undefined && { tags }),
        ...(prices !== undefined && prices.length > 0 && { prices }),
        lat,
        lng,
        ...(radius !== undefined && { radius }),
        ...(limit !== undefined && { limit }),
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
