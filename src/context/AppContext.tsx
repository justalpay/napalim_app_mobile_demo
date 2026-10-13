import React, { createContext, useContext, useState, useRef } from 'react';
import { ActivityEvent, CategoryId, UserProfile, AvatarSource, MapPin } from '../types/data';
import {
  INITIAL_EVENTS,
  CURRENT_USER,
  INITIAL_EVENT_CHATS,
  ChatMessage,
  INITIAL_USER_PROFILE,
  INITIAL_PINS,
} from '../data/mockData';

export interface MatchMessage {
  id: number;
  sender: 'me' | 'them';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface MatchChat {
  id: number;
  name: string;
  avatar: string;
  location: string;
  lastMsg: string;
  time: string;
  unread: number;
  isTyping?: boolean;
  messages: MatchMessage[];
}

const INITIAL_MATCHES: MatchChat[] = [
  {
    id: 1,
    name: 'Elif',
    avatar: '👩',
    location: 'Beşiktaş',
    lastMsg: 'Yarın öğleden sonra müsait misin?',
    time: '14:32',
    unread: 2,
    messages: [
      { id: 1, sender: 'them', text: 'Selam! Ben de fotoğraf çekmeyi çok seviyorum 📸', time: '13:45' },
      { id: 2, sender: 'me', text: 'Harika! Hangi bölgelerde çekiyorsun genelde?', time: '13:48', status: 'read' },
      { id: 3, sender: 'them', text: 'Boğaz kenarı ve Balat çok güzel oluyor. Sen?', time: '14:02' },
      { id: 4, sender: 'me', text: 'Ben de Kadıköy sokaklarını çok seviyorum', time: '14:15', status: 'read' },
      { id: 5, sender: 'them', text: 'Yarın öğleden sonra müsait misin?', time: '14:32' },
    ],
  },
  {
    id: 2,
    name: 'Zeynep',
    avatar: '👧',
    location: 'Kadıköy',
    lastMsg: 'Catan getiriyorum o zaman! 🎲',
    time: '11:20',
    unread: 0,
    messages: [
      { id: 1, sender: 'them', text: 'Selam! Kutu oyunu oynamak ister misin?', time: '10:30' },
      { id: 2, sender: 'me', text: 'Tabii ki! Catan var mı?', time: '10:45' },
      { id: 3, sender: 'them', text: 'Catan getiriyorum o zaman! 🎲', time: '11:20' },
    ],
  },
  {
    id: 3,
    name: 'Burak',
    avatar: '🧑',
    location: 'Taksim',
    lastMsg: 'FIFA turnuvası için 1 kişi eksik, gelir misin?',
    time: '13:05',
    unread: 1,
    messages: [
      { id: 1, sender: 'them', text: 'FIFA turnuvası için 1 kişi eksik, gelir misin?', time: '13:05' },
    ],
  },
];

const GUEST_PROFILE: UserProfile = {
  id: 9999,
  name: 'Misafir Kullanıcı',
  age: 20,
  district: 'Kadıköy',
  bio: 'Oturum kapalı. Giriş yaparak profilini oluşturabilirsin ✨',
  tags: [],
  avatar: null,
  avatars: [],
  isLocationHidden: false,
  stats: { matchesCount: 0, superLikesCount: 0, pinsCount: 0, eventsCount: 0 },
};

export interface InAppNotification {
  id: string;
  type: 'match' | 'message' | 'premium' | 'info';
  title: string;
  message: string;
  avatar?: string;
  onPress?: () => void;
}

interface AppContextType {
  profile: UserProfile;
  stats: {
    matchesCount: number;
    superLikesCount: number;
    pinsCount: number;
    eventsCount: number;
  };
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  logout: () => void;
  login: (method?: 'apple' | 'google') => void;
  updateProfile: (updated: Partial<UserProfile>) => void;
  upgradeToPremium: () => void;
  setAvatar: (avatar: AvatarSource) => void;
  addPhoto: (photo: AvatarSource) => boolean;
  removePhoto: (index: number) => void;
  clearAvatar: () => void;
  incrementPinCount: () => void;
  pins: MapPin[];
  addPin: (pinData: Omit<MapPin, 'id' | 'createdAt' | 'upvotes'>) => MapPin;
  toggleLikePin: (pinId: number) => void;
  likedPinIds: Record<number, boolean>;
  addMatch: (match: MatchChat) => void;
  useSuperLike: () => boolean;
  buySuperLikes: (count: number) => void;
  events: ActivityEvent[];
  eventChats: Record<number, ChatMessage[]>;
  matches: MatchChat[];
  joinEvent: (event: ActivityEvent) => void;
  leaveEvent: (eventId: number) => void;
  createEvent: (title: string, desc: string, location: string, category: CategoryId, quota: number) => void;
  sendEventMessage: (eventId: number, text: string) => void;
  sendMatchMessage: (matchId: number, text: string) => void;
  setDiscoverEnabled: (enabled: boolean) => void;
  setIsInvisibleMode: (val: boolean) => void;
  // Shared chat modal
  activeChatModal: { type: 'event'; event: ActivityEvent } | { type: 'match'; match: MatchChat } | null;
  openEventChat: (event: ActivityEvent) => void;
  openMatchChat: (match: MatchChat) => void;
  closeChatModal: () => void;
  // In-App Toast Banner
  toast: InAppNotification | null;
  showToast: (toast: Omit<InAppNotification, 'id'>) => void;
  dismissToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [createdPinsCount, setCreatedPinsCount] = useState<number>(5);
  const [superLikesCount, setSuperLikesCount] = useState<number>(2);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_EVENTS);
  const [eventChats, setEventChats] = useState<Record<number, ChatMessage[]>>(INITIAL_EVENT_CHATS);
  const [matches, setMatches] = useState<MatchChat[]>(INITIAL_MATCHES);
  const [pins, setPins] = useState<MapPin[]>(INITIAL_PINS);
  const [likedPinIds, setLikedPinIds] = useState<Record<number, boolean>>({});
  const [activeChatModal, setActiveChatModal] = useState<AppContextType['activeChatModal']>(null);
  const [toast, setToast] = useState<InAppNotification | null>(null);

  const activeChatModalRef = useRef(activeChatModal);
  activeChatModalRef.current = activeChatModal;

  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const eventsRef = useRef(events);
  eventsRef.current = events;

  const addPin = (pinData: Omit<MapPin, 'id' | 'createdAt' | 'upvotes'>): MapPin => {
    const newPin: MapPin = {
      ...pinData,
      id: Date.now(),
      upvotes: 1,
      createdAt: 'Az önce',
    };
    setPins((prev) => [newPin, ...prev]);
    setCreatedPinsCount((prev) => prev + 1);
    return newPin;
  };

  const toggleLikePin = (pinId: number) => {
    const isLiked = likedPinIds[pinId];
    setLikedPinIds((prev) => ({ ...prev, [pinId]: !isLiked }));
    setPins((prev) =>
      prev.map((p) =>
        p.id === pinId ? { ...p, upvotes: isLiked ? p.upvotes - 1 : p.upvotes + 1 } : p
      )
    );
  };

  const showToast = (toastData: Omit<InAppNotification, 'id'>) => {
    const newToast: InAppNotification = {
      ...toastData,
      id: String(Date.now()),
    };
    setToast(newToast);
  };

  const dismissToast = () => {
    setToast(null);
  };

  const upgradeToPremium = () => {
    setProfile((prev) => ({
      ...prev,
      isPremium: true,
    }));
    // Grant bonus super like immediately upon getting Premium
    setSuperLikesCount((prev) => prev + 1);
    showToast({
      type: 'premium',
      title: 'Premium Aktif Edildi! 👑',
      message: 'Sınırsız Keşfet filtresi açıldı ve +1 Süper Like hediye edildi!',
    });
  };

  // Dynamic live stats
  const dynamicStats = {
    matchesCount: matches.length,
    superLikesCount: superLikesCount,
    pinsCount: createdPinsCount,
    eventsCount: events.filter((e) => e.members.some((m) => m.id === profile.id)).length,
  };

  const useSuperLike = (): boolean => {
    if (superLikesCount <= 0) return false;
    setSuperLikesCount((prev) => Math.max(0, prev - 1));
    return true;
  };

  const buySuperLikes = (count: number) => {
    setSuperLikesCount((prev) => prev + count);
  };

  const getUserAvatarString = (av: AvatarSource | null = profile.avatar) => {
    if (!av) return '👤';
    if (av.type === 'mascot') return `mascot:${av.key}`;
    if (av.type === 'emoji') return av.emoji;
    return av.uri;
  };

  const updateEventAvatars = (newAvatar: AvatarSource | null) => {
    const avatarStr = getUserAvatarString(newAvatar);
    setEvents((prev) =>
      prev.map((ev) => ({
        ...ev,
        members: ev.members.map((m) =>
          m.id === profile.id ? { ...m, avatar: avatarStr } : m
        ),
      }))
    );
  };

  const incrementPinCount = () => {
    setCreatedPinsCount((prev) => prev + 1);
  };

  const addMatch = (newMatch: MatchChat) => {
    setMatches((prev) => {
      // If a match with this ID already exists, assign a unique timestamp ID so it is always added
      const uniqueId = prev.some((m) => m.id === newMatch.id)
        ? Date.now() + Math.floor(Math.random() * 1000)
        : newMatch.id;
      return [{ ...newMatch, id: uniqueId }, ...prev];
    });
  };

  const savedSessionRef = useRef<{
    profile: UserProfile;
    matches: MatchChat[];
    createdPinsCount: number;
    superLikesCount: number;
    events: ActivityEvent[];
    pins: MapPin[];
    likedPinIds: Record<number, boolean>;
  }>({
    profile: INITIAL_USER_PROFILE,
    matches: INITIAL_MATCHES,
    createdPinsCount: 5,
    superLikesCount: 2,
    events: INITIAL_EVENTS,
    pins: INITIAL_PINS,
    likedPinIds: {},
  });

  const logout = () => {
    // Save current active user session before wiping
    savedSessionRef.current = {
      profile,
      matches,
      createdPinsCount,
      superLikesCount,
      events,
      pins,
      likedPinIds,
    };

    setIsLoggedIn(false);
    setProfile(GUEST_PROFILE);
    setMatches([]);
    setCreatedPinsCount(0);
    setSuperLikesCount(0);
    setPins(INITIAL_PINS);
    setLikedPinIds({});
    setEvents((prev) =>
      prev.map((e) => ({
        ...e,
        members: e.members.filter((m) => m.id !== profile.id && m.id !== 9999),
      }))
    );
  };

  const login = (method: 'apple' | 'google' = 'apple') => {
    setIsLoggedIn(true);
    // Restore accumulated stats, matches, pins, super likes, and profile!
    setProfile(savedSessionRef.current.profile);
    setMatches(savedSessionRef.current.matches);
    setCreatedPinsCount(savedSessionRef.current.createdPinsCount);
    setSuperLikesCount(savedSessionRef.current.superLikesCount);
    setEvents(savedSessionRef.current.events);
    setPins(savedSessionRef.current.pins);
    setLikedPinIds(savedSessionRef.current.likedPinIds);
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const addPhoto = (photo: AvatarSource): boolean => {
    if (profile.avatars.length >= 3) return false;
    const nextAvatars = [...profile.avatars, photo];
    const newAvatar = nextAvatars[0];
    setProfile((prev) => ({
      ...prev,
      avatars: nextAvatars,
      avatar: newAvatar,
    }));
    updateEventAvatars(newAvatar);
    return true;
  };

  const removePhoto = (index: number) => {
    const nextAvatars = profile.avatars.filter((_, i) => i !== index);
    const newAvatar = nextAvatars.length > 0 ? nextAvatars[0] : null;
    setProfile((prev) => ({
      ...prev,
      avatars: nextAvatars,
      avatar: newAvatar,
    }));
    updateEventAvatars(newAvatar);
  };

  const setAvatar = (avatar: AvatarSource) => {
    const nextAvatars =
      profile.avatars.length === 0 ? [avatar] : [avatar, ...profile.avatars.slice(1)];
    setProfile((prev) => ({
      ...prev,
      avatar,
      avatars: nextAvatars,
    }));
    updateEventAvatars(avatar);
  };

  const clearAvatar = () => {
    setProfile((prev) => ({ ...prev, avatar: null, avatars: [] }));
    updateEventAvatars(null);
  };

  const joinEvent = (event: ActivityEvent) => {
    if (event.members.some((m) => m.id === profile.id)) return;
    if (event.members.length >= event.maxMembers) return;

    const avatarStr = getUserAvatarString();

    const updatedEvent: ActivityEvent = {
      ...event,
      members: [
        ...event.members,
        { id: profile.id, name: profile.name, avatar: avatarStr, role: 'member' },
      ],
    };

    setEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)));

    // Ensure initial event chat exists with welcome message
    setEventChats((prev) => {
      const existing = prev[event.id] || [];
      return {
        ...prev,
        [event.id]: [
          ...existing,
          {
            id: Date.now(),
            senderId: profile.id,
            senderName: profile.name,
            text: 'Gruba katıldım! Selam herkese 👋',
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
    });
  };

  const leaveEvent = (eventId: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, members: e.members.filter((m) => m.id !== profile.id) }
          : e
      )
    );
  };

  const createEvent = (
    title: string,
    desc: string,
    location: string,
    category: CategoryId,
    quota: number
  ) => {
    const newId = Date.now();
    const avatarStr = getUserAvatarString();
    const createdEvent: ActivityEvent = {
      id: newId,
      title: title.trim(),
      description: desc.trim() || 'Katılmak isteyen herkesi bekliyoruz!',
      location: location.trim(),
      category,
      maxMembers: quota,
      members: [
        { id: profile.id, name: profile.name, avatar: avatarStr, role: 'admin' },
      ],
      createdAt: Date.now(),
      expiresAt: Date.now() + 72 * 60 * 60 * 1000,
      status: 'active',
    };

    setEvents((prev) => [createdEvent, ...prev]);
    setEventChats((prev) => ({
      ...prev,
      [newId]: [
        {
          id: Date.now(),
          senderId: profile.id,
          senderName: profile.name,
          text: 'Etkinlik oluşturuldu! Katılanları bekliyorum 🚀',
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
  };

  const generateMatchReply = (name: string, text: string): string => {
    const lower = text.toLowerCase();
    if (
      lower.includes('kahve') ||
      lower.includes('çay') ||
      lower.includes('mekan') ||
      lower.includes('buluş') ||
      lower.includes('☕')
    ) {
      const cafeReplies = [
        `Harika fikir! Kadıköy'de çok tatlı bir kahveci biliyorum, yarın öğleden sonra uyar mı? ☕✨`,
        `Çok iyi olur! Ben de tam bir kahve molası vermek istiyordum. Ne zaman buluşalım? 😊`,
        `Süper teklif! Moda sahiline yakın bir yere geçebiliriz, hava da çok güzel görünüyor ☀️`,
        `Kesinlikle! Kahve benden, tatlılar senden olsun o zaman, anlaştık mı? 😋🍰`,
      ];
      return cafeReplies[Math.floor(Math.random() * cafeReplies.length)];
    }
    if (
      lower.includes('selam') ||
      lower.includes('merhaba') ||
      lower.includes('naber') ||
      lower.includes('nasılsın') ||
      lower.includes('hey')
    ) {
      const greetingReplies = [
        `Selammm! İyiyim çok şükür, sen nasılsın? Günün nasıl geçiyor? 😊`,
        `Merhabalar! Bildirimini görünce çok sevindim, nasılsın bakalım? ✨`,
        `Selam! Yoğun bir gündü ama şimdi rahatladım, sen neler yapıyorsun? 💫`,
      ];
      return greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
    }
    if (
      lower.includes('etkinlik') ||
      lower.includes('konser') ||
      lower.includes('sinema') ||
      lower.includes('parti') ||
      lower.includes('müzik')
    ) {
      const eventReplies = [
        `Bence kesinlikle gidelim! Ben de uzun zamandır güzel bir etkinlik arıyordum 🎶`,
        `Aynen öyle! Biletler tükenmeden bakalım, beraber gideriz çok eğlenceli olur 🎟️🔥`,
      ];
      return eventReplies[Math.floor(Math.random() * eventReplies.length)];
    }
    if (
      lower.includes('neredesin') ||
      lower.includes('nerede') ||
      lower.includes('konum') ||
      lower.includes('semt')
    ) {
      return `Şu an Kadıköy taraflarındayım, sen neredesin? Yakınsak hemen organize olabiliriz 📍`;
    }
    if (lower.includes('yaş') || lower.includes('kaç yaş')) {
      return `23 yaşındayım! Sen kaç yaşındaydın bu arada? 😄`;
    }
    const genericReplies = [
      `Haha kesinlikle katılıyorum! 😄 Sen neler yapıyorsun bu aralar?`,
      `Aynen öyle valla! Bu arada profiline baktım da ortak zevklerimiz çok fazla ✨`,
      `Çok tatlısın, bence de kesinlikle öyle yapmalıyız! Ne zaman müsaitsin? 🥰`,
      `Süper söyledin! Bu haftasonu bir şeyler yapalım o zaman kesinlikle 🚀`,
      `Ben de tam olarak bunu düşünüyordum! Kafalarımız çok uyuştu sanki 🍀`,
    ];
    return genericReplies[Math.floor(Math.random() * genericReplies.length)];
  };

  const generateEventReply = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('nerede') || lower.includes('saat') || lower.includes('zaman')) {
      return 'Detaylar açıklamadaki gibi, tam saatinde buluşma noktasındayız! 📍';
    }
    if (lower.includes('kahve') || lower.includes('yemek') || lower.includes('içecek')) {
      return 'Etkinlik öncesi bir şeyler içeriz kesinlikle, çok iyi olur! ☕';
    }
    const replies = [
      'Harika haber, ben de geliyorum! 🚀',
      'Süper! Orada görüşmek üzere arkadaşlar 🙌',
      'Ben de oradayım, harika bir grup olduk ✨',
      'Sabırsızlıkla bekliyorum, görüşürüz! 🔥',
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const sendEventMessage = (eventId: number, text: string) => {
    if (!text.trim()) return;
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: Date.now(),
      senderId: profile.id,
      senderName: profile.name,
      text: text.trim(),
      time: nowTime,
    };

    setEventChats((prev) => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), newMsg],
    }));

    // Realistic group auto-reply simulation after 2.4s
    setTimeout(() => {
      const currentEvent = eventsRef.current.find((e) => e.id === eventId);
      if (!currentEvent) return;

      const otherMembers = currentEvent.members.filter((m) => m.id !== profile.id);
      const respondent = otherMembers.length > 0 ? otherMembers[Math.floor(Math.random() * otherMembers.length)] : { id: 999, name: 'Ece', avatar: '👩' };
      const replyTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const replyText = generateEventReply(text);

      const groupReplyMsg: ChatMessage = {
        id: Date.now(),
        senderId: typeof respondent.id === 'number' ? respondent.id : 999,
        senderName: respondent.name,
        text: replyText,
        time: replyTime,
      };

      setEventChats((prev) => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), groupReplyMsg],
      }));

      // If user is NOT currently inside this event chat modal, fire in-app toast banner
      const isChatOpen =
        activeChatModalRef.current?.type === 'event' &&
        activeChatModalRef.current.event.id === eventId;

      if (!isChatOpen) {
        showToast({
          type: 'message',
          title: `${currentEvent.title} 💬`,
          message: `${respondent.name}: ${replyText}`,
          onPress: () => {
            const latest = eventsRef.current.find((e) => e.id === eventId) || currentEvent;
            openEventChat(latest);
          },
        });
      }
    }, 2400);
  };

  const sendMatchMessage = (matchId: number, text: string) => {
    if (!text.trim()) return;
    const messageId = Date.now();
    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: MatchMessage = {
      id: messageId,
      sender: 'me',
      text: text.trim(),
      time: nowTime,
      status: 'sent',
    };

    // 1. Initial State: Appended with status 'sent'
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          lastMsg: text.trim(),
          time: nowTime,
          messages: [...m.messages, userMsg],
        };
      })
    );

    setActiveChatModal((prevModal) => {
      if (prevModal && prevModal.type === 'match' && prevModal.match.id === matchId) {
        return {
          ...prevModal,
          match: {
            ...prevModal.match,
            lastMsg: text.trim(),
            time: nowTime,
            messages: [...prevModal.match.messages, userMsg],
          },
        };
      }
      return prevModal;
    });

    // 2. Progression: 'delivered' after 650ms
    setTimeout(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          return {
            ...m,
            messages: m.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status: 'delivered' } : msg
            ),
          };
        })
      );
      setActiveChatModal((prevModal) => {
        if (prevModal && prevModal.type === 'match' && prevModal.match.id === matchId) {
          return {
            ...prevModal,
            match: {
              ...prevModal.match,
              messages: prevModal.match.messages.map((msg) =>
                msg.id === messageId ? { ...msg, status: 'delivered' } : msg
              ),
            },
          };
        }
        return prevModal;
      });
    }, 650);

    // 3. Progression: "Görüldü" ('read' - double blue checkmark) after 1300ms
    setTimeout(() => {
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          return {
            ...m,
            messages: m.messages.map((msg) =>
              msg.id === messageId ? { ...msg, status: 'read' } : msg
            ),
          };
        })
      );
      setActiveChatModal((prevModal) => {
        if (prevModal && prevModal.type === 'match' && prevModal.match.id === matchId) {
          return {
            ...prevModal,
            match: {
              ...prevModal.match,
              messages: prevModal.match.messages.map((msg) =>
                msg.id === messageId ? { ...msg, status: 'read' } : msg
              ),
            },
          };
        }
        return prevModal;
      });
    }, 1300);

    // 4. Progression: "Yazıyor..." (isTyping = true) after 1900ms
    setTimeout(() => {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, isTyping: true } : m))
      );
      setActiveChatModal((prevModal) => {
        if (prevModal && prevModal.type === 'match' && prevModal.match.id === matchId) {
          return {
            ...prevModal,
            match: { ...prevModal.match, isTyping: true },
          };
        }
        return prevModal;
      });
    }, 1900);

    // 5. Progression: Incoming Reply appended & typing dismissed after 3800ms
    setTimeout(() => {
      const targetMatch = matchesRef.current.find((m) => m.id === matchId);
      const targetName = targetMatch ? targetMatch.name : 'Eşleşmen';
      const replyText = generateMatchReply(targetName, text);
      const replyTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      const replyMsg: MatchMessage = {
        id: Date.now(),
        sender: 'them',
        text: replyText,
        time: replyTime,
      };

      const isChatOpen =
        activeChatModalRef.current?.type === 'match' &&
        activeChatModalRef.current.match.id === matchId;

      setMatches((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          return {
            ...m,
            isTyping: false,
            lastMsg: replyText,
            time: replyTime,
            unread: isChatOpen ? 0 : (m.unread || 0) + 1,
            messages: [...m.messages, replyMsg],
          };
        })
      );

      setActiveChatModal((prevModal) => {
        if (prevModal && prevModal.type === 'match' && prevModal.match.id === matchId) {
          return {
            ...prevModal,
            match: {
              ...prevModal.match,
              isTyping: false,
              lastMsg: replyText,
              time: replyTime,
              messages: [...prevModal.match.messages, replyMsg],
            },
          };
        }
        return prevModal;
      });

      // If user closed the chat or is browsing elsewhere, trigger in-app toast notification
      if (!isChatOpen) {
        showToast({
          type: 'message',
          title: `${targetName} mesaj attı 💬`,
          message: replyText,
          avatar: targetMatch?.avatar,
          onPress: () => {
            const latestMatch = matchesRef.current.find((m) => m.id === matchId) || targetMatch;
            if (latestMatch) openMatchChat(latestMatch);
          },
        });
      }
    }, 3800);
  };

  const setDiscoverEnabled = (enabled: boolean) => {
    setProfile((prev) => ({
      ...prev,
      isDiscoverEnabled: enabled,
      isInvisibleMode: !enabled,
    }));
  };

  const setIsInvisibleMode = (val: boolean) => {
    setProfile((prev) => ({
      ...prev,
      isInvisibleMode: val,
      isDiscoverEnabled: !val,
    }));
  };

  const openEventChat = (event: ActivityEvent) => {
    setActiveChatModal({ type: 'event', event });
  };

  const openMatchChat = (match: MatchChat) => {
    setActiveChatModal({ type: 'match', match });
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? { ...m, unread: 0 } : m))
    );
  };

  const closeChatModal = () => {
    setActiveChatModal(null);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        stats: dynamicStats,
        isLoggedIn,
        setIsLoggedIn,
        logout,
        login,
        incrementPinCount,
        pins,
        addPin,
        toggleLikePin,
        likedPinIds,
        addMatch,
        useSuperLike,
        buySuperLikes,
        updateProfile,
        upgradeToPremium,
        setAvatar,
        addPhoto,
        removePhoto,
        clearAvatar,
        setDiscoverEnabled,
        setIsInvisibleMode,
        events,
        eventChats,
        matches,
        joinEvent,
        leaveEvent,
        createEvent,
        sendEventMessage,
        sendMatchMessage,
        activeChatModal,
        openEventChat,
        openMatchChat,
        closeChatModal,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
