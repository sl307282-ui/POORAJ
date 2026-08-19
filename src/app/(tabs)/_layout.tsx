import { useAppTheme } from '../../hooks/useAppTheme';
import { CustomTabs } from '../../components/CustomTabs';
import { StyleSheet, View, Platform } from 'react-native';
import { Home, Search, Calendar, User, Settings } from 'lucide-react-native';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';

export default function TabsLayout() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  return (
    <CustomTabs>
      <CustomTabs.Screen
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
      <CustomTabs.Screen
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
      <CustomTabs.Screen
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
      <CustomTabs.Screen
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
    </CustomTabs>
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
