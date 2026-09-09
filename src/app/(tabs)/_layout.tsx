import { useAppTheme } from '../../hooks/useAppTheme';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Dimensions, Easing } from 'react-native';
import { Home, Search, Calendar, Settings } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuth } from '../../context/AuthContext';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Smooth 280ms directional slide transition spec with native Android easing
const transitionSpec = {
  animation: 'timing' as const,
  config: {
    duration: 280,
    easing: Easing.bezier(0.2, 0, 0, 1),
  },
};

// Direction-aware scene interpolator:
// - Moving to a tab on the right: slide in from right to left
// - Moving to a tab on the left: slide in from left to right
const forDirectionalSlide = ({ current }: any) => {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, -0.5, 0, 0.5, 1],
        outputRange: [0.2, 0.8, 1, 0.8, 0.2],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [SCREEN_WIDTH, 0, -SCREEN_WIDTH],
          }),
        },
      ],
    },
  };
};

export default function TabsLayout() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const { role } = useAuth();
  const dashboardMode = useSettingsStore((state) => state.dashboardMode);

  const isTeamMode = role === 'admin' && dashboardMode === 'team';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyleInterpolator: forDirectionalSlide,
        transitionSpec: transitionSpec,
        tabBarStyle: isTeamMode
          ? { display: 'none' }
          : {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTopWidth: 0,
              elevation: 0,
              height: 80,
              backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)',
            },
        tabBarBackground: isTeamMode
          ? () => null
          : () => (
              <BlurView
                intensity={mode === 'dark' ? 50 : 80}
                tint={mode === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Home color={focused ? theme.primaryDark : theme.textSecondary} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Search color={focused ? theme.primaryDark : theme.textSecondary} size={24} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('search', { filter: 'total', reset: Date.now() });
          },
        })}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Calendar color={focused ? theme.primaryDark : theme.textSecondary} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile & Settings',
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Settings color={focused ? theme.primaryDark : theme.textSecondary} size={24} />
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
