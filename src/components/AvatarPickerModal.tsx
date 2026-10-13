import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { MASCOTS } from '../data/mockData';
import { AvatarSource, MascotKey } from '../types/data';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';

const EMOJI_OPTIONS = ['🦊', '🚀', '🐱', '🤖', '⚡', '🎧', '🎮', '☕', '🎲', '👑'];

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentAvatar: AvatarSource | null;
  onSelectAvatar: (avatar: AvatarSource) => void;
  onClearAvatar?: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  currentAvatar,
  onSelectAvatar,
  onClearAvatar,
}) => {
  const [selected, setSelected] = useState<AvatarSource | null>(currentAvatar);

  // Sync when opened
  React.useEffect(() => {
    if (visible) {
      setSelected(currentAvatar);
    }
  }, [visible, currentAvatar]);

  const handlePickFromGallery = async () => {
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
        setSelected(customAvatar);
        onSelectAvatar(customAvatar);
        onClose();
      }
    } catch (err) {
      console.log('Image picker error:', err);
    }
  };

  const handleSelectMascot = (key: MascotKey) => {
    const mascotAvatar: AvatarSource = { type: 'mascot', key };
    setSelected(mascotAvatar);
  };

  const handleSelectEmoji = (emoji: string) => {
    const emojiAvatar: AvatarSource = { type: 'emoji', emoji };
    setSelected(emojiAvatar);
  };

  const handleSave = () => {
    if (selected) {
      onSelectAvatar(selected);
    }
    onClose();
  };

  const isMascotSelected = (key: MascotKey) => {
    return selected?.type === 'mascot' && selected.key === key;
  };

  const isEmojiSelected = (emoji: string) => {
    return selected?.type === 'emoji' && selected.emoji === emoji;
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      contentStyle={{
        backgroundColor: Colors.bgSecondary,
        maxHeight: '90%',
        paddingHorizontal: 20,
        paddingTop: 4,
      }}
    >
      {/* Modal Header */}
      <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>🎨 Avatarını Seç</Text>
              <Text style={styles.subtitle}>
                3D AI maskot, fotoğraf veya emoji ile keşfete gir!
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Gallery Upload Button */}
            <Pressable
              onPress={handlePickFromGallery}
              style={({ pressed }) => [
                styles.galleryUploadBtn,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.galleryIconCircle}>
                <Ionicons name="camera" size={22} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.galleryUploadTitle}>Kendi Fotoğrafını Yükle 📸</Text>
                <Text style={styles.galleryUploadDesc}>
                  Galerinden favori bir portreni seç ve kullan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </Pressable>

            {/* 3D AI Mascots Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>3D AI MASKOTLAR</Text>
              <View style={styles.badgeNeon}>
                <Text style={styles.badgeNeonText}>ÖZEL TASARIM</Text>
              </View>
            </View>

            <View style={styles.mascotsGrid}>
              {MASCOTS.map((m) => {
                const active = isMascotSelected(m.key);
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => handleSelectMascot(m.key)}
                    style={[styles.mascotCard, active && styles.mascotCardActive]}
                  >
                    <Image source={m.image} style={styles.mascotImg} />
                    {active && (
                      <View style={styles.selectedCheckBadge}>
                        <Ionicons name="checkmark-sharp" size={12} color="#ffffff" />
                      </View>
                    )}
                    <View style={styles.mascotInfo}>
                      <Text style={styles.mascotName}>{m.name}</Text>
                      <Text style={styles.mascotTag} numberOfLines={1}>
                        {m.tag}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Emoji Selection */}
            <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 10 }]}>
              VEYA BİR KARAKTER EMOJİSİ SEÇ
            </Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => {
                const active = isEmojiSelected(emoji);
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => handleSelectEmoji(emoji)}
                    style={[styles.emojiBtn, active && styles.emojiBtnActive]}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Clear / Reset Avatar Option for testing lock screen */}
            {onClearAvatar && (
              <Pressable
                onPress={() => {
                  onClearAvatar();
                  setSelected(null);
                  onClose();
                }}
                style={styles.clearBtn}
              >
                <Ionicons name="lock-closed-outline" size={16} color={Colors.accentRed} />
                <Text style={styles.clearBtnText}>Fotoğrafı Kaldır (Keşfet Kilidini Test Et)</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Bottom Action Save */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={handleSave}
              disabled={!selected}
              style={({ pressed }) => [
                styles.saveBtn,
                !selected && styles.saveBtnDisabled,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <Text style={styles.saveBtnText}>
                {selected ? 'Seçimi Onayla & Parlat ✨' : 'Lütfen Bir Görsel Seç'}
              </Text>
            </Pressable>
          </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  galleryUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1.5,
    borderColor: Colors.accentPurple,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },
  galleryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryUploadTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  galleryUploadDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeNeon: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderWidth: 1,
    borderColor: Colors.accentPink,
  },
  badgeNeonText: {
    color: Colors.accentPink,
    fontSize: 9,
    fontWeight: '800',
  },
  mascotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  mascotCard: {
    width: '48%',
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.borderGlass,
    overflow: 'hidden',
    position: 'relative',
  },
  mascotCardActive: {
    borderColor: Colors.accentPurple,
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  mascotImg: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotInfo: {
    padding: 10,
  },
  mascotName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  mascotTag: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBtnActive: {
    borderColor: Colors.accentPink,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    transform: [{ scale: 1.08 }],
  },
  emojiText: {
    fontSize: 22,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearBtnText: {
    color: Colors.accentRed,
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: Colors.borderGlass,
  },
  saveBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
