import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapScreen } from '../features/map/MapScreen';
import { DiscoverScreen } from '../features/discover/DiscoverScreen';
import { EventsScreen } from '../features/activities/EventsScreen';
import { ChatListScreen } from '../features/chat/ChatListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { Colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

// Perfectly Centered & Snappy Animated Tab Icon
const AnimatedTabIcon: React.FC<{
  outlineName: keyof typeof Ionicons.glyphMap;
  filledName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  activeColor: string;
}> = ({ outlineName, filledName, focused, color, activeColor }) => {
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const pillScaleX = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.14 : 1,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.spring(pillScaleX, {
        toValue: focused ? 1 : 0,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabItemWrapper}>
      {/* Top Indicator - Perfectly Centered */}
      <Animated.View
        style={[
          styles.activeTopIndicator,
          {
            backgroundColor: activeColor,
            shadowColor: activeColor,
            transform: [{ scaleX: pillScaleX }],
          },
        ]}
      />

      {/* Symmetrical Centered Background Pill */}
      <View
        style={[
          styles.iconPill,
          focused && {
            backgroundColor: activeColor + '18',
            borderColor: activeColor + '30',
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons
            name={focused ? filledName : outlineName}
            size={22}
            color={focused ? activeColor : color}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 56 + Math.max(insets.bottom, 16),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ],
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Harita',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              outlineName="location-outline"
              filledName="location"
              focused={focused}
              color={color}
              activeColor={Colors.accentPurple}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              outlineName="flame-outline"
              filledName="flame"
              focused={focused}
              color={color}
              activeColor={Colors.accentPink}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Mesajlar',
          tabBarBadge: 3,
          tabBarBadgeStyle: styles.badgeStyle,
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              outlineName="chatbubble-ellipses-outline"
              filledName="chatbubble-ellipses"
              focused={focused}
              color={color}
              activeColor={Colors.accentPurple}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{
          tabBarLabel: 'Etkinlik',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              outlineName="time-outline"
              filledName="time"
              focused={focused}
              color={color}
              activeColor={Colors.accentBlue}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              outlineName="person-outline"
              filledName="person"
              focused={focused}
              color={color}
              activeColor={Colors.accentPurple}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#07070f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tabItemWrapper: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTopIndicator: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 2.5,
    borderRadius: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  iconPill: {
    width: 38,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeStyle: {
    backgroundColor: Colors.accentRed,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    top: 2,
  },
});
