import api from '../api/axiosInstance';
import type { Entity, EntityType, Tag } from '../types/api';

export interface EntitySearchParams {
  lat: number;
  lng: number;
  radius?: number;
  q?: string;
  prices?: number[];
  tags?: string; // comma-separated tag IDs
  limit?: number;
}

export const entityService = {
  async searchEntities(entityType: EntityType, params: EntitySearchParams): Promise<Entity[]> {
    const path = entityType === 'HOTEL' ? '/api/hotels/search' : '/api/restaurants/search';
    const { data } = await api.get<{ restaurants?: Entity[]; hotels?: Entity[] }>(path, {
      params: {
        lat: params.lat,
        lng: params.lng,
        ...(params.radius !== undefined && { radius: params.radius }),
        ...(params.q !== undefined && params.q !== '' && { q: params.q }),
        ...(params.prices && params.prices.length > 0 && { prices: params.prices.join(',') }),
        ...(params.tags !== undefined && params.tags !== '' && { tags: params.tags }),
        ...(params.limit !== undefined && { limit: params.limit }),
      },
    });
    return data.restaurants ?? data.hotels ?? [];
  },

  async getNearbyHotels(params: {
    lat: number;
    lng: number;
    radius?: number;
    prices?: number[];
    limit?: number;
  }): Promise<Entity[]> {
    const { data } = await api.get<{ hotels: Entity[] }>('/api/hotels/nearby', {
      params: {
        lat: params.lat,
        lng: params.lng,
        ...(params.radius !== undefined && { radius: params.radius }),
        ...(params.prices && params.prices.length > 0 && { prices: params.prices.join(',') }),
        ...(params.limit !== undefined && { limit: params.limit }),
      },
    });
    return data.hotels;
  },

  async getTags(entityType: EntityType): Promise<Tag[]> {
    const path = entityType === 'HOTEL' ? '/api/hotels/tags' : '/api/restaurants/tags';
    const { data } = await api.get<{ tags: Tag[] }>(path);
    return data.tags;
  },
};
