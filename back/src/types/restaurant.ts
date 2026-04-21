export type MichelinRank = '1_star' | '2_stars' | '3_stars' | 'bib_gourmand' | 'selected' | null;

export interface Tag {
  id: number;
  name: string;
}

export interface Restaurant {
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

export interface RestaurantSearchParams {
  query?: string;
  tags?: number[];
  price?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
}
