import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';

export const InAppToast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { toast, dismissToast } = useApp();
  const slideAnim = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (toast) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4200);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -140,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      dismissToast();
    });
  };

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'premium':
        return <Ionicons name="sparkles" size={20} color="#fbbf24" />;
      case 'match':
        return <Text style={{ fontSize: 18 }}>💖</Text>;
      case 'message':
        return <Ionicons name="chatbubble-ellipses" size={20} color="#60a5fa" />;
      default:
        return <Ionicons name="notifications" size={20} color="#a855f7" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 12) + 6,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (toast.onPress) toast.onPress();
          handleDismiss();
        }}
        style={styles.card}
      >
        <View style={styles.iconCircle}>{getIcon()}</View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>
        <Pressable onPress={handleDismiss} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color={Colors.textTertiary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 16, 38, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.45)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
  },
});
