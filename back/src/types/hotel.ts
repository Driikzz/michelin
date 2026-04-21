import type { MichelinRank, Tag } from './restaurant';

export type { MichelinRank };

export interface Hotel {
  id: string;
  name: string;
  description: string | null;
  michelin_rank: MichelinRank;
  price_category: number | null;
  phone: string | null;
  website_url: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  images: string[];
  tags: Tag[];
}

export interface HotelSearchParams {
  query?: string;
  tags?: number[];
  prices?: number[];
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
}
