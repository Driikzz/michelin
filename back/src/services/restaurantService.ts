import type { IRestaurantRepository } from '../repositories/IRestaurantRepository';
import type { Restaurant, RestaurantSearchParams, Tag } from '../types/restaurant';

export class NoRestaurantsError extends Error {
  constructor() {
    super('No restaurants found matching the criteria');
    this.name = 'NoRestaurantsError';
  }
}

export class RestaurantService {
  constructor(private restaurantRepository: IRestaurantRepository) {}

  async search(params: RestaurantSearchParams): Promise<Restaurant[]> {
    return this.restaurantRepository.search(params);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.restaurantRepository.getAllTags();
  }

  async getRestaurantsForGame(params: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    priceFilters: number[];
    tagIds: number[];
    count: number;
  }): Promise<Restaurant[]> {
    const priceFilter = params.priceFilters.length > 0 && params.priceFilters.length < 4
      ? params.priceFilters
      : undefined;

    const results = await this.restaurantRepository.search({
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radiusKm,
      ...(priceFilter && { prices: priceFilter }),
      ...(params.tagIds.length > 0 && { tags: params.tagIds }),
      limit: 200,
    });

    if (results.length === 0) {
      throw new NoRestaurantsError();
    }

    const shuffled = fisherYates(results);
    return shuffled.slice(0, params.count);
  }

  async getRandomTagIds(count: number): Promise<number[]> {
    return this.restaurantRepository.getRandomTagIds(count);
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
