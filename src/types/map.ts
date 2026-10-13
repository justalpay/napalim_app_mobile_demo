// =============================================
// Napalim Mobile — Map Types
// =============================================

export type CategoryId = 'gaming' | 'cafe' | 'art' | 'sport' | 'music' | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
}

export interface MapPin {
  id: number | string;
  lat: number;
  lng: number;
  category: CategoryId;
  description: string;
  upvotes: number;
  createdAt: string;
  title?: string;
}
