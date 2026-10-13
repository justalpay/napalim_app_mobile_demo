import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = Math.min(SCREEN_WIDTH - 64, 320);
const THUMB_SIZE = 50;
const MAX_DRAG = SLIDER_WIDTH - THUMB_SIZE - 8;

interface SlideToUnlockProps {
  isUnlocked: boolean;
  onToggle: (unlocked: boolean) => void;
  unlockedText?: string;
  lockedText?: string;
}

export const SlideToUnlock: React.FC<SlideToUnlockProps> = ({
  isUnlocked,
  onToggle,
  unlockedText = 'Kilidi Kapatmak İçin Kaydırın',
  lockedText = 'Keşfeti Açmak İçin Kaydırın',
}) => {
  const panX = useRef(new Animated.Value(isUnlocked ? MAX_DRAG : 0)).current;
  const isUnlockedRef = useRef(isUnlocked);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isUnlockedRef.current = isUnlocked;
    Animated.spring(panX, {
      toValue: isUnlocked ? MAX_DRAG : 0,
      friction: 7,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [isUnlocked]);

  // Shimmer pulse animation across text
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
      onPanResponderMove: (_, gesture) => {
        const startX = isUnlockedRef.current ? MAX_DRAG : 0;
        const newX = Math.max(0, Math.min(MAX_DRAG, startX + gesture.dx));
        panX.setValue(newX);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!isUnlockedRef.current) {
          // Locked -> drag right to unlock
          if (gesture.dx > MAX_DRAG * 0.55) {
            Animated.timing(panX, {
              toValue: MAX_DRAG,
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              onToggle(true);
            });
          } else {
            Animated.spring(panX, {
              toValue: 0,
              friction: 6,
              tension: 60,
              useNativeDriver: false,
            }).start();
          }
        } else {
          // Unlocked -> drag left to lock
          if (gesture.dx < -MAX_DRAG * 0.55) {
            Animated.timing(panX, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              onToggle(false);
            });
          } else {
            Animated.spring(panX, {
              toValue: MAX_DRAG,
              friction: 6,
              tension: 60,
              useNativeDriver: false,
            }).start();
          }
        }
      },
    })
  ).current;

  const textOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 0.95, 0.45],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.track, isUnlocked && styles.trackUnlocked]}>
        {/* Glowing Background Label */}
        <Animated.View style={[styles.textWrapper, { opacity: textOpacity }]}>
          <Text style={[styles.trackText, isUnlocked && styles.trackTextUnlocked]}>
            {isUnlocked ? unlockedText : lockedText}
          </Text>
        </Animated.View>

        {/* Vintage iPhone Style Glossy Metallic Thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            isUnlocked ? styles.thumbUnlocked : styles.thumbLocked,
            {
              transform: [{ translateX: panX }],
            },
          ]}
        >
          <View style={styles.thumbGlossOverlay} />
          <Ionicons
            name={
              isUnlocked
                ? 'radio'
                : 'chevron-forward'
            }
            size={22}
            color="#ffffff"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 12,
  },
  track: {
    width: SLIDER_WIDTH,
    height: THUMB_SIZE + 8,
    borderRadius: (THUMB_SIZE + 8) / 2,
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  trackUnlocked: {
    borderColor: 'rgba(34, 197, 94, 0.5)',
    backgroundColor: 'rgba(15, 30, 20, 0.85)',
    shadowColor: '#22c55e',
  },
  textWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  trackText: {
    color: '#c084fc',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  trackTextUnlocked: {
    color: '#86efac',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  thumbLocked: {
    backgroundColor: Colors.accentPurple,
    borderColor: '#d8b4fe',
    borderWidth: 1.5,
  },
  thumbUnlocked: {
    backgroundColor: Colors.accentGreen,
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
  },
  thumbGlossOverlay: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: THUMB_SIZE / 2.3,
    borderRadius: THUMB_SIZE / 4,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
});
