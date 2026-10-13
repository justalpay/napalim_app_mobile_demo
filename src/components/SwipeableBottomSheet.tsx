import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
  TouchableWithoutFeedback,
  Dimensions,
  StyleProp,
  ViewStyle,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  backdropStyle?: StyleProp<ViewStyle>;
  avoidKeyboard?: boolean;
}

export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  visible,
  onClose,
  children,
  contentStyle,
  backdropStyle,
  avoidKeyboard,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only trigger downward drag
        return gesture.dy > 3;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 55 || gesture.vy > 0.35) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  const sheetContent = (
    <View style={styles.modalRoot}>
      {/* Backdrop Tappable */}
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity }, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Animated Sheet Card */}
      <Animated.View
        style={[
          styles.sheetContainer,
          contentStyle,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Top Drag Handle Bar that responds to Pan gestures */}
        <View {...panResponder.panHandlers} style={styles.handleHitZone}>
          <View style={styles.dragHandle} />
        </View>

        {children}
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {sheetContent}
        </KeyboardAvoidingView>
      ) : (
        sheetContent
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 5, 12, 0.78)',
  },
  sheetContainer: {
    backgroundColor: '#120f24',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  handleHitZone: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 46,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 3,
  },
});
