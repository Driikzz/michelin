import type { Restaurant, RestaurantSearchParams, Tag } from '../types/restaurant';

export interface IRestaurantRepository {
  search(params: RestaurantSearchParams): Promise<Restaurant[]>;
  findById(id: string): Promise<Restaurant | null>;
  findByIds(ids: string[]): Promise<Restaurant[]>;
  getAllTags(): Promise<Tag[]>;
  getRandomTagIds(count: number): Promise<number[]>;
}
