export type MichelinRank = '1_star' | '2_stars' | '3_stars' | 'bib_gourmand' | 'selected' | null;

export interface Tag {
  id: number;
  name: string;
}

export interface HoursSlot {
  closed: boolean;
  closes: string;
  opens: string;
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
  // new fields
  slug: string | null;
  region: string | null;
  city_slug: string | null;
  email: string | null;
  michelin_url: string | null;
  green_star: boolean;
  chef: string | null;
  currency: string | null;
  guide_year: number | null;
  days_open: string[] | null;
  hours_of_operation: Record<string, HoursSlot[]> | null;
  facilities: string[] | null;
  images: string[];
  tags: Tag[];
}

export interface RestaurantSearchParams {
  query?: string;
  tags?: number[];
  prices?: number[];
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
}
