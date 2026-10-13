import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { INITIAL_PINS } from '../data/mockData';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';
import { triggerHaptic } from '../services/haptics';

const TypingDots: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: -5,
              duration: 280,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 280,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    const a1 = createAnim(dot1, 0);
    const a2 = createAnim(dot2, 140);
    const a3 = createAnim(dot3, 280);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={styles.typingDotsWrapper}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
};

export const ChatRoomModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    activeChatModal,
    closeChatModal,
    eventChats,
    sendEventMessage,
    sendMatchMessage,
    profile,
    showToast,
    matches,
  } = useApp();
  const [inputText, setInputText] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const event = activeChatModal?.type === 'event' ? activeChatModal.event : null;
  const match = activeChatModal?.type === 'match' ? activeChatModal.match : null;
  const currentMatch = match ? matches.find((m) => m.id === match.id) || match : null;

  const messages = event
    ? eventChats[event.id] || []
    : currentMatch
    ? currentMatch.messages.map((m) => ({
        id: m.id,
        senderId: m.sender === 'me' ? profile.id : 0,
        senderName: m.sender === 'me' ? profile.name : currentMatch.name,
        text: m.text,
        time: m.time,
        status: m.status,
      }))
    : [];

  // Intimacy Level & Heart Color Evolution:
  // 1. Kademe: 0 - 24 mesaj -> 💜 Neon Mor Kalp
  // 2. Kademe: 25 - 99 mesaj -> 💖 Canlı Neon Pembe Kalp
  // 3. Kademe: 100+ mesaj -> ❤️ Alevli Neon Kırmızı Kalp
  const messageCount = messages.length;
  const getIntimacyHeart = (count: number) => {
    if (count >= 100) {
      return { emoji: '❤️', label: 'Alevli Dostluk', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
    }
    if (count >= 25) {
      return { emoji: '💖', label: 'Isınan Sohbet', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' };
    }
    return { emoji: '💜', label: 'Yeni Tanışma', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' };
  };

  const intimacy = getIntimacyHeart(messageCount);

  // Listen to keyboard state to eliminate the bottom black gap when open
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

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, [messages.length, activeChatModal, isKeyboardVisible, currentMatch?.isTyping]);

  if (!activeChatModal) return null;

  const handleSend = () => {
    if (!inputText.trim()) return;
    triggerHaptic.light();
    if (event) {
      sendEventMessage(event.id, inputText.trim());
    } else if (match) {
      sendMatchMessage(match.id, inputText.trim());
    }
    setInputText('');
  };

  const isTyping = Boolean(currentMatch?.isTyping);
  const title = event ? event.title : currentMatch ? currentMatch.name : 'Sohbet';
  const subtitle = event
    ? `${event.members.length} katılımcı • Grup Sohbeti`
    : currentMatch
    ? isTyping
      ? 'yazıyor... 💬'
      : `📍 ${currentMatch.location} • ${messageCount} mesaj`
    : '';

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={closeChatModal}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={closeChatModal} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
            <View style={styles.headerTitleContainer}>
              <View style={styles.titleWithHeartRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title}
                </Text>
                {match && (
                  <View
                    style={[
                      styles.heartBadgeWrapper,
                      { backgroundColor: intimacy.glow, borderColor: intimacy.color },
                    ]}
                  >
                    <Text style={styles.heartBadgeEmoji}>{intimacy.emoji}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.headerSubtitle,
                  isTyping && { color: '#38bdf8', fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => {
              const isMe = msg.senderId === profile.id;
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.bubbleRow,
                    isMe ? styles.bubbleMeRow : styles.bubbleThemRow,
                  ]}
                >
                  {!isMe && (
                    <Text style={styles.senderName}>{msg.senderName}</Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                    ]}
                  >
                    <Text style={styles.bubbleText}>{msg.text}</Text>
                    <View style={styles.bubbleFooterRow}>
                      <Text style={styles.bubbleTime}>{msg.time}</Text>
                      {isMe && (
                        <View style={styles.statusCheckWrap}>
                          {msg.status === 'read' ? (
                            <Ionicons name="checkmark-done" size={14} color="#38bdf8" />
                          ) : msg.status === 'delivered' ? (
                            <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.65)" />
                          ) : (
                            <Ionicons name="checkmark" size={14} color="rgba(255, 255, 255, 0.65)" />
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Live Typing Indicator Bubble */}
            {isTyping && currentMatch && (
              <View style={styles.typingRow}>
                <View style={styles.typingAvatarCircle}>
                  <Text style={styles.typingAvatarEmoji}>{currentMatch.avatar || '💜'}</Text>
                </View>
                <View style={styles.typingBubble}>
                  <TypingDots />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Message Input Bar - Sits perfectly flush on top of keyboard */}
          <View
            style={[
              styles.inputBar,
              {
                paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 12),
              },
            ]}
          >
            {/* Quick Meetup Proposal Button */}
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setIsInviteSheetOpen(true);
              }}
              style={({ pressed }) => [
                styles.hangoutBtn,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
            >
              <Text style={{ fontSize: 16 }}>☕</Text>
            </Pressable>

            <TextInput
              style={styles.textInput}
              placeholder="Mesajınızı yazın..."
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendBtn,
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
            >
              <Ionicons name="arrow-up" size={18} color="#ffffff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Quick Hangout Meetup Sheet Modal - Swipe Down to Dismiss */}
        <SwipeableBottomSheet
          visible={isInviteSheetOpen}
          onClose={() => setIsInviteSheetOpen(false)}
          contentStyle={[styles.inviteSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
        >
          <View style={styles.inviteHeader}>
            <Text style={styles.inviteTitle}>☕ Hadi Bir Şeyler Yapalım!</Text>
            <Text style={styles.inviteSubtitle}>
              Sohbete direkt mekan daveti gönder. Bir kahveye veya etkinliğe ne dersin?
            </Text>
          </View>

          <ScrollView
            style={styles.venuesScroll}
            contentContainerStyle={styles.venuesContent}
            showsVerticalScrollIndicator={false}
          >
            {INITIAL_PINS.slice(0, 6).map((pin) => (
              <Pressable
                key={pin.id}
                onPress={() => {
                  const proposalText = `☕ Buluşma Teklifi:\n"${pin.description}" mekanına gidelim mi? 🚀`;
                  if (event) {
                    sendEventMessage(event.id, proposalText);
                  } else if (match) {
                    sendMatchMessage(match.id, proposalText);
                  }
                  setIsInviteSheetOpen(false);
                  showToast({
                    type: 'message',
                    title: 'Teklif Gönderildi! ☕',
                    message: `"${pin.district?.toUpperCase()}" mekan teklifin sohbete iletildi.`,
                  });
                }}
                style={({ pressed }) => [
                  styles.venueCard,
                  pressed && styles.venueCardPressed,
                ]}
              >
                <View style={styles.venueLeft}>
                  <View style={styles.venueIconCircle}>
                    <Text style={{ fontSize: 20 }}>
                      {pin.category === 'cafe' ? '☕' : pin.category === 'gaming' ? '🎮' : '📍'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueDistrict}>
                      {pin.district ? pin.district.toUpperCase() : 'İSTANBUL'} • Popüler Mekan
                    </Text>
                    <Text style={styles.venueDesc} numberOfLines={2}>
                      {pin.description}
                    </Text>
                  </View>
                </View>
                <Ionicons name="send" size={16} color={Colors.accentPurple} />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={() => setIsInviteSheetOpen(false)}
            style={styles.inviteCancelBtn}
          >
            <Text style={styles.inviteCancelText}>Vazgeç</Text>
          </Pressable>
        </SwipeableBottomSheet>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: Colors.bgSecondary,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  titleWithHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heartBadgeWrapper: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  heartBadgeEmoji: {
    fontSize: 14,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  bubbleRow: {
    maxWidth: '82%',
  },
  bubbleMeRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleThemRow: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
    marginLeft: 6,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: Colors.accentPurple,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  bubbleText: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  bubbleTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  statusCheckWrap: {
    marginLeft: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  typingAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingAvatarEmoji: {
    fontSize: 14,
  },
  typingBubble: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingDotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 10,
  },
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#38bdf8',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: Colors.borderGlass,
    backgroundColor: Colors.bgSecondary,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 18,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accentPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  hangoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Meetup Invite Sheet Styles
  inviteBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.78)',
    justifyContent: 'flex-end',
  },
  inviteSheet: {
    backgroundColor: '#120f24',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  inviteHandle: {
    width: 44,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  inviteHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  inviteSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  venuesScroll: {
    maxHeight: 340,
    marginBottom: 14,
  },
  venuesContent: {
    gap: 10,
    paddingBottom: 10,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    borderRadius: 18,
    padding: 12,
  },
  venueCardPressed: {
    borderColor: Colors.accentPurple,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  venueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  venueIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueDistrict: {
    color: Colors.accentPurple,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  venueDesc: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 16,
  },
  inviteCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  inviteCancelText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
});
