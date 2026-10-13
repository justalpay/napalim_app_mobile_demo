import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Safe haptic feedback triggers with graceful fallbacks
 */
export const triggerHaptic = {
  light: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}
  },
  medium: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {}
  },
  heavy: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch {}
  },
  success: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
  },
  warning: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {}
  },
  error: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {}
  },
  selection: () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch {}
  },
};
