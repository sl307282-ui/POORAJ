import 'react-native-gesture-handler';
import { useAppTheme } from '../hooks/useAppTheme';
import { Drawer } from 'expo-router/drawer';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { useThemeStore } from '../store/themeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useSyncStore } from '../store/syncStore';
import { useLeadStore } from '../store/leadStore';
import { useNotificationStore } from '../store/notificationStore';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState, useCallback } from 'react';
import { registerForPushNotificationsAsync, scheduleDailyFollowUpNotification, cancelAllScheduledNotifications } from '../utils/notifications';
import { syncAllFollowUpReminders } from '../utils/followUpReminders';
import { useAppFonts } from '../components/AppText';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { configureGoogleSignIn } from '../utils/googleSignIn';

// Configure Google Sign-In on app startup
configureGoogleSignIn();

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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  const { mode } = useThemeStore();
  const pushNotifications = useSettingsStore(state => state.pushNotifications);
  const theme = useAppTheme();
  const [appIsReady, setAppIsReady] = useState(false);
  
  const { user, role, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) {
      setAppIsReady(true);
    }
  }, [fontsLoaded]);

  // Non-blocking background initialization
  useEffect(() => {
    if (appIsReady) {
      const unsubscribe = useSyncStore.getState().initializeNetworkListener();
      
      // Register for push notifications in the background
      registerForPushNotificationsAsync().catch(() => {});
      
      if (pushNotifications) {
        scheduleDailyFollowUpNotification();
        const { leads, followUps } = useLeadStore.getState();
        syncAllFollowUpReminders(leads, followUps).catch(() => {});
      } else {
        cancelAllScheduledNotifications();
      }

      return () => unsubscribe();
    }
  }, [appIsReady, pushNotifications]);

  // Handle notification tap / deep linking when app is launched from cold start
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (lastNotificationResponse && user) {
      const data = lastNotificationResponse.notification?.request?.content?.data as any;
      if (data?.leadId) {
        // Mark in-app notification as read if we can find it
        const { notifications, markAsRead } = useNotificationStore.getState();
        const matchingNotif = notifications.find(n => n.leadId === data.leadId && n.type === 'follow_up' && !n.read);
        if (matchingNotif) {
          markAsRead(matchingNotif.id).catch(console.error);
        }
        router.push(`/lead/${data.leadId}`);
      }
    }
  }, [lastNotificationResponse, user]);

  // Handle notification tap / deep linking while app is running
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification?.request?.content?.data as any;
      if (data?.leadId) {
        // Mark in-app notification as read if we can find it
        const { notifications, markAsRead } = useNotificationStore.getState();
        const matchingNotif = notifications.find(n => n.leadId === data.leadId && n.type === 'follow_up' && !n.read);
        if (matchingNotif) {
          markAsRead(matchingNotif.id).catch(console.error);
        }
        router.push(`/lead/${data.leadId}`);
      }
    });
    return () => subscription.remove();
  }, []);

  // Auth routing logic
  useEffect(() => {
    if (authLoading || !appIsReady) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'forgot-password';
    
    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (user && role) {
      if (!user.emailVerified) {
        // If they are not verified, keep them on verify-email screen
        if ((segments[0] as string) !== 'verify-email') {
          router.replace('/verify-email' as any);
        }
      } else {
        // Both admin and team use the unified tabs now
        const seg = segments[0] as string;
        if (seg !== '(tabs)' && seg !== 'lead' && seg !== 'settings' && seg !== 'notifications') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [user, role, authLoading, appIsReady, segments]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !authLoading) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, authLoading]);

  if (!appIsReady || authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.surface }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // If not authenticated, render only the Stack with Login + Signup
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]} onLayout={onLayoutRootView}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="forgot-password" />
        </Stack>
      </View>
    );
  }

  // Google new user: authenticated in Firebase but Firestore doc not yet created.
  // Keep them on the signup stack so they can complete role selection & profile creation.
  if (user && !role) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]} onLayout={onLayoutRootView}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="login" />
          <Stack.Screen name="forgot-password" />
        </Stack>
      </View>
    );
  }



  // Default authenticated view (Team Member) - Render existing Drawer
  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]} onLayout={onLayoutRootView}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Drawer 
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{ 
          headerShown: false,
          drawerType: 'front',
          drawerStyle: {
            width: '80%',
            backgroundColor: theme.surface,
          }
        }}
      >
        <Drawer.Screen name="index" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
        <Drawer.Screen name="lead" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="settings" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="notifications" options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
        <Drawer.Screen name="verify-email" options={{ drawerItemStyle: { display: 'none' }, headerShown: false, swipeEnabled: false }} />
      </Drawer>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
