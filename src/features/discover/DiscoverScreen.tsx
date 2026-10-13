import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Image,
  Pressable,
  Modal,
  Easing,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { SWIPE_USERS, SwipeUser, ICEBREAKER_QUESTIONS } from '../../data/mockData';
import { DiscoveryFilters } from '../../types/data';
import { useApp, MatchChat } from '../../context/AppContext';
import { AvatarPickerModal } from '../../components/AvatarPickerModal';
import { UserAvatar } from '../../components/UserAvatar';
import { SlideToUnlock } from '../../components/SlideToUnlock';
import { SwipeableBottomSheet } from '../../components/SwipeableBottomSheet';
import { triggerHaptic } from '../../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 110;

const CANDIDATE_TEMPLATES: Omit<SwipeUser, 'id'>[] = [
  {
    name: 'Selin',
    age: 23,
    image: SWIPE_USERS[0]?.image,
    bio: 'Fotoğraf ve kahve aşığı 📸 Hafta sonları Balat ve Moda turları yapıyorum.',
    location: 'Moda',
    interests: ['Fotoğraf', 'Kahve', 'Sanat'],
    distance: '0.9 km',
  },
  {
    name: 'Berk',
    age: 26,
    image: SWIPE_USERS[3]?.image,
    bio: 'Padel veya tenis oynayacak birini arıyorum 🎾 Akşamları koşu da olur.',
    location: 'Beşiktaş',
    interests: ['Tenis', 'Koşu', 'Fitness'],
    distance: '1.4 km',
  },
  {
    name: 'Melis',
    age: 24,
    image: SWIPE_USERS[1]?.image,
    bio: 'Kutu oyunları, vintage plaklar ve jazz geceleri 🎷🎲',
    location: 'Cihangir',
    interests: ['Müzik', 'Plak', 'Kutu Oyunu'],
    distance: '2.0 km',
  },
  {
    name: 'Kerem',
    age: 25,
    image: SWIPE_USERS[2]?.image,
    bio: 'Yazılımcıyım, kafe kafe gezip çalışmayı seviyorum ☕💻',
    location: 'Kadıköy',
    interests: ['Teknoloji', 'Kafe', 'Startup'],
    distance: '0.6 km',
  },
  {
    name: 'Deniz',
    age: 22,
    image: SWIPE_USERS[4]?.image,
    bio: 'Kamp, doğa yürüyüşü ve akustik konserler 🎸🏕️',
    location: 'Nişantaşı',
    interests: ['Kamp', 'Gitar', 'Seyahat'],
    distance: '2.5 km',
  },
  {
    name: 'Ece',
    age: 24,
    image: SWIPE_USERS[0]?.image,
    bio: 'Seramik atölyelerine gitmeyi ve sergi gezmeyi çok seviyorum 🏺🎨',
    location: 'Karaköy',
    interests: ['Sanat', 'Seramik', 'Kahve'],
    distance: '1.8 km',
  },
  {
    name: 'Kaan',
    age: 27,
    image: SWIPE_USERS[3]?.image,
    bio: 'Bisiklet turları ve rooftop partileri 🚲✨',
    location: 'Bebek',
    interests: ['Bisiklet', 'Parti', 'Müzik'],
    distance: '3.1 km',
  },
];

let nextGeneratedCardId = 1000;
const generateMoreCards = (count: number = 6): SwipeUser[] => {
  return Array.from({ length: count }).map((_, i) => {
    const template = CANDIDATE_TEMPLATES[(nextGeneratedCardId + i) % CANDIDATE_TEMPLATES.length];
    nextGeneratedCardId += 1;
    return {
      ...template,
      id: nextGeneratedCardId,
      distance: `${(0.4 + Math.random() * 3.2).toFixed(1)} km`,
    };
  });
};

export const DiscoverScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    openMatchChat,
    profile,
    stats,
    setAvatar,
    clearAvatar,
    addMatch,
    isLoggedIn,
    login,
    setDiscoverEnabled,
    useSuperLike,
    buySuperLikes,
    upgradeToPremium,
    showToast,
  } = useApp();
  const [users, setUsers] = useState<SwipeUser[]>(SWIPE_USERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchedUser, setMatchedUser] = useState<SwipeUser | null>(null);
  const [detailUser, setDetailUser] = useState<SwipeUser | null>(null);
  const swipeHistoryRef = useRef<{ user: SwipeUser; index: number; direction: 'right' | 'left' | 'up' }[]>([]);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isSuperLikeShopOpen, setIsSuperLikeShopOpen] = useState(false);

  // Discovery Filter State (Premium only)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPremiumPaywallOpen, setIsPremiumPaywallOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilters>({
    maxDistanceKm: 10,
    minAge: 18,
    maxAge: 35,
    commonInterestsOnly: false,
  });

  // Icebreaker Wheel State & Animation
  const [wheelWinner, setWheelWinner] = useState<'me' | 'them' | null>(null);
  const [wheelQuestion, setWheelQuestion] = useState<string>('');
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const wheelSpinAnim = useRef(new Animated.Value(0)).current;

  // Swipe animation values & animation guard
  const position = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);
  const latestMatchRef = useRef<MatchChat | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  // Lock Screen Animations (Snake Rotating Ring & Pulsing Lock)
  const snakeSpinAnim = useRef(new Animated.Value(0)).current;
  const pulseLockAnim = useRef(new Animated.Value(1)).current;

  // Lock conditions:
  // 1. Not logged in
  // 2. No avatar uploaded
  // 3. User voluntarily turned Keşfet OFF / Invisible Mode ON
  const isDiscoverDisabled = profile.isInvisibleMode === true || profile.isDiscoverEnabled === false;
  const isLocked = !isLoggedIn || !profile.avatar || isDiscoverDisabled;

  useEffect(() => {
    if (!isLocked) return;

    snakeSpinAnim.setValue(0);
    const snakeLoop = Animated.loop(
      Animated.timing(snakeSpinAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    snakeLoop.start();

    pulseLockAnim.setValue(1);
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseLockAnim, {
          toValue: 1.1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseLockAnim, {
          toValue: 1.0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      snakeLoop.stop();
      pulseLoop.stop();
    };
  }, [isLocked]);

  const snakeRotation = snakeSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Rotation based on horizontal drag distance
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  // Stamp opacities
  const likeOpacity = position.x.interpolate({
    inputRange: [15, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const superOpacity = position.y.interpolate({
    inputRange: [-SCREEN_HEIGHT / 4, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const currentIndexRef = useRef(currentIndex);
  const usersRef = useRef(users);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4;
      },
      onPanResponderGrant: () => {
        pressStartTimeRef.current = Date.now();
        position.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        const curIdx = currentIndexRef.current;
        const currentCandidate = usersRef.current[curIdx];
        const isTap =
          Math.abs(gesture.dx) < 10 &&
          Math.abs(gesture.dy) < 10 &&
          Date.now() - pressStartTimeRef.current < 350;

        // If user tapped directly on the photo/card, open full profile detail sheet!
        if (isTap && currentCandidate) {
          resetPosition();
          triggerHaptic.light();
          setDetailUser(currentCandidate);
          return;
        }

        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right', currentCandidate);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left', currentCandidate);
        } else if (gesture.dy < -SWIPE_THRESHOLD) {
          forceSwipe('up', currentCandidate);
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  const handleRequireSuperLike = (): boolean => {
    const success = useSuperLike();
    if (!success) {
      resetPosition();
      Alert.alert(
        'Süper Like Bitti! ⭐',
        'Hiç süper like hakkın kalmadı. Profilinden veya hemen buradan yeni süper like satın alabilirsin!',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Satın Al ⭐',
            onPress: () => setIsSuperLikeShopOpen(true),
          },
        ]
      );
      return false;
    }
    return true;
  };

  const handleRewind = () => {
    triggerHaptic.medium();
    if (swipeHistoryRef.current.length === 0) {
      showToast({
        type: 'info',
        title: 'Geri Alınacak Profil Yok ⏪',
        message: 'Henüz kaydırdığın bir profil bulunmuyor.',
      });
      return;
    }

    if (!profile.isPremium) {
      triggerHaptic.warning();
      Alert.alert(
        'Geri Al Özelliği 👑',
        'Yanlışlıkla sola kaydırdığın profilleri geri almak Napalım Premium ayrıcalığıdır! Hemen Premium\'a geçerek sınırsız geri al.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Premium Aç 👑', onPress: () => setIsPremiumPaywallOpen(true) },
        ]
      );
      return;
    }

    const lastAction = swipeHistoryRef.current.pop();
    if (!lastAction) return;

    const prevIdx = Math.max(0, currentIndexRef.current - 1);
    currentIndexRef.current = prevIdx;
    setCurrentIndex(prevIdx);

    // Spring card back from left
    position.setValue({ x: -SCREEN_WIDTH * 0.9, y: 0 });
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 7,
      tension: 50,
      useNativeDriver: false,
    }).start();

    triggerHaptic.success();
    showToast({
      type: 'info',
      title: 'Profil Geri Alındı ⏪',
      message: `${lastAction.user.name} kartına geri döndün!`,
    });
  };

  const forceSwipe = (direction: 'right' | 'left' | 'up', userToSwipe?: SwipeUser) => {
    // If direction is 'up' (Super Like), verify quota
    if (direction === 'up') {
      if (!handleRequireSuperLike()) {
        return;
      }
      triggerHaptic.heavy();
    } else if (direction === 'right') {
      triggerHaptic.medium();
    } else {
      triggerHaptic.light();
    }

    // If currently animating another card, finish it immediately and proceed without dropping the action
    if (isAnimating.current) {
      position.stopAnimation();
      position.setValue({ x: 0, y: 0 });
      isAnimating.current = false;
    }
    isAnimating.current = true;

    // Immediately resolve the target user from argument or fresh usersRef
    const curIdx = currentIndexRef.current;
    const targetUser = userToSwipe || usersRef.current[curIdx];

    const x =
      direction === 'right'
        ? SCREEN_WIDTH + 140
        : direction === 'left'
        ? -SCREEN_WIDTH - 140
        : 0;
    const y = direction === 'up' ? -SCREEN_HEIGHT - 100 : 0;

    Animated.timing(position, {
      toValue: { x, y },
      duration: 160,
      useNativeDriver: false,
    }).start(() => {
      onSwipeComplete(direction, targetUser);
    });
  };

  const onSwipeComplete = (direction: 'right' | 'left' | 'up', targetUser?: SwipeUser) => {
    position.setValue({ x: 0, y: 0 });
    isAnimating.current = false;

    const currentIdx = currentIndexRef.current;
    const allUsers = usersRef.current;
    const swipedUser = targetUser || allUsers[currentIdx];

    if (swipedUser) {
      swipeHistoryRef.current.push({
        user: swipedUser,
        index: currentIdx,
        direction,
      });
      if (swipeHistoryRef.current.length > 20) {
        swipeHistoryRef.current.shift();
      }
    }

    if ((direction === 'right' || direction === 'up') && swipedUser) {
      triggerHaptic.success();
      const uniqueMatchId = Date.now() + Math.floor(Math.random() * 10000);
      const chosenQuestion =
        ICEBREAKER_QUESTIONS[Math.floor(Math.random() * ICEBREAKER_QUESTIONS.length)];
      // Randomly choose who wins the spin: 50% me, 50% them
      const isWinnerMe = Math.random() < 0.5;
      const winner: 'me' | 'them' = isWinnerMe ? 'me' : 'them';

      const initialMessage = {
        id: Date.now(),
        sender: winner,
        text: `🎯 Çark Çevrildi! İlk mesaj ${isWinnerMe ? 'benden' : swipedUser.name + ' tarafından'} geldi:\n\n"${chosenQuestion}"`,
        time: 'Şimdi',
      };

      const newMatchItem: MatchChat = {
        id: uniqueMatchId,
        name: swipedUser.name,
        avatar: '💜',
        location: swipedUser.location,
        lastMsg: chosenQuestion,
        time: 'Şimdi',
        unread: isWinnerMe ? 0 : 1,
        messages: [initialMessage],
      };
      latestMatchRef.current = newMatchItem;
      addMatch(newMatchItem);
      setMatchedUser(swipedUser);

      // Trigger Icebreaker Wheel Automatic Spin Animation!
      setWheelWinner(null);
      setWheelQuestion(chosenQuestion);
      setIsWheelSpinning(true);
      wheelSpinAnim.setValue(0);

      // Spin rotation targets:
      // Even rotations end on 'me', odd/half rotations end on 'them'
      // 5 full rotations (1800 deg) + offset
      const targetSpins = isWinnerMe ? 6 : 6.5; // 6 * 360 = 2160 (me), 6.5 * 360 = 2340 (them)
      Animated.timing(wheelSpinAnim, {
        toValue: targetSpins,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsWheelSpinning(false);
        setWheelWinner(winner);
        triggerHaptic.medium();
      });
    }

    const nextIdx = currentIdx + 1;
    currentIndexRef.current = nextIdx;
    setCurrentIndex(nextIdx);

    // Keep generating new people continuously so user NEVER runs out of profiles
    if (allUsers.length - nextIdx < 4) {
      const newCandidates = generateMoreCards(6);
      usersRef.current = [...allUsers, ...newCandidates];
      setUsers((prev) => [...prev, ...newCandidates]);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  // Filter active cards based on filters (if user applied them)
  const filteredUsers = users.filter((u) => {
    // If not premium, all cards show without restriction
    if (!profile.isPremium) return true;

    // Filter by Age
    if (u.age < filters.minAge || u.age > filters.maxAge) return false;

    // Filter by Distance
    const distNum = parseFloat(u.distance.replace(' km', '')) || 0;
    if (distNum > filters.maxDistanceKm) return false;

    // Filter by Common Interests
    if (filters.commonInterestsOnly) {
      const hasCommon = u.interests.some((tag) =>
        profile.tags.some((pt) => {
          const cleanPt = pt.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
          const cleanTag = tag.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
          return cleanPt.includes(cleanTag) || cleanTag.includes(cleanPt);
        })
      );
      if (!hasCommon) return false;
    }
    return true;
  });

  const topCard = currentIndex < filteredUsers.length ? filteredUsers[currentIndex] : null;
  const nextCard = currentIndex + 1 < filteredUsers.length ? filteredUsers[currentIndex + 1] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.brandTitle}>🔥 KEŞFET</Text>
          <Text style={styles.brandSubtitle}>Çevrendeki insanlarla eşleş</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Keşfet Filtre Butonu (Premium Only) */}
          <Pressable
            onPress={() => {
              if (profile.isPremium) {
                setIsFilterModalOpen(true);
              } else {
                setIsPremiumPaywallOpen(true);
              }
            }}
            style={({ pressed }) => [
              styles.filterToggleBtn,
              profile.isPremium && styles.filterToggleBtnActive,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            <Ionicons
              name="options"
              size={17}
              color={profile.isPremium ? '#fbbf24' : Colors.textSecondary}
            />
            {!profile.isPremium && (
              <View style={styles.filterLockBadge}>
                <Ionicons name="lock-closed" size={9} color="#ffffff" />
              </View>
            )}
          </Pressable>

          {profile.avatar && (
            <Pressable onPress={() => setIsAvatarPickerOpen(true)}>
              <UserAvatar avatar={profile.avatar} size={36} borderGlow />
            </Pressable>
          )}
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>
              {isLocked ? 'KAPALI 🔒' : 'Keşfet Canlı 🟢'}
            </Text>
          </View>
        </View>
      </View>

      {/* Lock Screen Gate if User has no avatar OR has turned Keşfet OFF */}
      {isLocked ? (
        <View style={styles.lockedContainer}>
          {/* Rotating Neon Purple Snake Ring & Pulsing Lock Icon */}
          <View style={styles.lockRingWrapper}>
            {/* Outer soft ambient purple glow */}
            <View style={styles.lockAmbientGlow} />

            {/* Rotating Snake Ring */}
            <Animated.View
              style={[
                styles.snakeRing,
                {
                  transform: [{ rotate: snakeRotation }],
                },
              ]}
            >
              {/* Glowing snake head dot */}
              <View style={styles.snakeHeadDot} />
            </Animated.View>

            {/* Central Pulsing Lock or Ghost Icon */}
            <Animated.View
              style={[
                styles.centralLockCircle,
                {
                  transform: [{ scale: pulseLockAnim }],
                },
              ]}
            >
              {isDiscoverDisabled ? (
                <Text style={{ fontSize: 46 }}>👻</Text>
              ) : (
                <Ionicons name="lock-closed" size={44} color="#c084fc" />
              )}
            </Animated.View>
          </View>

          {/* Titles & Creative Punchline */}
          <Text style={styles.lockedTitle}>
            {!isLoggedIn
              ? 'Keşfete Girmek İçin Giriş Yap! 🔐'
              : isDiscoverDisabled
              ? 'Hayalet Modundasın! 👻'
              : 'Keşfete Girmek İçin Görünür Ol!'}
          </Text>
          <Text style={styles.lockedQuote}>
            {isDiscoverDisabled
              ? '"Şu an keşfette görünmezsin! 🕶️ Kimse seni göremiyor ve kimseyle eşleşemiyorsun."'
              : '"Gizemli takılmak havalı ama kimse hayaletlerle eşleşmek istemez! 👻"'}
          </Text>
          <Text style={styles.lockedDesc}>
            {!isLoggedIn
              ? 'Çevrendeki insanları keşfetmek ve seni de keşfetmelerini sağlamak için lütfen önce hesabına giriş yap.'
              : isDiscoverDisabled
              ? 'Görünmez moddan çıkarak profilini anında görünür yapabilir ve çevrendeki insanları keşfetmeye devam edebilirsin.'
              : 'Çevrendeki insanları keşfetmek ve seni de keşfetmelerini sağlamak için önce bir profil fotoğrafı yükle veya 3D maskotlarımızdan birini seç.'}
          </Text>

          {/* If user is in Invisible Mode: Show 1-Click "Görünmez Moddan Çık ⚡" button */}
          {isDiscoverDisabled && isLoggedIn && profile.avatar ? (
            <View style={{ marginTop: 24, width: '100%', alignItems: 'center' }}>
              <Pressable
                onPress={() => {
                  setDiscoverEnabled(true);
                }}
                style={({ pressed }) => [
                  styles.exitGhostBtn,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Ionicons name="flash" size={20} color="#ffffff" />
                <Text style={styles.exitGhostBtnText}>Görünmez Moddan Çık ⚡</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Quick Choice Badges */}
              <View style={styles.featuresRow}>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>📸 Kendi Portren</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>🚀 3D AI Maskotlar</Text>
                </View>
                <View style={styles.featurePill}>
                  <Text style={styles.featurePillText}>🦊 Karakter Emojisi</Text>
                </View>
              </View>

              {/* Action Button: Opens Avatar Picker or Prompts Login */}
              <Pressable
                onPress={() => {
                  if (!isLoggedIn) {
                    Alert.alert(
                      'Giriş Yapmalısın 🔒',
                      'Keşfeti kullanabilmek ve insanlarla eşleşebilmek için lütfen önce giriş yap.',
                      [
                        { text: 'Vazgeç', style: 'cancel' },
                        { text: 'Giriş Yap 🎉', onPress: () => login('apple') },
                      ]
                    );
                    return;
                  }
                  setIsAvatarPickerOpen(true);
                }}
                style={({ pressed }) => [
                  styles.unlockActionBtn,
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}
              >
                <Ionicons
                  name={!isLoggedIn ? 'log-in-outline' : 'sparkles'}
                  size={18}
                  color="#ffffff"
                />
                <Text style={styles.unlockActionBtnText}>
                  {!isLoggedIn ? 'Giriş Yap 🔐' : 'Profilini Parlat ⚡'}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
        /* Unlocked: Tinder Swipe Card Deck */
        <>
          <View style={styles.deckArea}>
            {!topCard ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconBadge}>
                    <Ionicons name="radio-outline" size={38} color={Colors.accentPurple} />
                  </View>
                  <Text style={styles.emptyTitle}>Yeni Profiller Keşfediliyor... 🛰️</Text>
                  <Text style={styles.emptyDesc}>
                    Çevrendeki aktif kullanıcılar taranıyor. Yeni kişiler sürekli keşfetine düşüyor!
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Background Card (Sitting behind, rendered first in JSX) */}
                {nextCard && (
                  <View
                    key={`bg-card-${nextCard.id}`}
                    style={[
                      styles.card,
                      {
                        transform: [{ scale: 0.95 }, { translateY: 14 }],
                        opacity: 0.88,
                      },
                    ]}
                  >
                    <Image
                      key={`bg-img-${nextCard.id}`}
                      source={nextCard.image}
                      style={styles.cardImage}
                      fadeDuration={0}
                    />
                    <View style={styles.cardGradientOverlay}>
                      <View style={styles.distanceBadge}>
                        <Text style={styles.distanceText}>📍 {nextCard.distance}</Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.userName}>
                          {nextCard.name}, {nextCard.age}
                        </Text>
                        <Text style={styles.userLocation}>📍 {nextCard.location}</Text>
                        <Text style={styles.userBio}>{nextCard.bio}</Text>
                        <View style={styles.tagsRow}>
                          {nextCard.interests.map((tag, tIdx) => {
                            // Check if this tag matches any of the user's selected profile tags
                            const isCommon = profile.tags.some((pt) => {
                              const cleanPt = pt.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
                              const cleanTag = tag.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
                              return cleanPt.includes(cleanTag) || cleanTag.includes(cleanPt);
                            });

                            return (
                              <View
                                key={tIdx}
                                style={[
                                  styles.interestTag,
                                  isCommon && styles.interestTagCommon,
                                ]}
                              >
                                {isCommon && (
                                  <Ionicons name="sparkles" size={10} color={Colors.accentGreen} style={{ marginRight: 3 }} />
                                )}
                                <Text
                                  style={[
                                    styles.interestTagText,
                                    isCommon && styles.interestTagTextCommon,
                                  ]}
                                >
                                  {tag}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Active Top Card (Rendered LAST so it sits physically on top) */}
                <Animated.View
                  key={`top-card-${topCard.id}`}
                  {...panResponder.panHandlers}
                  style={[
                    styles.card,
                    {
                      zIndex: 10,
                      transform: [
                        { translateX: position.x },
                        { translateY: position.y },
                        { rotate },
                      ],
                    },
                  ]}
                >
                  <Image
                    key={`top-img-${topCard.id}`}
                    source={topCard.image}
                    style={styles.cardImage}
                    fadeDuration={0}
                  />

                  <View style={styles.cardGradientOverlay}>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>📍 {topCard.distance}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.userName}>
                        {topCard.name}, {topCard.age}
                      </Text>
                      <Text style={styles.userLocation}>📍 {topCard.location}</Text>
                      <Text style={styles.userBio} numberOfLines={2}>
                        {topCard.bio}
                      </Text>
                      <View style={styles.tagsRow}>
                        {topCard.interests.map((tag, tIdx) => {
                          const isCommon = profile.tags.some((pt) => {
                            const cleanPt = pt.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
                            const cleanTag = tag.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
                            return cleanPt.includes(cleanTag) || cleanTag.includes(cleanPt);
                          });

                          return (
                            <View
                              key={tIdx}
                              style={[
                                styles.interestTag,
                                isCommon && styles.interestTagCommon,
                              ]}
                            >
                              {isCommon && (
                                <Ionicons name="sparkles" size={10} color={Colors.accentGreen} style={{ marginRight: 3 }} />
                              )}
                              <Text
                                style={[
                                  styles.interestTagText,
                                  isCommon && styles.interestTagTextCommon,
                                ]}
                              >
                                {tag}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  {/* Stamps */}
                  <Animated.View
                    style={[
                      styles.stamp,
                      styles.stampLike,
                      { opacity: likeOpacity },
                    ]}
                  >
                    <Text style={styles.stampLikeText}>BEĞEN ❤️</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.stamp,
                      styles.stampNope,
                      { opacity: nopeOpacity },
                    ]}
                  >
                    <Text style={styles.stampNopeText}>PAS ✕</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.stamp,
                      styles.stampSuper,
                      { opacity: superOpacity },
                    ]}
                  >
                    <Text style={styles.stampSuperText}>SÜPER ⭐</Text>
                  </Animated.View>
                </Animated.View>
              </>
            )}
          </View>

          {/* Action Buttons Below Cards */}
          {topCard && (
            <View style={styles.actionButtonsRow}>
              {/* Rewind (Geri Al) Button */}
              <Pressable
                onPress={handleRewind}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnRewind,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
              >
                <Ionicons name="arrow-undo" size={22} color="#fbbf24" />
              </Pressable>

              {/* Nope Button */}
              <Pressable
                onPress={() => forceSwipe('left', topCard)}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnNope,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
              >
                <Ionicons name="close" size={28} color={Colors.accentRed} />
              </Pressable>

              {/* Super Like Button */}
              <Pressable
                onPress={() => forceSwipe('up', topCard)}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnSuper,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
              >
                <Ionicons name="star" size={22} color={Colors.accentBlue} />
              </Pressable>

              {/* Like Button */}
              <Pressable
                onPress={() => forceSwipe('right', topCard)}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnLike,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}
              >
                <Ionicons name="heart" size={28} color={Colors.accentGreen} />
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Match Celebration & Icebreaker Wheel Modal */}
      {matchedUser && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMatchedUser(null)}
        >
          <View style={styles.matchBackdrop}>
            <TouchableWithoutFeedback onPress={() => setMatchedUser(null)}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
            <View style={styles.matchCard}>
              <Text style={styles.matchTitle}>EŞLEŞME! 🎉</Text>
              <Text style={styles.matchSubtitle}>
                Sen ve {matchedUser.name} birbirinizi beğendiniz!
              </Text>

              {/* Icebreaker Wheel Section */}
              <View style={styles.wheelSection}>
                <View style={styles.wheelBadgePill}>
                  <Text style={styles.wheelBadgeText}>🎯 İLK MESAJI KİM ATACAK?</Text>
                </View>

                {/* Animated Rotating Wheel */}
                <View style={styles.wheelContainer}>
                  {/* Outer glowing ring */}
                  <View style={styles.wheelOuterGlow} />

                  <Animated.View
                    style={[
                      styles.wheelDisc,
                      {
                        transform: [
                          {
                            rotate: wheelSpinAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {/* Top Half: ME */}
                    <View style={[styles.wheelSlice, styles.wheelSliceTop]}>
                      <View style={styles.wheelAvatarWrap}>
                        <UserAvatar avatar={profile.avatar} size={42} />
                      </View>
                      <Text style={styles.wheelSliceText}>SEN</Text>
                    </View>

                    {/* Divider Needle line */}
                    <View style={styles.wheelSliceDivider} />

                    {/* Bottom Half: THEM */}
                    <View style={[styles.wheelSlice, styles.wheelSliceBottom]}>
                      <View style={styles.wheelAvatarWrap}>
                        <Image source={matchedUser.image} style={styles.wheelAvatarImg} />
                      </View>
                      <Text style={styles.wheelSliceText}>{matchedUser.name.toUpperCase()}</Text>
                    </View>
                  </Animated.View>

                  {/* Center Hub Indicator */}
                  <View style={styles.wheelCenterHub}>
                    <Text style={{ fontSize: 18 }}>⚡</Text>
                  </View>

                  {/* Needle Pointer Top */}
                  <View style={styles.wheelPointer}>
                    <Ionicons name="caret-down" size={24} color="#f59e0b" />
                  </View>
                </View>

                {/* Result Card (Appears after spin or spinning status) */}
                <View style={styles.wheelResultCard}>
                  {isWheelSpinning ? (
                    <View style={styles.spinningStatusRow}>
                      <Ionicons name="sync" size={16} color="#c084fc" />
                      <Text style={styles.spinningStatusText}>Çark dönüyor, ilk mesaj belirleniyor...</Text>
                    </View>
                  ) : wheelWinner ? (
                    <View style={styles.wheelWinnerWrap}>
                      <Text style={styles.wheelWinnerTitle}>
                        {wheelWinner === 'me'
                          ? '🎉 Çark Seni Seçti! İlk mesajı sen gönderdin:'
                          : `🎉 Çark ${matchedUser.name}’i Seçti! İlk mesajı o gönderdi:`}
                      </Text>
                      <View style={styles.questionBubble}>
                        <Text style={styles.questionText}>"{wheelQuestion}"</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Action Buttons */}
              <Pressable
                onPress={() => {
                  const targetMatch = latestMatchRef.current || {
                    id: Date.now(),
                    name: matchedUser.name,
                    avatar: '💜',
                    location: matchedUser.location,
                    lastMsg: wheelQuestion,
                    time: 'Şimdi',
                    unread: wheelWinner === 'them' ? 1 : 0,
                    messages: [
                      {
                        id: Date.now(),
                        sender: wheelWinner || 'me',
                        text: `🎯 Çark Çevrildi! İlk mesaj ${
                          wheelWinner === 'me' ? 'benden' : matchedUser.name + ' tarafından'
                        } geldi:\n\n"${wheelQuestion}"`,
                        time: 'Şimdi',
                      },
                    ],
                  };
                  setMatchedUser(null);
                  openMatchChat(targetMatch);
                }}
                style={[
                  styles.matchSendBtn,
                  isWheelSpinning && { opacity: 0.6 },
                ]}
                disabled={isWheelSpinning}
              >
                <Text style={styles.matchSendBtnText}>Sohbete Git 💬</Text>
              </Pressable>

              <Pressable
                onPress={() => setMatchedUser(null)}
                style={styles.matchLaterBtn}
                disabled={isWheelSpinning}
              >
                <Text style={styles.matchLaterBtnText}>Keşfetmeye Devam Et</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Discovery Filters Modal (Premium feature) - Swipe Down to Dismiss */}
      <SwipeableBottomSheet
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.filterHeader}>
          <View style={styles.filterCrownBadge}>
            <Ionicons name="sparkles" size={24} color="#fbbf24" />
          </View>
          <Text style={styles.filterTitle}>Keşfet Filtreleri 👑</Text>
          <Text style={styles.filterSubtitle}>
            Keşfet akışını dilediğin gibi özelleştir. Yalnızca senin kriterlerine uyan kişiler listelensin!
          </Text>
        </View>

        {/* Distance Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>
            Maksimum Mesafe: <Text style={{ color: Colors.accentPurple }}>{filters.maxDistanceKm} km</Text>
          </Text>
          <View style={styles.chipRow}>
            {[3, 5, 10, 20].map((dist) => (
              <Pressable
                key={dist}
                onPress={() => setFilters((prev) => ({ ...prev, maxDistanceKm: dist }))}
                style={[
                  styles.filterChip,
                  filters.maxDistanceKm === dist && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.maxDistanceKm === dist && styles.filterChipTextActive,
                  ]}
                >
                  {dist} km
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Age Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>
            Yaş Aralığı: <Text style={{ color: Colors.accentBlue }}>{filters.minAge} - {filters.maxAge}</Text>
          </Text>
          <View style={styles.chipRow}>
            {[
              { label: '18 - 25', min: 18, max: 25 },
              { label: '20 - 30', min: 20, max: 30 },
              { label: '25 - 35', min: 25, max: 35 },
              { label: 'Tümü', min: 18, max: 99 },
            ].map((opt, oIdx) => {
              const isActive = filters.minAge === opt.min && filters.maxAge === opt.max;
              return (
                <Pressable
                  key={oIdx}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, minAge: opt.min, maxAge: opt.max }))
                  }
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Common Interests Only Switch */}
        <Pressable
          onPress={() =>
            setFilters((prev) => ({ ...prev, commonInterestsOnly: !prev.commonInterestsOnly }))
          }
          style={styles.filterSwitchRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Yalnızca Ortak İlgi Alanları ✨</Text>
            <Text style={styles.switchDesc}>
              Sadece seninle en az 1 ortak hobisi olan profiller listelenir.
            </Text>
          </View>
          <View
            style={[
              styles.miniSwitch,
              filters.commonInterestsOnly && styles.miniSwitchActive,
            ]}
          >
            <View
              style={[
                styles.miniSwitchKnob,
                filters.commonInterestsOnly && styles.miniSwitchKnobActive,
              ]}
            />
          </View>
        </Pressable>

        {/* Apply Button */}
        <Pressable
          onPress={() => {
            setIsFilterModalOpen(false);
            showToast({
              type: 'info',
              title: 'Filtreler Güncellendi! 🎯',
              message: 'Keşfet akışın seçtiğin kriterlere göre yenilendi.',
            });
          }}
          style={styles.applyFilterBtn}
        >
          <Text style={styles.applyFilterBtnText}>Filtreleri Uygula</Text>
        </Pressable>
      </SwipeableBottomSheet>

      {/* Premium Paywall Modal for Locked Features - Swipe Down to Dismiss */}
      <SwipeableBottomSheet
        visible={isPremiumPaywallOpen}
        onClose={() => setIsPremiumPaywallOpen(false)}
      >
        <View style={styles.shopHeader}>
          <View style={[styles.shopStarBadge, { borderColor: '#fbbf24', shadowColor: '#fbbf24' }]}>
            <Ionicons name="diamond" size={28} color="#fbbf24" />
          </View>
          <Text style={styles.shopTitle}>NAPALIM Premium 👑</Text>
          <Text style={styles.shopSubtitle}>
            Keşfet filtrelerini aç, her gün ücretsiz Süper Like kazan ve profiline altın rozet ekle!
          </Text>
        </View>

        <View style={styles.premiumPerksList}>
          <View style={styles.premiumPerkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.premiumPerkText}>Keşfet Filtreleri (Yaş, km, ilgi alanları)</Text>
          </View>
          <View style={styles.premiumPerkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.premiumPerkText}>Her gün +1 Ücretsiz Süper Like ⭐</Text>
          </View>
          <View style={styles.premiumPerkRow}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            <Text style={styles.premiumPerkText}>Altın Premium Rozeti ve Öncelikli Profil Görünümü 👑</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            setIsPremiumPaywallOpen(false);
            // Prompt user to purchase Premium
            Alert.alert(
              'Premium Satın Al 👑',
              'Aylık 149.99 ₺ karşılığında Premium ayrıcalıklarını başlatmak istiyor musun?',
              [
                { text: 'Vazgeç', style: 'cancel' },
                {
                  text: 'Satın Al 👑',
                  onPress: () => {
                    upgradeToPremium();
                  },
                },
              ]
            );
          }}
          style={styles.premiumBuyBtn}
        >
          <Text style={styles.premiumBuyBtnText}>Premium'a Geç — 149.99 ₺ / Ay</Text>
        </Pressable>

        <Pressable
          onPress={() => setIsPremiumPaywallOpen(false)}
          style={styles.shopCancelBtn}
        >
          <Text style={styles.shopCancelText}>Vazgeç</Text>
        </Pressable>
      </SwipeableBottomSheet>

      {/* Shared Avatar / Mascot Picker Modal */}
      <AvatarPickerModal
        visible={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        currentAvatar={profile.avatar}
        onSelectAvatar={(newAvatar) => setAvatar(newAvatar)}
        onClearAvatar={clearAvatar}
      />

      {/* Super Like Shop Modal - Swipe Down to Dismiss */}
      <SwipeableBottomSheet
        visible={isSuperLikeShopOpen}
        onClose={() => setIsSuperLikeShopOpen(false)}
      >
        <View style={styles.shopHeader}>
          <View style={styles.shopStarBadge}>
            <Ionicons name="star" size={28} color={Colors.accentBlue} />
          </View>
          <Text style={styles.shopTitle}>Süper Like Satın Al ⭐</Text>
          <Text style={styles.shopSubtitle}>
            Beğendiğin profillere öncelikli görün, anında dikkat çek ve eşleşme şansını 3 katına çıkar!
          </Text>
          <View style={styles.currentBalancePill}>
            <Text style={styles.currentBalanceText}>
              Mevcut Bakiyen: <Text style={{ color: '#60a5fa', fontWeight: '800' }}>{stats.superLikesCount} Adet</Text>
            </Text>
          </View>
        </View>

        {/* Price Packages */}
        <View style={styles.packagesContainer}>
          {/* Package 1 */}
          <Pressable
            onPress={() => {
              buySuperLikes(5);
              setIsSuperLikeShopOpen(false);
              Alert.alert('Tebrikler! 🎉', '5 adet Süper Like hesabına yüklendi! ⭐');
            }}
            style={({ pressed }) => [
              styles.packageCard,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.packageLeft}>
              <Text style={styles.packageEmoji}>⭐</Text>
              <View>
                <Text style={styles.packageName}>5 Süper Like</Text>
                <Text style={styles.packageHint}>Başlangıç Paketi</Text>
              </View>
            </View>
            <View style={styles.packageBuyBtn}>
              <Text style={styles.packagePriceText}>49.99 ₺</Text>
            </View>
          </Pressable>

          {/* Package 2 (Popular) */}
          <Pressable
            onPress={() => {
              buySuperLikes(15);
              setIsSuperLikeShopOpen(false);
              Alert.alert('Tebrikler! 🎉', '15 adet Süper Like hesabına yüklendi! 🌟');
            }}
            style={({ pressed }) => [
              styles.packageCard,
              styles.packageCardPopular,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>EN POPÜLER 🔥</Text>
            </View>
            <View style={styles.packageLeft}>
              <Text style={styles.packageEmoji}>🌟</Text>
              <View>
                <Text style={styles.packageName}>15 Süper Like</Text>
                <Text style={styles.packageHint}>3 Kat Daha Avantajlı</Text>
              </View>
            </View>
            <View style={[styles.packageBuyBtn, styles.packageBuyBtnPopular]}>
              <Text style={styles.packagePriceText}>119.99 ₺</Text>
            </View>
          </Pressable>

          {/* Package 3 (VIP) */}
          <Pressable
            onPress={() => {
              buySuperLikes(30);
              setIsSuperLikeShopOpen(false);
              Alert.alert('Tebrikler! 🎉', '30 adet Süper Like hesabına yüklendi! 👑');
            }}
            style={({ pressed }) => [
              styles.packageCard,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={styles.packageLeft}>
              <Text style={styles.packageEmoji}>👑</Text>
              <View>
                <Text style={styles.packageName}>30 Süper Like</Text>
                <Text style={styles.packageHint}>VIP Sınırsız İlgi Paketi</Text>
              </View>
            </View>
            <View style={styles.packageBuyBtn}>
              <Text style={styles.packagePriceText}>199.99 ₺</Text>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setIsSuperLikeShopOpen(false)}
          style={styles.shopCancelBtn}
        >
          <Text style={styles.shopCancelText}>Vazgeç</Text>
        </Pressable>
      </SwipeableBottomSheet>

      {/* Full Profile Detail Bottom Sheet - Swipe Down to Dismiss */}
      <SwipeableBottomSheet
        visible={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        contentStyle={[styles.profileDetailSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        {detailUser && (
          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Large Candidate Image with gradient & badges */}
            <View style={styles.detailImageWrapper}>
              <Image source={detailUser.image} style={styles.detailImage} />
              <View style={styles.detailImageBadge}>
                <Text style={styles.detailImageBadgeText}>📍 {detailUser.distance} uzakta</Text>
              </View>
              <View style={styles.detailVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#38bdf8" />
                <Text style={styles.detailVerifiedText}>Doğrulanmış Profil</Text>
              </View>
            </View>

            {/* Header Info */}
            <View style={styles.detailHeaderSection}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailName}>
                  {detailUser.name}, {detailUser.age}
                </Text>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Çevrimiçi</Text>
                </View>
              </View>
              <Text style={styles.detailLocation}>📍 {detailUser.location} • İstanbul</Text>
            </View>

            {/* Bio Section */}
            <View style={styles.detailCardBox}>
              <Text style={styles.detailSectionTitle}>Hakkında ✨</Text>
              <Text style={styles.detailBioText}>"{detailUser.bio}"</Text>
            </View>

            {/* Interests Section */}
            <View style={styles.detailCardBox}>
              <Text style={styles.detailSectionTitle}>İlgi Alanları & Tutkuları 🎯</Text>
              <View style={styles.tagsRow}>
                {detailUser.interests.map((tag, tIdx) => {
                  const isCommon = profile.tags.some((pt) => {
                    const cleanPt = pt.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
                    const cleanTag = tag.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '').trim().toLowerCase();
                    return cleanPt.includes(cleanTag) || cleanTag.includes(cleanPt);
                  });
                  return (
                    <View
                      key={`detail-tag-${tIdx}`}
                      style={[
                        styles.interestTag,
                        isCommon && styles.interestTagCommon,
                      ]}
                    >
                      {isCommon && (
                        <Ionicons name="sparkles" size={11} color={Colors.accentGreen} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.interestTagText,
                          isCommon && styles.interestTagTextCommon,
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Icebreaker Preference Box */}
            <View style={styles.detailCardBox}>
              <Text style={styles.detailSectionTitle}>Buz Kırıcı Tercihi ☕</Text>
              <Text style={styles.icebreakerDetailText}>
                "Eşleştiğimizde çarkıfeleği ilk kimin çevireceğini sabırsızlıkla bekliyorum! Ortak bir kahve veya eğlenceli bir aktiviteye her zaman varım."
              </Text>
            </View>

            {/* Quick Action Buttons inside Detail Sheet */}
            <View style={styles.detailActionRow}>
              <Pressable
                onPress={() => {
                  const u = detailUser;
                  setDetailUser(null);
                  setTimeout(() => forceSwipe('left', u), 180);
                }}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnNope,
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
              >
                <Ionicons name="close" size={26} color={Colors.accentRed} />
              </Pressable>

              <Pressable
                onPress={() => {
                  const u = detailUser;
                  setDetailUser(null);
                  setTimeout(() => forceSwipe('up', u), 180);
                }}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnSuper,
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
              >
                <Ionicons name="star" size={22} color={Colors.accentBlue} />
              </Pressable>

              <Pressable
                onPress={() => {
                  const u = detailUser;
                  setDetailUser(null);
                  setTimeout(() => forceSwipe('right', u), 180);
                }}
                style={({ pressed }) => [
                  styles.actionCircle,
                  styles.btnLike,
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
              >
                <Ionicons name="heart" size={26} color={Colors.accentGreen} />
              </Pressable>
            </View>
          </ScrollView>
        )}
      </SwipeableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitleRow: {
    gap: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  badgeCount: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  badgeCountText: {
    color: Colors.accentPurple,
    fontSize: 11,
    fontWeight: '700',
  },

  // Lock Screen Gate
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingBottom: 40,
  },
  lockRingWrapper: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  lockAmbientGlow: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  snakeRing: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 3.5,
    borderTopColor: '#c084fc',
    borderRightColor: '#ec4899',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 8,
  },
  snakeHeadDot: {
    position: 'absolute',
    top: 5,
    right: 28,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  centralLockCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#121222',
    borderWidth: 2,
    borderColor: 'rgba(192, 132, 252, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 20,
    elevation: 12,
  },
  lockedTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  lockedQuote: {
    color: Colors.accentPurple,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 10,
  },
  lockedDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 26,
  },
  featurePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  featurePillText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  unlockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentPurple,
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingVertical: 14,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  unlockActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Exit Ghost Button
  exitGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#9333ea',
    borderRadius: 26,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#d8b4fe',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  exitGhostBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Deck
  deckArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 36,
    height: SCREEN_HEIGHT * 0.60,
    borderRadius: 24,
    backgroundColor: Colors.bgSecondary,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(7, 7, 13, 0.88)',
    justifyContent: 'flex-end',
    padding: 18,
  },
  distanceBadge: {
    position: 'absolute',
    top: -24,
    left: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 15, 26, 0.9)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  distanceText: {
    color: Colors.accentGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  cardInfo: {
    gap: 4,
  },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  userLocation: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  userBio: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  interestTagCommon: {
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  interestTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  interestTagTextCommon: {
    color: '#86efac',
    fontWeight: '800',
  },

  // Stamps
  stamp: {
    position: 'absolute',
    borderWidth: 3.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 20,
  },
  stampLike: {
    top: 36,
    right: 30,
    borderColor: Colors.accentGreen,
    transform: [{ rotate: '16deg' }],
  },
  stampLikeText: {
    color: Colors.accentGreen,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  stampNope: {
    top: 36,
    left: 30,
    borderColor: Colors.accentRed,
    transform: [{ rotate: '-16deg' }],
  },
  stampNopeText: {
    color: Colors.accentRed,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  stampSuper: {
    bottom: 120,
    alignSelf: 'center',
    borderColor: Colors.accentBlue,
  },
  stampSuperText: {
    color: Colors.accentBlue,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    paddingBottom: 14,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnNope: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  btnSuper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  btnLike: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  btnRewind: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },

  // Full Profile Detail Sheet Styles
  profileDetailSheet: {
    maxHeight: SCREEN_HEIGHT * 0.86,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  detailScroll: {
    maxHeight: SCREEN_HEIGHT * 0.76,
  },
  detailScrollContent: {
    paddingBottom: 24,
  },
  detailImageWrapper: {
    width: '100%',
    height: 320,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    backgroundColor: Colors.bgCard,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailImageBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(15, 15, 26, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  detailImageBadgeText: {
    color: Colors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  detailVerifiedBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(15, 15, 26, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  detailVerifiedText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  detailHeaderSection: {
    marginBottom: 14,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailName: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  onlineText: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '700',
  },
  detailLocation: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  detailCardBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 16,
    marginBottom: 12,
  },
  detailSectionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  detailBioText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  icebreakerDetailText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  detailActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
    marginBottom: 8,
  },

  // Empty State
  emptyContainer: {
    width: SCREEN_WIDTH - 36,
    height: SCREEN_HEIGHT * 0.60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    padding: 30,
    alignItems: 'center',
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIconBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Colors.accentPurple,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Match Modal
  matchBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  matchCard: {
    width: '100%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.accentPurple,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.accentPink,
    letterSpacing: 2,
    marginBottom: 6,
  },
  matchSubtitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  matchAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  matchAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgCard,
    borderWidth: 2.5,
    borderColor: Colors.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  matchAvatarImg: {
    width: '100%',
    height: '100%',
  },
  matchHeartBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchMessageHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  matchSendBtn: {
    width: '100%',
    backgroundColor: Colors.accentPurple,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  matchSendBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  matchLaterBtn: {
    paddingVertical: 10,
  },
  matchLaterBtnText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Super Like Shop Modal Styles
  shopModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.78)',
    justifyContent: 'flex-end',
  },
  shopModalCard: {
    backgroundColor: '#120f24',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  shopHandle: {
    width: 44,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  shopHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  shopStarBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: Colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  shopTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  shopSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  currentBalancePill: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  currentBalanceText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  packagesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  packageCardPopular: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(29, 39, 74, 0.6)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 18,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  packageEmoji: {
    fontSize: 26,
  },
  packageName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  packageHint: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  packageBuyBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1.5,
    borderColor: Colors.accentBlue,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  packageBuyBtnPopular: {
    backgroundColor: '#3b82f6',
    borderColor: '#60a5fa',
  },
  packagePriceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  shopCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  shopCancelText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Filter Toggle Header Button
  filterToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterToggleBtnActive: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  filterLockBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Wheel Styles
  wheelSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  wheelBadgePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    marginBottom: 16,
  },
  wheelBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  wheelContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  wheelOuterGlow: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  wheelDisc: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: '#16122c',
    borderWidth: 3,
    borderColor: '#c084fc',
    overflow: 'hidden',
    position: 'relative',
  },
  wheelSlice: {
    height: 77,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSliceTop: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
  },
  wheelSliceBottom: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  wheelSliceDivider: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  wheelAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  wheelAvatarImg: {
    width: '100%',
    height: '100%',
  },
  wheelSliceText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wheelCenterHub: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f0a1c',
    borderWidth: 2,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  wheelPointer: {
    position: 'absolute',
    top: -12,
    zIndex: 20,
  },
  wheelResultCard: {
    width: '100%',
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  spinningStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  spinningStatusText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  wheelWinnerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  wheelWinnerTitle: {
    color: Colors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  questionBubble: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderWidth: 1.5,
    borderColor: Colors.accentPurple,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  questionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Filter Modal Styles
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.8)',
    justifyContent: 'flex-end',
  },
  filterModalCard: {
    backgroundColor: '#120f24',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  filterHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  filterCrownBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  filterSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    borderColor: Colors.accentPurple,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  filterSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  switchTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  switchDesc: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  miniSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 2,
    justifyContent: 'center',
  },
  miniSwitchActive: {
    backgroundColor: Colors.accentPurple,
  },
  miniSwitchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  miniSwitchKnobActive: {
    alignSelf: 'flex-end',
  },
  applyFilterBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyFilterBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  // Premium Paywall Perks
  premiumPerksList: {
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  premiumPerkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumPerkText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  premiumBuyBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginBottom: 6,
  },
  premiumBuyBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
});
