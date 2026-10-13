// =============================================
// Napalim Mobile — Design System & Colors
// Extracted 1:1 from Napalim Web Prototype
// =============================================

export const Colors = {
  // Backgrounds
  bgPrimary: '#07070d',
  bgSecondary: '#0f0f1a',
  bgTertiary: '#161625',
  bgCard: '#1a1a2e',
  bgGlass: 'rgba(255, 255, 255, 0.05)',
  bgGlassHover: 'rgba(255, 255, 255, 0.08)',

  // Borders
  borderGlass: 'rgba(255, 255, 255, 0.10)',
  borderLight: 'rgba(255, 255, 255, 0.16)',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  textMuted: '#475569',

  // Accents
  accentPurple: '#a855f7',
  accentPink: '#ec4899',
  accentBlue: '#3b82f6',
  accentCyan: '#06b6d4',
  accentGreen: '#22c55e',
  accentOrange: '#f97316',
  accentRed: '#ef4444',
  accentYellow: '#eab308',

  // Categories
  categoryGaming: '#a855f7',
  categoryCafe: '#f97316',
  categoryArt: '#ec4899',
  categorySport: '#22c55e',
  categoryMusic: '#3b82f6',
  categoryOther: '#94a3b8',
} as const;

export const MapConfig = {
  initialRegion: {
    latitude: 40.990,
    longitude: 29.025,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  },
};

export const DarkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#07070d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#07070d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#f1f5f9' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0b131a' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#22c55e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161625' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#201b38' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0a0a14' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#a855f7' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#161625' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#04050a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3b82f6' }] }
];
