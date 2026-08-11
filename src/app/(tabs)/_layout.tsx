import { useAppTheme } from '../../hooks/useAppTheme';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform } from 'react-native';
import { Home, Search, Calendar, User, Settings } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';

export default function TabsLayout() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 100 }
        },
        tabBarStyle: [styles.tabBar, { 
          borderTopColor: theme.border,
          backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'
        }],
        tabBarBackground: () => (
          Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]} />
          ) : (
            <BlurView intensity={mode === 'dark' ? 50 : 80} tint={mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          )
        ),
        tabBarActiveTintColor: theme.primaryDark,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Home color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Search color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Calendar color={color} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile & Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Settings color={color} size={24} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopColor: 'transparent',
    elevation: 0,
    height: 80,
    paddingTop: 10,
  },
  iconActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.1)', // Light blue background
    padding: 10,
    borderRadius: 20,
  },
  iconInactive: {
    padding: 10,
  },
});
