export type PropertyType = 'land' | 'house' | 'apartment' | 'commercial' | 'villa';

export interface PropertyTypeInfo { id: PropertyType; label: string; plural: string; icon: string }
export interface CityInfo { name: string; areas: string[] }
export interface MapPin { id: string; title: string; type: PropertyType; purpose: 'sale' | 'rent'; price: number; lat: number; lng: number }

export interface PropertyCardData {
  id: string; title: string; type: PropertyType; purpose: 'sale' | 'rent';
  price: number; perches: number; beds: number; baths: number; sqft: number;
  area: string; cityName: string; featured: boolean; verified: boolean;
  photo: string;
}

export interface ProjectCardData {
  id: string; name: string; area: string; cityName: string;
  status: 'Selling' | 'Launching' | string; handover: string; pricePerPerch: number;
  stats: { total: number; available: number; sold: number; reserved: number };
  photo: string;
  org: { id: string; name: string; kind: string; color: string | null; logo: string | null; logoPhoto: string };
}

export interface HomeData {
  types: PropertyTypeInfo[];
  cities: CityInfo[];
  pins: MapPin[];
  allPoints: [number, number][];
  featured: PropertyCardData[];
  spotlight: ProjectCardData[];
}
