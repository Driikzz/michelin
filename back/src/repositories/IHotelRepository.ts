import type { Hotel, HotelSearchParams } from '../types/hotel';
import type { Tag } from '../types/restaurant';

export interface IHotelRepository {
  search(params: HotelSearchParams): Promise<Hotel[]>;
  findById(id: string): Promise<Hotel | null>;
  findByIds(ids: string[]): Promise<Hotel[]>;
  getAllTags(): Promise<Tag[]>;
  getRandomTagIds(count: number): Promise<number[]>;
}
