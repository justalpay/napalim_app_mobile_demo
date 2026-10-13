import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { ActivityEvent, CategoryId } from '../../types/data';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../../components/UserAvatar';
import { triggerHaptic } from '../../services/haptics';

export const EventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { events, joinEvent, leaveEvent, createEvent, openEventChat, profile, isLoggedIn } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [now, setNow] = useState(Date.now());

  // Create event modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryId>('gaming');
  const [newQuota, setNewQuota] = useState(4);

  // Swipe-down to dismiss gesture for Create Event modal
  const createTranslateY = useRef(new Animated.Value(0)).current;
  const createPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          createTranslateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 70 || gesture.vy > 0.45) {
          Animated.timing(createTranslateY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            setIsCreateModalOpen(false);
            createTranslateY.setValue(0);
          });
        } else {
          Animated.spring(createTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 75,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Live countdown timer ticking (every 1s)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (expiresAt: number) => {
    const diff = expiresAt - now;
    if (diff <= 0) return { text: 'Süresi Doldu', hours: 0, urgent: true, warning: false };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let text = '';
    if (hours > 0) {
      text = `${hours}s ${minutes}dk kaldı`;
    } else if (minutes > 0) {
      text = `${minutes}dk ${seconds}sn kaldı`;
    } else {
      text = `🔥 Son ${seconds}sn!`;
    }

    return {
      text,
      hours,
      urgent: hours < 3,
      warning: hours >= 3 && hours < 24,
    };
  };

  const handleShareEvent = async (event: ActivityEvent) => {
    triggerHaptic.light();
    try {
      const timeInfo = getTimeRemaining(event.expiresAt);
      await Share.share({
        title: event.title,
        message: `🔥 NAPALIM'da süper bir etkinlik buldum: "${event.title}"\n📍 Konum: ${event.location}\n⏳ Kalan Süre: ${timeInfo.text}\nKontenjan dolmadan hemen katıl! 🚀`,
      });
    } catch {}
  };

  const isUserMember = (event: ActivityEvent) => {
    return event.members.some((m) => m.id === profile.id);
  };

  const handleCreateSubmit = () => {
    if (!newTitle.trim() || !newLocation.trim()) return;
    triggerHaptic.success();
    createEvent(newTitle, newDesc, newLocation, newCategory, newQuota);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewLocation('');
  };

  const displayedEvents = events.filter((e) => {
    if (activeTab === 'my') return isUserMember(e);
    return true;
  });

  const requireAuth = (actionText: string): boolean => {
    if (!isLoggedIn) {
      Alert.alert(
        'Giriş Yapmalısın 🔒',
        `Bu özelliği kullanabilmek (${actionText}) için lütfen önce giriş yap.`
      );
      return false;
    }
    return true;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>⏳ 72s ETKİNLİKLER</Text>
          <Text style={styles.brandSubtitle}>
            Süresi dolmadan katıl, ekibini topla
          </Text>
        </View>

        {/* Create Event Button */}
        <Pressable
          onPress={() => {
            if (!requireAuth('etkinlik oluşturmak')) return;
            setIsCreateModalOpen(true);
          }}
          style={({ pressed }) => [
            styles.createBtn,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.createBtnText}>Oluştur</Text>
        </Pressable>
      </View>

      {/* Tabs Filter (Tümü / Katıldıklarım) */}
      <View style={styles.tabFilterRow}>
        <Pressable
          onPress={() => setActiveTab('all')}
          style={[styles.tabFilterBtn, activeTab === 'all' && styles.tabFilterBtnActive]}
        >
          <Text
            style={[
              styles.tabFilterText,
              activeTab === 'all' && styles.tabFilterTextActive,
            ]}
          >
            Tümü ({events.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('my')}
          style={[styles.tabFilterBtn, activeTab === 'my' && styles.tabFilterBtnActive]}
        >
          <Text
            style={[
              styles.tabFilterText,
              activeTab === 'my' && styles.tabFilterTextActive,
            ]}
          >
            Katıldıklarım ({events.filter(isUserMember).length})
          </Text>
        </Pressable>
      </View>

      {/* Events List */}
      <FlatList
        data={displayedEvents}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const timeInfo = getTimeRemaining(item.expiresAt);
          const isMember = isUserMember(item);
          const isFull = item.members.length >= item.maxMembers;
          const quotaPercent = Math.min(100, (item.members.length / item.maxMembers) * 100);

          return (
            <View style={styles.eventCard}>
              {/* Card Top Info */}
              <View style={styles.cardHeader}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.timeBadge,
                    timeInfo.urgent && styles.timeBadgeUrgent,
                    timeInfo.warning && styles.timeBadgeWarning,
                  ]}
                >
                  <Ionicons
                    name={timeInfo.urgent ? 'alert-circle' : 'time-outline'}
                    size={12}
                    color={timeInfo.urgent ? '#ffffff' : Colors.accentBlue}
                  />
                  <Text
                    style={[
                      styles.timeBadgeText,
                      timeInfo.urgent && { color: '#ffffff' },
                    ]}
                  >
                    {timeInfo.text}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventDesc}>{item.description}</Text>
              <Text style={styles.eventLocation}>📍 {item.location}</Text>

              {/* Quota Progress Bar */}
              <View style={styles.quotaSection}>
                <View style={styles.quotaHeader}>
                  <Text style={styles.quotaText}>
                    Kontenjan: {item.members.length} / {item.maxMembers} kişi
                  </Text>
                  {isFull && <Text style={styles.fullBadge}>DOLU</Text>}
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${quotaPercent}%` },
                      isFull && { backgroundColor: Colors.accentPink },
                    ]}
                  />
                </View>
              </View>

              {/* Members Avatars Row */}
              <View style={styles.membersRow}>
                <View style={styles.avatarsStack}>
                  {item.members.map((m, idx) => (
                    <View
                      key={m.id}
                      style={[
                        { position: 'absolute', left: idx * 22, zIndex: 10 - idx },
                      ]}
                    >
                      <UserAvatar avatar={m.id === profile.id ? profile.avatar : m.avatar} size={30} />
                    </View>
                  ))}
                </View>

                {/* Action Buttons & Share */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => handleShareEvent(item)}
                    style={({ pressed }) => [
                      styles.shareBtn,
                      pressed && { transform: [{ scale: 0.92 }] },
                    ]}
                    hitSlop={8}
                  >
                    <Ionicons name="share-social-outline" size={17} color={Colors.textSecondary} />
                  </Pressable>

                  {isMember ? (
                    <>
                      <Pressable
                        onPress={() => {
                          if (!requireAuth('sohbete katılmak')) return;
                          triggerHaptic.light();
                          openEventChat(item);
                        }}
                        style={({ pressed }) => [
                          styles.chatBtn,
                          pressed && { transform: [{ scale: 0.94 }] },
                        ]}
                      >
                        <Ionicons name="chatbubbles" size={15} color="#ffffff" />
                        <Text style={styles.chatBtnText}>Sohbete Git</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          triggerHaptic.medium();
                          leaveEvent(item.id);
                        }}
                        style={({ pressed }) => [
                          styles.leaveBtn,
                          pressed && { opacity: 0.6 },
                        ]}
                      >
                        <Text style={styles.leaveBtnText}>Ayrıl</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      disabled={isFull}
                      onPress={() => {
                        if (!requireAuth('etkinliklere katılmak')) return;
                        triggerHaptic.success();
                        joinEvent(item);
                      }}
                      style={({ pressed }) => [
                        styles.joinBtn,
                        isFull && styles.joinBtnDisabled,
                        pressed && { transform: [{ scale: 0.94 }] },
                      ]}
                    >
                      <Text style={styles.joinBtnText}>
                        {isFull ? 'Dolu 🔒' : 'Katıl ⚡'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Create Event Modal with Swipe-Down to Dismiss */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableWithoutFeedback onPress={() => setIsCreateModalOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + 20 },
              { transform: [{ translateY: createTranslateY }] },
            ]}
          >
            <View
              {...createPanResponder.panHandlers}
              style={{ width: '100%', paddingTop: 4, paddingBottom: 10, alignItems: 'center' }}
            >
              <View style={styles.modalSheetHandle} />
            </View>
            <View {...createPanResponder.panHandlers} style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>🎪 Yeni Etkinlik Oluştur</Text>
              <Pressable
                onPress={() => setIsCreateModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Başlık *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Örn: Kadıköy Okey Gecesi, FIFA Turnuvası..."
                placeholderTextColor={Colors.textTertiary}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.fieldLabel}>Konum / Mekan *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Örn: Moda Çay Bahçesi, Beşiktaş Köyiçi..."
                placeholderTextColor={Colors.textTertiary}
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={styles.fieldLabel}>Kontenjan: {newQuota} Kişi</Text>
              <View style={styles.quotaButtonsRow}>
                {[4, 6, 8, 12, 20].map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => setNewQuota(q)}
                    style={[
                      styles.quotaChip,
                      newQuota === q && styles.quotaChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quotaChipText,
                        newQuota === q && styles.quotaChipTextActive,
                      ]}
                    >
                      {q} Kişi
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Açıklama</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Ne yapacaksınız? Detayları yazın..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                value={newDesc}
                onChangeText={setNewDesc}
              />

              <Pressable
                onPress={handleCreateSubmit}
                style={styles.createSubmitBtn}
              >
                <Text style={styles.createSubmitText}>Etkinliği Başlat ✨ (72s)</Text>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.accentPurple,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tabFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tabFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  tabFilterBtnActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: Colors.accentPurple,
  },
  tabFilterText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabFilterTextActive: {
    color: Colors.textPrimary,
  },
  listContent: {
    gap: 14,
  },
  eventCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  timeBadgeUrgent: {
    backgroundColor: Colors.accentRed,
  },
  timeBadgeWarning: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  timeBadgeText: {
    color: Colors.accentBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  eventDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  eventLocation: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
  },
  quotaSection: {
    marginBottom: 14,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quotaText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  fullBadge: {
    color: Colors.accentPink,
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgCard,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.accentPurple,
  },
  membersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  avatarsStack: {
    position: 'relative',
    height: 32,
    width: 100,
  },
  memberAvatar: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bgCard,
    borderWidth: 1.5,
    borderColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.accentPurple,
  },
  joinBtnDisabled: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.accentPurple,
  },
  chatBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  leaveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  leaveBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  // Create Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  quotaButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quotaChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
  },
  quotaChipActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: Colors.accentPurple,
  },
  quotaChipText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  quotaChipTextActive: {
    color: Colors.textPrimary,
  },
  createSubmitBtn: {
    backgroundColor: Colors.accentPurple,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  createSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
