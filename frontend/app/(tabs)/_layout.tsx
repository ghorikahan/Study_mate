import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet, ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  BookOpen,
  CheckSquare,
  Calendar,
  User,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Radius } from '../../constants/theme';

interface TabIconProps {
  focused: boolean;
  color: ColorValue;
  Icon: React.FC<{ size: number; color: string; strokeWidth?: number }>;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, color, Icon }) => (
  <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
    <Icon size={22} color={color as string} strokeWidth={focused ? 2.2 : 1.8} />
  </View>
);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Uplift the tab bar significantly above Android navigation buttons / gesture pill
  // Guarantee a generous bottom clearance (minimum 28px on Android, 20px on iOS, or insets.bottom + 6)
  const bottomClearance = Math.max(
    insets.bottom > 0 ? insets.bottom + 6 : 0,
    Platform.OS === 'android' ? 28 : 20
  );
  const totalBarHeight = (Platform.OS === 'android' ? 62 : 56) + bottomClearance;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: totalBarHeight,
            paddingBottom: bottomClearance,
          },
        ],
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} Icon={Home} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} Icon={BookOpen} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} Icon={CheckSquare} />
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Exams',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} Icon={Calendar} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} Icon={User} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },
  tabItem: {
    paddingTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: 3,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  iconWrapperActive: {
    backgroundColor: Colors.primaryFaded,
  },
});
