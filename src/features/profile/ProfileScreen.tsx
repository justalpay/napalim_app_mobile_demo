import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../../components/UserAvatar';
import { SlideToUnlock } from '../../components/SlideToUnlock';
import { SwipeableBottomSheet } from '../../components/SwipeableBottomSheet';
import { POPULAR_TAGS, MASCOTS } from '../../data/mockData';
import { AvatarSource, MascotKey } from '../../types/data';

const EMOJI_OPTIONS = ['🦊', '🚀', '🐱', '🤖', '⚡', '🎧', '🎮', '☕', '🎲', '👑'];

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    profile,
    stats,
    isLoggedIn,
    setIsLoggedIn,
    logout,
    login,
    updateProfile,
    setAvatar,
    addPhoto,
    removePhoto,
    clearAvatar,
    setDiscoverEnabled,
    buySuperLikes,
    upgradeToPremium,
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSuperLikeShopOpen, setIsSuperLikeShopOpen] = useState(false);
  const [isPremiumShopOpen, setIsPremiumShopOpen] = useState(false);
  const [showMascotsInline, setShowMascotsInline] = useState(false);

  // Keyboard open listener
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Edit form state
  const [editName, setEditName] = useState(profile.name);
  const [editAge, setEditAge] = useState(String(profile.age));
  const [editDistrict, setEditDistrict] = useState(profile.district);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editTags, setEditTags] = useState<string[]>(profile.tags);
  const [editHideLoc, setEditHideLoc] = useState(profile.isLocationHidden);
  const [editInvisible, setEditInvisible] = useState(profile.isInvisibleMode || false);
  const [editHidePremium, setEditHidePremium] = useState(profile.isPremiumBadgeHidden || false);

  // Time remaining until next daily super like (resets at midnight 00:00)
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const openEditModal = () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Giriş Yapmalısın 🔒',
        'Profilini düzenlemek ve fotoğraf yüklemek için lütfen önce giriş yap.'
      );
      setIsAuthModalOpen(true);
      return;
    }
    setEditName(profile.name);
    setEditAge(String(profile.age));
    setEditDistrict(profile.district);
    setEditBio(profile.bio);
    setEditTags(profile.tags);
    setEditHideLoc(profile.isLocationHidden);
    setEditInvisible(profile.isInvisibleMode || false);
    setEditHidePremium(profile.isPremiumBadgeHidden || false);
    setShowMascotsInline(false);
    setIsEditModalOpen(true);
  };



  const handleSaveProfile = () => {
    Keyboard.dismiss();
    const ageNum = parseInt(editAge, 10);
    updateProfile({
      name: editName.trim() || profile.name,
      age: isNaN(ageNum) ? profile.age : ageNum,
      district: editDistrict.trim() || profile.district,
      bio: editBio.trim() || profile.bio,
      tags: editTags,
      isLocationHidden: editHideLoc,
      isInvisibleMode: editInvisible,
      isDiscoverEnabled: !editInvisible,
      isPremiumBadgeHidden: editHidePremium,
    });
    setIsEditModalOpen(false);
  };

  const toggleTag = (tag: string) => {
    if (editTags.includes(tag)) {
      setEditTags(editTags.filter((t) => t !== tag));
    } else {
      if (editTags.length >= 6) {
        Alert.alert('Etiket Limiti', 'En fazla 6 adet ilgi alanı seçebilirsin.');
        return;
      }
      setEditTags([...editTags, tag]);
    }
  };

  // Gallery Picker (Up to 3 photos)
  const handlePickFromGallery = async () => {
    Keyboard.dismiss();
    if (!isLoggedIn) {
      Alert.alert('Giriş Yapmalısın 🔒', 'Fotoğraf ekleyebilmek için lütfen önce giriş yap.');
      return;
    }
    if (profile.avatars.length >= 3) {
      Alert.alert(
        'Fotoğraf Limiti (Max 3)',
        'Profiline en fazla 3 fotoğraf ekleyebilirsin. Yeni bir fotoğraf eklemek için önce mevcut fotoğraflarından birini silmelisin.'
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          'Galeriden fotoğraf seçebilmek için fotoğraf kitaplığına erişim izni vermelisin.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const customAvatar: AvatarSource = {
          type: 'custom',
          uri: result.assets[0].uri,
        };
        addPhoto(customAvatar);
      }
    } catch (err) {
      console.log('Gallery picker error:', err);
    }
  };

  // Camera Picker (Up to 3 photos)
  const handleTakePhoto = async () => {
    Keyboard.dismiss();
    if (!isLoggedIn) {
      Alert.alert('Giriş Yapmalısın 🔒', 'Fotoğraf çekebilmek için lütfen önce giriş yap.');
      return;
    }
    if (profile.avatars.length >= 3) {
      Alert.alert(
        'Fotoğraf Limiti (Max 3)',
        'Profiline en fazla 3 fotoğraf ekleyebilirsin. Yeni bir fotoğraf eklemek için önce mevcut fotoğraflarından birini silmelisin.'
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Kamera İzni Gerekli',
          'Fotoğraf çekebilmek için kamera kullanımına izin vermelisin.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const customAvatar: AvatarSource = {
          type: 'custom',
          uri: result.assets[0].uri,
        };
        addPhoto(customAvatar);
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  const handleSelectMascot = (key: MascotKey) => {
    if (!isLoggedIn) {
      Alert.alert('Giriş Yapmalısın 🔒', 'Maskot ekleyebilmek için lütfen önce giriş yap.');
      return;
    }
    if (profile.avatars.length >= 3) {
      Alert.alert(
        'Fotoğraf Limiti (Max 3)',
        'Profiline en fazla 3 fotoğraf ekleyebilirsin. Yeni bir fotoğraf eklemek için önce mevcut fotoğraflarından birini silmelisin.'
      );
      return;
    }
    addPhoto({ type: 'mascot', key });
    setShowMascotsInline(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    if (!isLoggedIn) {
      Alert.alert('Giriş Yapmalısın 🔒', 'Emoji ekleyebilmek için lütfen önce giriş yap.');
      return;
    }
    if (profile.avatars.length >= 3) {
      Alert.alert(
        'Fotoğraf Limiti (Max 3)',
        'Profiline en fazla 3 fotoğraf ekleyebilirsin. Yeni bir fotoğraf eklemek için önce mevcut fotoğraflarından birini silmelisin.'
      );
      return;
    }
    addPhoto({ type: 'emoji', emoji });
    setShowMascotsInline(false);
  };

  // Ensure avatars list is always an array
  const currentAvatars = profile.avatars || (profile.avatar ? [profile.avatar] : []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>👤 PROFİLİM</Text>
          <Text style={styles.subtitle}>Kimliğin, fotoğrafların ve istatistiklerin</Text>
        </View>

        <Pressable
          onPress={() => setIsAuthModalOpen(true)}
          style={[
            styles.authBadgeBtn,
            !isLoggedIn && styles.authBadgeBtnLoggedOut,
          ]}
        >
          <Ionicons
            name={isLoggedIn ? 'shield-checkmark' : 'log-out-outline'}
            size={14}
            color={isLoggedIn ? Colors.accentGreen : Colors.accentOrange}
          />
          <Text
            style={[
              styles.authBadgeText,
              !isLoggedIn && { color: Colors.accentOrange },
            ]}
          >
            {isLoggedIn ? 'Giriş Yapıldı' : 'Giriş Yapılmadı'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Main Hero Card with 3-Photo Showcase */}
        <View style={styles.profileCard}>
          {/* Main Primary Avatar */}
          <Pressable onPress={openEditModal} style={styles.avatarTouchable}>
            <UserAvatar avatar={profile.avatar} size={92} borderGlow />
            <View style={styles.avatarEditPill}>
              <Ionicons name="camera" size={11} color="#ffffff" />
              <Text style={styles.avatarEditPillText}>
                {currentAvatars.length > 0 ? `${currentAvatars.length}/3 Foto` : 'Görsel Seç'}
              </Text>
            </View>
          </Pressable>

          {/* 3 Photos Mini Slots Bar */}
          <View style={styles.miniPhotoRow}>
            {[0, 1, 2].map((slotIdx) => {
              const photo = currentAvatars[slotIdx];
              return (
                <Pressable
                  key={slotIdx}
                  onPress={openEditModal}
                  style={[
                    styles.miniPhotoSlot,
                    photo ? styles.miniPhotoSlotFilled : styles.miniPhotoSlotEmpty,
                  ]}
                >
                  {photo ? (
                    <>
                      <UserAvatar avatar={photo} size={42} />
                      {slotIdx === 0 && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Ana</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.miniSlotPlaceholder}>
                      <Ionicons name="add" size={18} color={Colors.accentPurple} />
                      <Text style={styles.miniSlotText}>Ekle</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Name & Age & Golden Premium Badge (Hidden if user chooses) */}
          <View style={styles.nameRowWithBadge}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            {profile.isPremium && !profile.isPremiumBadgeHidden && (
              <View style={styles.premiumCrownBadge}>
                <Ionicons name="sparkles" size={12} color="#fbbf24" />
                <Text style={styles.premiumCrownText}>PREMIUM</Text>
              </View>
            )}
          </View>

          {/* Location / Privacy */}
          <View style={styles.locationRow}>
            <Ionicons
              name={profile.isLocationHidden ? 'eye-off' : 'location-sharp'}
              size={13}
              color={profile.isLocationHidden ? Colors.accentOrange : Colors.accentPurple}
            />
            <Text style={styles.locationText}>
              {profile.isLocationHidden
                ? 'Konum Gizlendi (Gizli Mod)'
                : `${profile.district}, İstanbul`}
            </Text>
          </View>

          {/* Bio */}
          <Text style={styles.bio}>{profile.bio}</Text>

          {/* Stats Summary Bar - Now with Super Like + Satın Al */}
          <View style={styles.statsBar}>
            {/* Super Like Column with small '+' button */}
            <Pressable
              onPress={() => {
                if (!isLoggedIn) {
                  Alert.alert('Giriş Yapmalısın 🔒', 'Süper Like satın almak için lütfen önce giriş yap.');
                  return;
                }
                setIsSuperLikeShopOpen(true);
              }}
              style={({ pressed }) => [
                styles.statItem,
                styles.statItemSuperLike,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <View style={styles.superLikeCountRow}>
                <Text style={[styles.statVal, { color: Colors.accentBlue }]}>
                  {stats.superLikesCount}
                </Text>
                <View style={styles.superLikePlusBtn}>
                  <Ionicons name="add" size={13} color="#ffffff" />
                </View>
              </View>
              <Text style={[styles.statLabel, { color: '#93c5fd' }]}>Süper Like ⭐</Text>
            </Pressable>

            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{stats.pinsCount}</Text>
              <Text style={styles.statLabel}>Pin Bırakıldı 📍</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{stats.eventsCount}</Text>
              <Text style={styles.statLabel}>Etkinlik 🎪</Text>
            </View>
          </View>

          {/* Selected Tags */}
          <View style={styles.tagsContainer}>
            {profile.tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Invisible Mode / Keşfet Status Indicator Card */}
        {profile.isInvisibleMode && (
          <View style={styles.invisibleStatusBanner}>
            <View style={styles.invisibleBannerIconWrapper}>
              <Text style={{ fontSize: 22 }}>👻</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.invisibleBannerTitle}>Görünmez Mod Aktif 🕶️</Text>
              <Text style={styles.invisibleBannerSubtitle}>
                Keşfette kimseye gösterilmiyorsun. Profilini düzenleyerek dilediğin an kapatabilirsin.
              </Text>
            </View>
          </View>
        )}

        {/* Clean Menu Actions */}
        <View style={styles.actionsList}>
          {/* NAPALIM Premium Subscription Action */}
          <Pressable
            onPress={() => {
              if (!isLoggedIn) {
                Alert.alert('Giriş Yapmalısın 🔒', 'Premium üyeliğe geçmek için lütfen önce giriş yap.');
                setIsAuthModalOpen(true);
                return;
              }
              setIsPremiumShopOpen(true);
            }}
            style={({ pressed }) => [
              styles.actionItem,
              profile.isPremium && styles.actionItemPremiumActive,
              pressed && styles.actionItemPressed,
            ]}
          >
            <View style={styles.actionLeft}>
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(251, 191, 36, 0.18)' },
                ]}
              >
                <Ionicons name="sparkles" size={18} color="#fbbf24" />
              </View>
              <View style={styles.actionTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.actionTitle, { color: '#fbbf24' }]}>
                    NAPALIM Premium
                  </Text>
                  {profile.isPremium && (
                    <View style={styles.activePillBadge}>
                      <Text style={styles.activePillText}>AKTİF</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionSubtitle} numberOfLines={1}>
                  {profile.isPremium
                    ? 'Ayrıcalıkların devrede • Günlük +1 Süper Like'
                    : 'Filtreler, her gün +1 Süper Like ve altın rozet'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fbbf24" />
          </Pressable>

          {/* All-in-one Edit Profile */}
          <Pressable
            onPress={openEditModal}
            style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}
          >
            <View style={styles.actionLeft}>
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(168, 85, 247, 0.15)' },
                ]}
              >
                <Ionicons name="create" size={18} color={Colors.accentPurple} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={styles.actionTitle}>Profili Düzenle</Text>
                <Text style={styles.actionSubtitle} numberOfLines={1}>
                  Fotoğraflar, biyografi ve ilgi alanları
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>

          {/* Account & Auth Gate */}
          <Pressable
            onPress={() => setIsAuthModalOpen(true)}
            style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}
          >
            <View style={styles.actionLeft}>
              <View
                style={[
                  styles.actionIconCircle,
                  { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
                ]}
              >
                <Ionicons name="key" size={18} color={Colors.accentBlue} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Giriş & Güvenlik</Text>
                <Text style={styles.actionSubtitle}>Apple / Google Giriş & Hesap Durumu</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Profile Modal - Swipe Down to Dismiss */}
      <SwipeableBottomSheet
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        avoidKeyboard={true}
        contentStyle={[
          styles.modalSheet,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            maxHeight: '92%',
          },
        ]}
      >
        {/* Header with Done / Close button */}
        <View style={styles.modalHeaderRow}>
          <View>
            <Text style={styles.modalTitle}>✨ Profili Düzenle</Text>
            <Text style={styles.modalSubtitle}>Fotoğraflarını ve bilgilerini yönet</Text>
          </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isKeyboardVisible && (
                  <Pressable onPress={() => Keyboard.dismiss()} style={styles.dismissKbdBtn}>
                    <Ionicons name="checkmark-done" size={14} color="#ffffff" />
                    <Text style={styles.dismissKbdText}>Kapat</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsEditModalOpen(false);
                  }}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: isKeyboardVisible ? 240 : 440 }}
            >
              {/* Multi-Photo Manager Section (Up to 3 Photos) */}
              <View style={styles.photoManagerBox}>
                <View style={styles.photoManagerHeaderRow}>
                  <Text style={styles.photoManagerTitle}>
                    FOTOĞRAFLARIN ({currentAvatars.length}/3)
                  </Text>
                  <Text style={styles.photoManagerHint}>
                    {currentAvatars.length > 0 ? 'Keşfet Açık ✨' : 'Keşfet Kilitli 🔒'}
                  </Text>
                </View>

                {/* 3 Photo Slots Side-by-Side */}
                <View style={styles.photoSlotsRow}>
                  {[0, 1, 2].map((idx) => {
                    const item = currentAvatars[idx];
                    return (
                      <View key={idx} style={styles.photoSlotCard}>
                        {item ? (
                          <View style={styles.photoSlotContent}>
                            <UserAvatar avatar={item} size={68} borderGlow={idx === 0} />
                            {/* Primary Badge */}
                            <View
                              style={[
                                styles.slotBadge,
                                idx === 0 ? styles.slotBadgePrimary : styles.slotBadgeSecondary,
                              ]}
                            >
                              <Text style={styles.slotBadgeText}>
                                {idx === 0 ? '1. Ana' : `${idx + 1}. Foto`}
                              </Text>
                            </View>
                            {/* Delete Photo Button */}
                            <Pressable
                              onPress={() => removePhoto(idx)}
                              style={styles.deletePhotoCircle}
                            >
                              <Ionicons name="close" size={12} color="#ffffff" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={handlePickFromGallery}
                            style={styles.emptySlotCard}
                          >
                            <Ionicons name="add" size={24} color={Colors.accentPurple} />
                            <Text style={styles.emptySlotText}>+ Foto</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Direct Action Buttons to Add Photos */}
                <View style={styles.imageActionButtonsGrid}>
                  <Pressable
                    onPress={handlePickFromGallery}
                    style={({ pressed }) => [
                      styles.imageActionBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="images" size={15} color={Colors.accentPurple} />
                    <Text style={styles.imageActionBtnText}>Galeriden Ekle</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleTakePhoto}
                    style={({ pressed }) => [
                      styles.imageActionBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="camera" size={15} color={Colors.accentPink} />
                    <Text style={styles.imageActionBtnText}>Fotoğraf Çek</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowMascotsInline(!showMascotsInline);
                    }}
                    style={({ pressed }) => [
                      styles.imageActionBtn,
                      showMascotsInline && styles.imageActionBtnActive,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="sparkles" size={15} color={Colors.accentCyan} />
                    <Text style={styles.imageActionBtnText}>3D Maskot Ekle</Text>
                  </Pressable>
                </View>

                {/* Inline 3D AI Mascots & Emojis Tray */}
                {showMascotsInline && (
                  <View style={styles.inlineMascotsArea}>
                    <Text style={styles.inlineSectionHeader}>3D AI MASKOT SEÇ (MAX 3)</Text>
                    <View style={styles.mascotsGrid}>
                      {MASCOTS.map((m) => (
                        <Pressable
                          key={m.key}
                          onPress={() => handleSelectMascot(m.key)}
                          style={styles.mascotChip}
                        >
                          <Image source={m.image} style={styles.mascotThumb} />
                          <Text style={styles.mascotChipName} numberOfLines={1}>
                            {m.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={[styles.inlineSectionHeader, { marginTop: 12 }]}>
                      KARAKTER EMOJİSİ SEÇ
                    </Text>
                    <View style={styles.emojiGrid}>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <Pressable
                          key={emoji}
                          onPress={() => handleSelectEmoji(emoji)}
                          style={styles.emojiChip}
                        >
                          <Text style={{ fontSize: 18 }}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>İsim</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="İsmin"
                placeholderTextColor={Colors.textTertiary}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Yaş</Text>
                  <TextInput
                    style={styles.input}
                    value={editAge}
                    onChangeText={setEditAge}
                    keyboardType="number-pad"
                    placeholder="24"
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>İlçe / Semt</Text>
                  <TextInput
                    style={styles.input}
                    value={editDistrict}
                    onChangeText={setEditDistrict}
                    placeholder="Kadıköy"
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Biyografi</Text>
              <TextInput
                style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                placeholder="Kendinden ve neler yapmaktan hoşlandığından bahset..."
                placeholderTextColor={Colors.textTertiary}
              />

              {/* Privacy Location Switch */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Konumumu Profilimde Gizle</Text>
                  <Text style={styles.switchSubtitle}>
                    Etkinliklerde ve haritada tam ilçen gizli kalır
                  </Text>
                </View>
                <Switch
                  value={editHideLoc}
                  onValueChange={setEditHideLoc}
                  trackColor={{ false: '#334155', true: Colors.accentPurple }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Invisible Mode Switch */}
              <View style={[styles.switchRow, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Görünmez Mod (Keşfette Gizlen) 👻</Text>
                  <Text style={styles.switchSubtitle}>
                    Açıldığında profilin keşfette kimseye gösterilmez, hayalet gibi gezersin
                  </Text>
                </View>
                <Switch
                  value={editInvisible}
                  onValueChange={setEditInvisible}
                  trackColor={{ false: '#334155', true: '#c084fc' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Hide Premium Badge Switch */}
              <View style={[styles.switchRow, { marginTop: 10 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Premium Rozetini Gizle 👑</Text>
                  <Text style={styles.switchSubtitle}>
                    Profilinde altın Premium rozeti gizlenir, ayrıcalıkların sessizce çalışır
                  </Text>
                </View>
                <Switch
                  value={editHidePremium}
                  onValueChange={setEditHidePremium}
                  trackColor={{ false: '#334155', true: '#fbbf24' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Interests Tags Selection */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                İlgi Alanların (En fazla 6 adet)
              </Text>
              <View style={styles.editTagsGrid}>
                {POPULAR_TAGS.map((tag) => {
                  const selected = editTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.editTagChip, selected && styles.editTagChipActive]}
                    >
                      <Text
                        style={[
                          styles.editTagChipText,
                          selected && { color: '#ffffff', fontWeight: '700' },
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Fixed Submit Button - Always sticky right above keyboard */}
            <Pressable
              onPress={handleSaveProfile}
              style={({ pressed }) => [
                styles.saveProfileBtn,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.saveProfileBtnText}>Değişiklikleri Kaydet ✨</Text>
            </Pressable>
      </SwipeableBottomSheet>

      {/* Auth Gate / Account Modal */}
      <Modal
        visible={isAuthModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAuthModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback onPress={() => setIsAuthModalOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.authCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>🔐 Napalim Hesabı</Text>
                <Text style={styles.subtitle}>App Store & Güvenlik Standartları</Text>
              </View>
              <Pressable onPress={() => setIsAuthModalOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            {isLoggedIn ? (
              <>
                <View style={styles.activeAccountBox}>
                  <UserAvatar avatar={profile.avatar} size={48} borderGlow />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName}>{profile.name}</Text>
                    <Text style={styles.accountEmail}>alpay@napalim.app</Text>
                    <View style={styles.verifiedRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
                      <Text style={styles.verifiedText}>Doğrulanmış Hesap</Text>
                    </View>
                  </View>
                </View>

                {/* Logout Button */}
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Çıkış Yap 🚪',
                      'Hesabından çıkış yapmak istediğine emin misin?',
                      [
                        { text: 'Vazgeç', style: 'cancel' },
                        {
                          text: 'Çıkış Yap',
                          style: 'destructive',
                          onPress: () => {
                            logout();
                            setIsAuthModalOpen(false);
                            Alert.alert('Çıkış Yapıldı 🚪', 'Tüm profil ve oturum bilgilerin sıfırlandı.');
                          },
                        },
                      ]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.logoutBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={18} color={Colors.accentRed} />
                  <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.activeAccountBox, { borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                  <View style={styles.loggedOutIconCircle}>
                    <Ionicons name="person-outline" size={24} color={Colors.accentOrange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountName}>Misafir Kullanıcı</Text>
                    <Text style={styles.accountEmail}>Oturum kapalı</Text>
                    <View style={styles.verifiedRow}>
                      <Ionicons name="warning-outline" size={14} color={Colors.accentOrange} />
                      <Text style={[styles.verifiedText, { color: Colors.accentOrange }]}>
                        Giriş Yapılmadı
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Apple Sign-In Button */}
                <Pressable
                  onPress={() => {
                    login('apple');
                    setIsAuthModalOpen(false);
                    Alert.alert('Hoş Geldin 🎉', 'Apple Kimliği ile başarıyla giriş yapıldı.');
                  }}
                  style={styles.appleBtn}
                >
                  <Ionicons name="logo-apple" size={20} color="#ffffff" />
                  <Text style={styles.appleBtnText}>Sign in with Apple</Text>
                </Pressable>

                {/* Google Sign-In Button */}
                <Pressable
                  onPress={() => {
                    login('google');
                    setIsAuthModalOpen(false);
                    Alert.alert('Hoş Geldin 🎉', 'Google Hesabı ile başarıyla giriş yapıldı.');
                  }}
                  style={styles.googleBtn}
                >
                  <Ionicons name="logo-google" size={18} color="#000000" />
                  <Text style={styles.googleBtnText}>Google ile Giriş Yap</Text>
                </Pressable>
              </>
            )}

            <Pressable
              onPress={() => setIsAuthModalOpen(false)}
              style={styles.authCloseActionBtn}
            >
              <Text style={styles.authCloseActionText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

      {/* Premium Subscription Shop Modal - Swipe Down to Dismiss */}
      <SwipeableBottomSheet
        visible={isPremiumShopOpen}
        onClose={() => setIsPremiumShopOpen(false)}
      >
        <View style={styles.shopHeader}>
          <View style={[styles.shopStarBadge, { borderColor: '#fbbf24', shadowColor: '#fbbf24' }]}>
            <Ionicons name="sparkles" size={28} color="#fbbf24" />
          </View>
          <Text style={styles.shopTitle}>NAPALIM Premium 👑</Text>
          <Text style={styles.shopSubtitle}>
            Tüm sınırları kaldır! Keşfet filtreleriyle aradığın insanı bul, her gün hediye Süper Like kazan.
          </Text>
          {profile.isPremium ? (
            <View style={styles.currentBalancePill}>
              <Text style={[styles.currentBalanceText, { color: '#fbbf24' }]}>
                ✨ Premium Üyeliğin Halihazırda Aktif!
              </Text>
            </View>
          ) : null}
        </View>

        {/* Perks List */}
        <View style={styles.premiumPerksContainer}>
          <View style={styles.premiumPerkItem}>
            <Ionicons name="options-outline" size={20} color="#fbbf24" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumPerkItemTitle}>Gelişmiş Keşfet Filtreleri</Text>
              <Text style={styles.premiumPerkItemDesc}>Yaş, mesafe (km) ve ortak ilgi alanlarına göre filtrele</Text>
            </View>
          </View>

          <View style={styles.premiumPerkItem}>
            <Ionicons name="star" size={20} color="#3b82f6" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumPerkItemTitle}>Her Gün +1 Ücretsiz Süper Like ⭐</Text>
              <Text style={styles.premiumPerkItemDesc}>Bakiyene her gün otomatik +1 süper like yüklenir</Text>
              {profile.isPremium && (
                <View style={styles.renewalCountdownBadge}>
                  <Ionicons name="time-outline" size={12} color="#60a5fa" />
                  <Text style={styles.renewalCountdownText}>
                    Sonraki Süper Like: <Text style={{ fontWeight: '800', color: '#ffffff' }}>{hoursRemaining}s {minutesRemaining}dk</Text> sonra
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.premiumPerkItem}>
            <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumPerkItemTitle}>Altın Rozet & Öncelikli Görünüm</Text>
              <Text style={styles.premiumPerkItemDesc}>Profilinde altın taç rozeti parlar ve 3 kat daha çok eşleşirsin</Text>
            </View>
          </View>
        </View>

        {/* Buy Button */}
        {!profile.isPremium ? (
          <Pressable
            onPress={() => {
              upgradeToPremium();
              setIsPremiumShopOpen(false);
            }}
            style={styles.premiumSubscribeBtn}
          >
            <Text style={styles.premiumSubscribeBtnText}>
              Hemen Başlat — 149.99 ₺ / Ay 👑
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setIsPremiumShopOpen(false)}
            style={styles.premiumActiveCloseBtn}
          >
            <Text style={styles.premiumActiveCloseText}>Ayrıcalıkların Aktif 👍</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => setIsPremiumShopOpen(false)}
          style={styles.shopCancelBtn}
        >
          <Text style={styles.shopCancelText}>Vazgeç</Text>
        </Pressable>
      </SwipeableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  authBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  authBadgeBtnLoggedOut: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  authBadgeText: {
    color: Colors.accentGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 16,
  },
  profileCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    padding: 22,
  },
  avatarTouchable: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  avatarEditPill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.accentPurple,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  avatarEditPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  // 3 Mini Photos Slot on Hero Card
  miniPhotoRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  miniPhotoSlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  miniPhotoSlotFilled: {
    backgroundColor: Colors.bgCard,
  },
  miniPhotoSlotEmpty: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderGlass,
  },
  miniSlotPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniSlotText: {
    color: Colors.textTertiary,
    fontSize: 8,
    fontWeight: '700',
    marginTop: -2,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: Colors.accentPurple,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  primaryBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },

  name: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  locationText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    color: Colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statItemSuperLike: {
    paddingVertical: 2,
    borderRadius: 12,
  },
  superLikeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  superLikePlusBtn: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statVal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderGlass,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tagText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },

  // Invisible Mode Status Banner
  invisibleStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(26, 20, 45, 0.85)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.45)',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  invisibleBannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  invisibleBannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  invisibleBannerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },

  // Actions List
  actionsList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  // Edit Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  dismissKbdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.accentPurple,
  },
  dismissKbdText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },

  // Photo Manager Inside Edit Modal
  photoManagerBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 14,
    marginBottom: 14,
  },
  photoManagerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoManagerTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  photoManagerHint: {
    color: Colors.accentGreen,
    fontSize: 10,
    fontWeight: '700',
  },
  photoSlotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  photoSlotCard: {
    flex: 1,
    height: 104,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoSlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  slotBadge: {
    position: 'absolute',
    bottom: 6,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotBadgePrimary: {
    backgroundColor: Colors.accentPurple,
  },
  slotBadgeSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  slotBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  deletePhotoCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentRed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accentRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  emptySlotCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emptySlotText: {
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
  },

  imageActionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  imageActionBtnActive: {
    borderColor: Colors.accentCyan,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  imageActionBtnText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },

  // Inline Mascots Area
  inlineMascotsArea: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.borderGlass,
  },
  inlineSectionHeader: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  mascotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  mascotChip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  mascotThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  mascotChipName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },

  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginTop: 12,
  },
  switchTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  switchSubtitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  editTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  editTagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  editTagChipActive: {
    borderColor: Colors.accentPurple,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
  },
  editTagChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  saveProfileBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  saveProfileBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  // Auth Modal
  authCard: {
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 22,
  },
  activeAccountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 18,
  },
  accountName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  accountEmail: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    color: Colors.accentGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    marginBottom: 10,
  },
  appleBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  googleBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 14,
    marginBottom: 10,
  },
  logoutBtnText: {
    color: Colors.accentRed,
    fontSize: 14,
    fontWeight: '700',
  },
  loggedOutIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCloseActionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  authCloseActionText: {
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

  // Name & Premium Badge Styles
  nameRowWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  premiumCrownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  premiumCrownText: {
    color: '#fbbf24',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Action Menu Premium Item
  actionItemPremiumActive: {
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(38, 30, 20, 0.65)',
  },
  activePillBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '900',
  },

  // Premium Shop Modal Extras
  premiumPerksContainer: {
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  premiumPerkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  premiumPerkItemTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  premiumPerkItemDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  premiumSubscribeBtn: {
    backgroundColor: '#fbbf24',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    marginBottom: 6,
  },
  premiumSubscribeBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  premiumActiveCloseBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  premiumActiveCloseText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '800',
  },
  renewalCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  renewalCountdownText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
  },
});
