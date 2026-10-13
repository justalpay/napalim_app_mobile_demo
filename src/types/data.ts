// =============================================
// Napalim Mobile — Data Types
// =============================================

export type CategoryId = 'all' | 'gaming' | 'cafe' | 'art' | 'sport' | 'music' | 'other';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
  color: string;
}

export interface MapPin {
  id: number;
  lat: number;
  lng: number;
  category: CategoryId;
  description: string;
  district?: string;
  upvotes: number;
  createdAt: string;
}

export interface EventMember {
  id: number | string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
}

export interface ActivityEvent {
  id: number;
  title: string;
  description: string;
  category: CategoryId;
  location: string;
  lat?: number;
  lng?: number;
  createdAt: number;
  expiresAt: number;
  maxMembers: number;
  members: EventMember[];
  status: 'active' | 'closed' | 'expired';
}

export type MascotKey = 'astronaut' | 'cyber_cat' | 'neon_fox' | 'robot';

export type AvatarSource =
  | { type: 'mascot'; key: MascotKey }
  | { type: 'emoji'; emoji: string }
  | { type: 'custom'; uri: string };

export interface UserProfile {
  id: number;
  name: string;
  age: number;
  district: string;
  bio: string;
  avatar: AvatarSource | null;
  avatars: AvatarSource[];
  tags: string[];
  isLocationHidden: boolean;
  isInvisibleMode?: boolean;
  isDiscoverEnabled?: boolean;
  isPremium?: boolean;
  isPremiumBadgeHidden?: boolean;
  stats: {
    matchesCount: number;
    superLikesCount: number;
    pinsCount: number;
    eventsCount: number;
  };
}

export interface DiscoveryFilters {
  maxDistanceKm: number;
  minAge: number;
  maxAge: number;
  commonInterestsOnly: boolean;
}

