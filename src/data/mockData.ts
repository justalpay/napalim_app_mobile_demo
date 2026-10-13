import { Category, MapPin, ActivityEvent, UserProfile, MascotKey } from '../types/data';
import { Colors } from '../theme/colors';

export const MASCOTS: { key: MascotKey; name: string; tag: string; image: any }[] = [
  { key: 'astronaut', name: 'Siber Astronot', tag: '🚀 Derin Uzay & Vizyon', image: require('../../assets/avatars/astronaut.jpg') },
  { key: 'cyber_cat', name: 'Siber Kedi', tag: '🐱 Gece Kuşu & Gizem', image: require('../../assets/avatars/cyber_cat.jpg') },
  { key: 'neon_fox', name: 'Neon Tilki', tag: '🦊 Enerjik & Hızlı', image: require('../../assets/avatars/neon_fox.jpg') },
  { key: 'robot', name: 'Mecha Robot', tag: '🤖 Oyun & Teknoloji', image: require('../../assets/avatars/robot.jpg') },
];

export const POPULAR_TAGS = [
  '🎮 Gaming',
  '☕ Kafe Keşfi',
  '🎲 Kutu Oyunları',
  '🎵 Canlı Müzik',
  '🏃 Doğa & Spor',
  '🎨 Sanat & Atölye',
  '🍕 Sokak Lezzetleri',
  '📸 Fotoğrafçılık',
  '🍸 Gece Hayatı',
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 99,
  name: 'Alpay',
  age: 24,
  district: 'Kadıköy',
  bio: 'Yeni mekanlar, FIFA turnuvaları ve spontane sokak turları için buradayım!',
  avatar: null, // Initial null to let user see and experience the lock screen!
  avatars: [], // Multiple photos (up to 3)
  tags: ['🎮 Gaming', '☕ Kafe Keşfi', '🎲 Kutu Oyunları', '🎵 Canlı Müzik'],
  isLocationHidden: false,
  isDiscoverEnabled: true,
  isPremium: false,
  isPremiumBadgeHidden: false,
  stats: {
    matchesCount: 3,
    superLikesCount: 2,
    pinsCount: 5,
    eventsCount: 2,
  },
};

export const ICEBREAKER_QUESTIONS: string[] = [
  '☕ İlk buluşmada kahve mi, bubble tea mi yoksa kokteyl mi?',
  '⏳ Eğer zamanda tek seferlik yolculuk hakkın olsa geçmişe mi geleceğe mi giderdin?',
  '🍕 Pizza kenarı yenir mi yoksa tabakta bırakılır mı? Dürüst ol!',
  '🎧 Kulaklığında şu an en son çalan şarkı neydi?',
  '✈️ Yarın sabah uyanıp dünyanın herhangi bir yerine ışınlanabilsen nereye giderdin?',
  '🎬 Hayatını bir film anlatsaydı türü komedi mi olurdu, macera mı?',
  '🎮 Gece 02:00’de gelen "hadi bir yerlere gidelim" mesajına cevabın ne olur?',
  '🐾 Kedi insanı mısın köpek insanı mı? Tarafını seç!',
  '🌮 Gece dışarı çıktıktan sonra son durak dönerci mi, midyeci mi?',
  '⛺ Doğa kampı mı, yoksa 5 yıldızlı her şey dahil otel tatili mi?',
];

export const CURRENT_USER = {
  id: 99,
  name: 'Alpay',
  avatar: '🦊',
};

export interface SwipeUser {
  id: number;
  name: string;
  age: number;
  image: any;
  bio: string;
  location: string;
  interests: string[];
  distance: string;
}

export const SWIPE_USERS: SwipeUser[] = [
  {
    id: 2,
    name: 'Elif',
    age: 22,
    image: require('../../assets/users/elif.jpg'),
    bio: 'Tek başımayım, fotoğraf çekmeyi seven biri arıyorum gezi için 📸',
    location: 'Beşiktaş',
    interests: ['Fotoğraf', 'Doğa Yürüyüşü', 'Kahve'],
    distance: '1.2 km',
  },
  {
    id: 4,
    name: 'Zeynep',
    age: 25,
    image: require('../../assets/users/zeynep.jpg'),
    bio: 'Board game oynamak isteyen var mı? Catan, Ticket to Ride falan 🎲',
    location: 'Kadıköy',
    interests: ['Kutu Oyunu', 'Kafe', 'Sohbet'],
    distance: '0.8 km',
  },
  {
    id: 1,
    name: 'Arda',
    age: 24,
    image: require('../../assets/users/arda.jpg'),
    bio: '3 kişiyiz, okey oynamak istiyoruz. Kadıköy civarındayız! ☕',
    location: 'Kadıköy',
    interests: ['Okey', 'Tavla', 'Kafe Keşfi'],
    distance: '0.5 km',
  },
  {
    id: 3,
    name: 'Burak',
    age: 27,
    image: require('../../assets/users/burak.jpg'),
    bio: 'FIFA turnuvasına katılacak birilerini arıyoruz, 2 kişiyiz 🎮',
    location: 'Taksim',
    interests: ['PlayStation', 'FIFA', 'E-Spor'],
    distance: '2.1 km',
  },
  {
    id: 5,
    name: 'Can',
    age: 29,
    image: require('../../assets/users/can.jpg'),
    bio: 'Sahilde voleybol oynayacak 4 kişi arıyoruz! 🏐',
    location: 'Bakırköy',
    interests: ['Voleybol', 'Spor', 'Sahil'],
    distance: '3.5 km',
  },
];

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tümü', icon: '✨', color: Colors.accentPurple },
  { id: 'gaming', name: 'Oyun', icon: '🎮', color: Colors.categoryGaming },
  { id: 'cafe', name: 'Kafe', icon: '☕', color: Colors.categoryCafe },
  { id: 'art', name: 'Sanat', icon: '🎨', color: Colors.categoryArt },
  { id: 'sport', name: 'Spor', icon: '🏃', color: Colors.categorySport },
  { id: 'music', name: 'Müzik', icon: '🎵', color: Colors.categoryMusic },
  { id: 'other', name: 'Diğer', icon: '🎯', color: Colors.categoryOther },
];

export const INITIAL_PINS: MapPin[] = [
  // Kadıköy
  { id: 1, lat: 40.9907, lng: 29.0230, category: 'gaming', description: 'Bu civarda PS kafe var, FIFA turnuvası yapıyorlar her akşam', district: 'kadıköy', upvotes: 24, createdAt: '2s önce' },
  { id: 2, lat: 40.9885, lng: 29.0290, category: 'cafe', description: 'Çok tatlı bir kedi kafe var, çay bahçesi de güzel', district: 'kadıköy', upvotes: 42, createdAt: '1s önce' },
  { id: 3, lat: 40.9920, lng: 29.0180, category: 'art', description: 'Dövmeci var buralarda, custom çizim yapıyor fiyatlar uygun', district: 'kadıköy', upvotes: 18, createdAt: '4s önce' },
  { id: 4, lat: 40.9870, lng: 29.0250, category: 'sport', description: 'Sahilde koşu parkuru var, sabahları kalabalık oluyor', district: 'kadıköy', upvotes: 31, createdAt: '3s önce' },
  { id: 5, lat: 40.9930, lng: 29.0200, category: 'music', description: 'Canlı müzik yapan bar var, cuma akşamları jazz çalıyorlar', district: 'kadıköy', upvotes: 56, createdAt: '5s önce' },

  // Beşiktaş
  { id: 6, lat: 41.0422, lng: 29.0050, category: 'cafe', description: 'Boğaz manzaralı kahveci, türk kahvesi efsane', district: 'beşiktaş', upvotes: 67, createdAt: '1s önce' },
  { id: 7, lat: 41.0450, lng: 29.0080, category: 'gaming', description: 'Board game cafe var, 200+ kutu oyun mevcut', district: 'beşiktaş', upvotes: 38, createdAt: '6s önce' },
  { id: 8, lat: 41.0400, lng: 29.0020, category: 'music', description: 'Sokak müzisyenleri toplanıyor akşamları, jam session yapılıyor', district: 'beşiktaş', upvotes: 45, createdAt: '2s önce' },

  // Taksim / Beyoğlu
  { id: 9, lat: 41.0370, lng: 28.9850, category: 'art', description: 'Grafiti workshop var, duvar boyama etkinliği yapıyorlar', district: 'taksim', upvotes: 29, createdAt: '3s önce' },
  { id: 10, lat: 41.0340, lng: 28.9770, category: 'gaming', description: 'Retro oyun salonu, atari makineleri var nostalji', district: 'taksim', upvotes: 52, createdAt: '7s önce' },
  { id: 11, lat: 41.0355, lng: 28.9810, category: 'cafe', description: 'Kitapçı-kafe konsepti, sessiz çalışma alanı da var', district: 'beyoğlu', upvotes: 33, createdAt: '4s önce' },
  { id: 12, lat: 41.0380, lng: 28.9790, category: 'other', description: 'Kaçış odası var, 2-6 kişilik gruplar için ideal', district: 'taksim', upvotes: 41, createdAt: '2s önce' },

  // Üsküdar
  { id: 13, lat: 41.0255, lng: 29.0155, category: 'sport', description: 'Kız Kulesi manzaralı yoga yapılan park, sabah 7de başlıyor', district: 'üsküdar', upvotes: 27, createdAt: '1s önce' },
  { id: 14, lat: 41.0230, lng: 29.0190, category: 'cafe', description: 'Çınaraltı çay bahçesi, tavla oynamak için birebir', district: 'üsküdar', upvotes: 59, createdAt: '8s önce' },

  // Eminönü / Karaköy
  { id: 15, lat: 41.0170, lng: 28.9740, category: 'other', description: 'Balık tutma noktası, olta kiralayan yer var', district: 'karaköy', upvotes: 35, createdAt: '5s önce' },
  { id: 16, lat: 41.0220, lng: 28.9770, category: 'art', description: 'Seramik atölyesi, workshop\'a katılabilirsiniz', district: 'karaköy', upvotes: 22, createdAt: '3s önce' },
  { id: 17, lat: 41.0200, lng: 28.9750, category: 'music', description: 'Plakçı dükkanı, vinil dinleme köşesi var', district: 'karaköy', upvotes: 48, createdAt: '6s önce' },

  // Bakırköy
  { id: 18, lat: 40.9800, lng: 28.8720, category: 'sport', description: 'Sahilde bisiklet kiralama var, parkur çok güzel', district: 'bakırköy', upvotes: 36, createdAt: '2s önce' },
  { id: 19, lat: 40.9820, lng: 28.8680, category: 'gaming', description: 'VR deneyim merkezi, grup indirim yapıyorlar', district: 'bakırköy', upvotes: 44, createdAt: '4s önce' },

  // Sarıyer / Bebek
  { id: 20, lat: 41.0770, lng: 29.0440, category: 'cafe', description: 'Boğaz kenarında waffle yapan tezgah, oturma alanı da var', district: 'bebek', upvotes: 51, createdAt: '1s önce' },

  // Pendik
  { id: 21, lat: 40.8755, lng: 29.2340, category: 'cafe', description: 'Pendik Marina yanında harika bir üçüncü nesil kahveci ☕', district: 'pendik', upvotes: 39, createdAt: '2s önce' },
  { id: 22, lat: 40.8780, lng: 29.2290, category: 'sport', description: 'Sahil boyunca paten ve kaykay pisti, akşamları ışıklandırma var 🛹', district: 'pendik', upvotes: 26, createdAt: '4s önce' },
];

export const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: 1,
    title: 'Kadıköy Okey Gecesi 🎲',
    description: 'Kadıköy\'de 4 kişilik okey masası kuruyoruz, çay ve simit bizden!',
    location: 'Kadıköy • Moda',
    lat: 40.9912,
    lng: 29.0255,
    category: 'gaming',
    maxMembers: 4,
    members: [{ id: 1, name: 'Arda', avatar: '🧑', role: 'admin' }],
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    expiresAt: Date.now() + 70 * 60 * 60 * 1000,
    status: 'active',
  },
  {
    id: 2,
    title: 'Boğaz Fotoğraf Turu 📸',
    description: 'Beşiktaş\'tan Ortaköy\'e yürüyüp fotoğraf çekeceğiz, herkese açık!',
    location: 'Beşiktaş • Sahil',
    lat: 41.0428,
    lng: 29.0065,
    category: 'art',
    maxMembers: 8,
    members: [
      { id: 2, name: 'Elif', avatar: '👩', role: 'admin' },
      { id: 6, name: 'Selin', avatar: '👧', role: 'member' },
      { id: 10, name: 'Defne', avatar: '👩‍🦰', role: 'member' },
    ],
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
    status: 'active',
  },
  {
    id: 3,
    title: 'FIFA 25 PS Turnuvası 🎮',
    description: 'PS kafe\'de FIFA turnuvası! Kaybedenler çay ve tost ısmarlar.',
    location: 'Taksim • İstiklal',
    lat: 41.0360,
    lng: 28.9840,
    category: 'gaming',
    maxMembers: 8,
    members: [
      { id: 3, name: 'Burak', avatar: '🧑', role: 'admin' },
      { id: 9, name: 'Kaan', avatar: '👦', role: 'member' },
    ],
    createdAt: Date.now() - 67 * 60 * 60 * 1000,
    expiresAt: Date.now() + 5 * 60 * 60 * 1000,
    status: 'active',
  },
  {
    id: 4,
    title: 'Caddebostan Sahil Koşusu 🏃',
    description: 'Sabah sahil yolunda buluşup koşuyoruz, tempo orta seviye!',
    location: 'Bostancı • Sahil',
    lat: 40.9635,
    lng: 29.0940,
    category: 'sport',
    maxMembers: 10,
    members: [
      { id: 5, name: 'Can', avatar: '🏃', role: 'admin' },
      { id: 99, name: 'Alpay', avatar: '🦊', role: 'member' },
    ],
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
    expiresAt: Date.now() + 66 * 60 * 60 * 1000,
    status: 'active',
  },
  {
    id: 5,
    title: 'Catan & Kutu Oyunları ♟️',
    description: 'Board game kafe\'de Catan oynuyoruz, kuralları bilmiyorsan da gel!',
    location: 'Kadıköy • Rıhtım',
    lat: 40.9875,
    lng: 29.0310,
    category: 'gaming',
    maxMembers: 4,
    members: [
      { id: 4, name: 'Zeynep', avatar: '👩', role: 'admin' },
      { id: 8, name: 'Ayşe', avatar: '👧', role: 'member' },
      { id: 7, name: 'Emre', avatar: '🧑', role: 'member' },
      { id: 1, name: 'Arda', avatar: '🧑', role: 'member' },
    ],
    createdAt: Date.now() - 48 * 60 * 60 * 1000,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    status: 'active',
  },
  {
    id: 6,
    title: 'Akustik Jam Session 🎸',
    description: 'Gitar, perküsyon fark etmez! Beyoğlu kafesinde canlı jam.',
    location: 'Beyoğlu • Tünel',
    lat: 41.0335,
    lng: 28.9765,
    category: 'music',
    maxMembers: 6,
    members: [{ id: 7, name: 'Emre', avatar: '🎸', role: 'admin' }],
    createdAt: Date.now() - 1 * 60 * 60 * 1000,
    expiresAt: Date.now() + 71 * 60 * 60 * 1000,
    status: 'active',
  },
];

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export const INITIAL_EVENT_CHATS: Record<number, ChatMessage[]> = {
  4: [
    { id: 1, senderId: 5, senderName: 'Can', text: 'Yarın sabah 7\'de Caddebostan sahilinde buluşuyoruz!', time: '18:00' },
    { id: 2, senderId: 99, senderName: 'Alpay', text: 'Tamamdır Can, suyumu alıp geliyorum 🏃', time: '18:15' },
    { id: 3, senderId: 5, senderName: 'Can', text: 'Süper! 5 kişiyiz şu an, tam kıvamında', time: '18:20' },
  ],
  1: [
    { id: 1, senderId: 1, senderName: 'Arda', text: 'Okey için 2 kişi daha lazım, çaylar benden!', time: '19:10' },
  ],
};
