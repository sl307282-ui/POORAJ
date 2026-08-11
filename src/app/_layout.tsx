import 'react-native-gesture-handler';
import { useAppTheme } from '../hooks/useAppTheme';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { useThemeStore } from '../store/themeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSyncStore } from '../store/syncStore';
import { Colors } from '../theme/colors';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useEffect, useState, useCallback } from 'react';
import { registerForPushNotificationsAsync, scheduleDailyFollowUpNotification, cancelAllScheduledNotifications } from '../utils/notifications';
import { useAppFonts } from '../components/AppText';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 150,
  fade: true,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const isWeb = Platform.OS === 'web';
  const { mode } = useThemeStore();
  const pushNotifications = useSettingsStore(state => state.pushNotifications);
  const theme = useAppTheme();
  const [appIsReady, setAppIsReady] = useState(false);

  const fontsLoaded = useAppFonts();

  useEffect(() => {
    async function prepare() {
      try {
        // Enforce a minimum 2 second delay as requested
        await new Promise(resolve => setTimeout(resolve, 2000));
        await registerForPushNotificationsAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        if (fontsLoaded) {
          setAppIsReady(true);
        }
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const unsubscribe = useSyncStore.getState().initializeNetworkListener();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      if (pushNotifications) {
        scheduleDailyFollowUpNotification();
      } else {
        cancelAllScheduledNotifications();
      }
    }
  }, [pushNotifications, appIsReady]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the splash screen only AFTER the root view has completed layout
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View 
      style={[styles.outerContainer, { backgroundColor: mode === 'dark' ? '#000000' : '#f1f5f9' }]}
      onLayout={onLayoutRootView}
    >
      <View style={[styles.container, isWeb && styles.webMobileFrame, { backgroundColor: theme.surface }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        
        <Drawer 
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{ 
            headerShown: false,
            drawerType: 'front',
            drawerStyle: {
              width: isWeb ? 300 : '80%',
              backgroundColor: theme.surface,
            }
          }}
        >
          <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
        </Drawer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
  },
  webMobileFrame: {
    maxWidth: 400,
    maxHeight: 850,
    borderWidth: 8,
    borderColor: '#e2e8f0',
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    marginVertical: 20,
  }
});
