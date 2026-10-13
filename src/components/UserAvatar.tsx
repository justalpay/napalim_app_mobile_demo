import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { AvatarSource, MascotKey } from '../types/data';
import { MASCOTS } from '../data/mockData';
import { Colors } from '../theme/colors';

interface UserAvatarProps {
  avatar: AvatarSource | string | null;
  size?: number;
  borderGlow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  size = 44,
  borderGlow = false,
  style,
}) => {
  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: borderGlow ? 2 : 1,
    borderColor: borderGlow ? Colors.accentPurple : Colors.borderGlass,
    ...(borderGlow
      ? {
          shadowColor: Colors.accentPurple,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 6,
        }
      : {}),
  };

  if (!avatar) {
    return (
      <View style={[containerStyle, style]}>
        <Text style={{ fontSize: size * 0.45, color: Colors.textTertiary }}>👤</Text>
      </View>
    );
  }

  // Handle AvatarSource object
  if (typeof avatar === 'object') {
    if (avatar.type === 'mascot') {
      const mascot = MASCOTS.find((m) => m.key === avatar.key);
      if (mascot) {
        return (
          <View style={[containerStyle, style]}>
            <Image
              source={mascot.image}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              resizeMode="cover"
            />
          </View>
        );
      }
    } else if (avatar.type === 'custom') {
      return (
        <View style={[containerStyle, style]}>
          <Image
            source={{ uri: avatar.uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        </View>
      );
    } else if (avatar.type === 'emoji') {
      return (
        <View style={[containerStyle, style]}>
          <Text style={{ fontSize: size * 0.52 }}>{avatar.emoji}</Text>
        </View>
      );
    }
  }

  // Handle string avatar (e.g. legacy '🦊' or 'mascot:astronaut' or image uri)
  if (typeof avatar === 'string') {
    if (avatar.startsWith('mascot:')) {
      const key = avatar.replace('mascot:', '') as MascotKey;
      const mascot = MASCOTS.find((m) => m.key === key);
      if (mascot) {
        return (
          <View style={[containerStyle, style]}>
            <Image
              source={mascot.image}
              style={{ width: size, height: size, borderRadius: size / 2 }}
              resizeMode="cover"
            />
          </View>
        );
      }
    }

    if (avatar.startsWith('http') || avatar.startsWith('file:')) {
      return (
        <View style={[containerStyle, style]}>
          <Image
            source={{ uri: avatar }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        </View>
      );
    }

    // Default string emoji
    return (
      <View style={[containerStyle, style]}>
        <Text style={{ fontSize: size * 0.52 }}>{avatar}</Text>
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Text style={{ fontSize: size * 0.45 }}>👤</Text>
    </View>
  );
};
