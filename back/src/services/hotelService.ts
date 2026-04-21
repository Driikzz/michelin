import type { IHotelRepository } from '../repositories/IHotelRepository';
import type { Hotel, HotelSearchParams } from '../types/hotel';
import type { Tag } from '../types/restaurant';

export class NoHotelsError extends Error {
  constructor() {
    super('No hotels found matching the criteria');
    this.name = 'NoHotelsError';
  }
}

export class HotelService {
  constructor(private hotelRepository: IHotelRepository) {}

  async search(params: HotelSearchParams): Promise<Hotel[]> {
    return this.hotelRepository.search(params);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.hotelRepository.getAllTags();
  }

  async getHotelsForGame(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    priceFilters: number[];
    tagIds: number[];
    count: number;
  }): Promise<Hotel[]> {
    const results = await this.hotelRepository.search({
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radiusKm,
      ...(params.priceFilters.length > 0 && { prices: params.priceFilters }),
      ...(params.tagIds.length > 0 && { tags: params.tagIds }),
      limit: 100,
    });

    if (results.length === 0) {
      throw new NoHotelsError();
    }

    return fisherYates(results).slice(0, params.count);
  }

  async getRandomTagIds(count: number): Promise<number[]> {
    return this.hotelRepository.getRandomTagIds(count);
  }
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
