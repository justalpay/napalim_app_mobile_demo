import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';
import { CURRENT_USER } from '../../data/mockData';

export const ChatListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { events, eventChats, matches, openEventChat, openMatchChat, isLoggedIn, profile } = useApp();

  // Get events user has joined
  const myEvents = events.filter((e) =>
    e.members.some((m) => m.id === profile.id)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💬 MESAJLAR</Text>
        <Text style={styles.subtitle}>
          {myEvents.length} grup sohbeti • {matches.length} eşleşme
        </Text>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Section 1: Event Group Chats */}
            {myEvents.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>🎪 ETKİNLİK GRUP SOHBETLERİ</Text>
                {myEvents.map((event) => {
                  const msgs = eventChats[event.id] || [];
                  const lastMsg =
                    msgs.length > 0
                      ? msgs[msgs.length - 1]
                      : { text: 'Sohbeti başlat...', time: 'Yeni', senderName: '' };

                  return (
                    <Pressable
                      key={`event-chat-${event.id}`}
                      onPress={() => openEventChat(event)}
                      style={({ pressed }) => [
                        styles.chatRow,
                        styles.eventChatRow,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={styles.avatarCircleEvent}>
                        <Ionicons name="people" size={22} color={Colors.accentPurple} />
                      </View>
                      <View style={styles.chatInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.chatName} numberOfLines={1}>
                            {event.title}
                          </Text>
                          <Text style={styles.chatTime}>{lastMsg.time}</Text>
                        </View>
                        <Text style={styles.lastMsg} numberOfLines={1}>
                          {lastMsg.senderName && lastMsg.senderName !== CURRENT_USER.name
                            ? `${lastMsg.senderName}: `
                            : ''}
                          {lastMsg.text}
                        </Text>
                      </View>
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>GRUP</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Section 2: Matches & 1-on-1 Chats */}
            {matches.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>💜 EŞLEŞMELER & SOHBETLER</Text>
                {matches.map((item) => {
                  const msgCount = item.messages ? item.messages.length : 1;
                  const intimacyEmoji = msgCount >= 100 ? '❤️' : msgCount >= 25 ? '💖' : '💜';
                  const intimacyBorder = msgCount >= 100 ? '#ef4444' : msgCount >= 25 ? '#ec4899' : '#a855f7';

                  return (
                    <Pressable
                      key={`match-chat-${item.id}`}
                      onPress={() => openMatchChat(item)}
                      style={({ pressed }) => [
                        styles.chatRow,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={[styles.avatarCircle, { borderColor: intimacyBorder, borderWidth: 1.5 }]}>
                        <Text style={styles.avatarText}>{intimacyEmoji}</Text>
                      </View>
                      <View style={styles.chatInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.chatName}>{item.name}</Text>
                          <Text style={styles.chatTime}>{item.time}</Text>
                        </View>
                        <Text
                          style={[
                            styles.lastMsg,
                            item.isTyping && { color: '#38bdf8', fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.isTyping ? 'yazıyor... 💬' : item.lastMsg}
                        </Text>
                      </View>
                      {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Empty State when no events & no matches */}
            {myEvents.length === 0 && matches.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>Henüz Mesajın Yok</Text>
                <Text style={styles.emptySubtitle}>
                  {!isLoggedIn
                    ? 'Mesajlaşmak ve etkinlik gruplarına katılmak için lütfen giriş yap.'
                    : 'Keşfet\'te eşleştiğin kişiler ve katıldığın etkinlik sohbetleri burada listelenir.'}
                </Text>
              </View>
            )}
          </>
        }
      />
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
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    gap: 16,
  },
  sectionContainer: {
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 14,
    gap: 12,
  },
  eventChatRow: {
    borderColor: 'rgba(168, 85, 247, 0.25)',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircleEvent: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderWidth: 1,
    borderColor: Colors.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  chatInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  chatTime: {
    color: Colors.textTertiary,
    fontSize: 11,
  },
  lastMsg: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: Colors.accentPurple,
  },
  groupBadgeText: {
    color: Colors.accentPurple,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
