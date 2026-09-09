import { useAppTheme } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableHighlight, Alert, Platform, Image, Animated, Easing, Share } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Star, Share2, Moon, Sun } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { useRouter } from 'expo-router';

const CustomThemeSwitch = ({ isDark, onToggle, activeColor }: { isDark: boolean, onToggle: () => void, activeColor: string }) => {
  const slideAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const switchWidth = 56;
  const switchHeight = 32;
  const circleSize = 26;
  const padding = 3;
  const maxTranslate = switchWidth - circleSize - padding * 2;

  const backgroundColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#cbd5e1', activeColor]
  });

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxTranslate]
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle}>
      <Animated.View style={{
        width: switchWidth,
        height: switchHeight,
        borderRadius: switchHeight / 2,
        backgroundColor,
        padding: padding,
        justifyContent: 'center',
      }}>
        <Animated.View style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: '#ffffff',
          transform: [{ translateX }],
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
        }}>
          {isDark ? (
            <Moon size={14} color={activeColor} strokeWidth={2.5} />
          ) : (
            <Sun size={14} color="#94a3b8" strokeWidth={2.5} />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { mode, toggleTheme } = useThemeStore();
  const theme = useAppTheme();

  const isDark = mode === 'dark';

  const handleRateUs = () => {
    if (Platform.OS === 'web') {
      window.alert("Thank you for your interest! Rating feature coming soon.");
    } else {
      Alert.alert("Rate Us", "Thank you for using Pooroj CRM! App Store link coming soon.");
    }
  };

  const handleShareUs = async () => {
    try {
      if (Platform.OS === 'web') {
        window.alert("Share POOROJ CRM with your team! (Sharing link copied to clipboard)");
        return;
      }
      
      const result = await Share.share({
        message: 'Check out POOROJ - Where Leads Become Deals! Download the app to manage your real estate leads efficiently: https://pooroj.com/download',
        title: 'POOROJ CRM',
        url: 'https://pooroj.com/download'
      });

      if (result.action === Share.sharedAction) {
        // Successfully shared
      } else if (result.action === Share.dismissedAction) {
        // Dismissed share sheet
      }
    } catch (error: any) {
      Alert.alert("Share Unavailable", "Sorry, sharing is currently unavailable on this device.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Minimalist Profile Header */}
        <View style={[styles.headerContainer, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.profileContainer}>
            <View style={styles.avatar}>
              <Image 
                source={require('../../assets/images/pooraj-icon.png')} 
                style={{ width: 48, height: 48 }} 
                resizeMode="contain"
              />
            </View>
            <View style={styles.profileText}>
              <AppText style={[styles.name, { color: theme.text }]}>POOROJ</AppText>
              <AppText style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={1}>Where Leads Become Deals</AppText>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          
          {/* Appearance Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              {isDark ? (
                <Moon size={22} color={theme.textSecondary} style={styles.menuIcon} />
              ) : (
                <Sun size={22} color={theme.textSecondary} style={styles.menuIcon} />
              )}
              <AppText style={[styles.menuLabel, { color: theme.text }]}>Appearance</AppText>
              <View style={{ marginLeft: 'auto' }}>
                <CustomThemeSwitch isDark={isDark} onToggle={toggleTheme} activeColor={theme.primary} />
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Share App */}
          <TouchableHighlight 
            style={styles.menuItem} 
            onPress={handleShareUs} 
            underlayColor={isDark ? '#1e293b' : '#f8fafc'}
          >
            <View style={styles.menuItemContent}>
              <Share2 size={22} color={theme.textSecondary} style={styles.menuIcon} />
              <AppText style={[styles.menuLabel, { color: theme.text }]}>Share App</AppText>
            </View>
          </TouchableHighlight>

          {/* Rate App */}
          <TouchableHighlight 
            style={styles.menuItem} 
            onPress={handleRateUs} 
            underlayColor={isDark ? '#1e293b' : '#f8fafc'}
          >
            <View style={styles.menuItemContent}>
              <Star size={22} color={theme.textSecondary} style={styles.menuIcon} />
              <AppText style={[styles.menuLabel, { color: theme.text }]}>Rate App</AppText>
            </View>
          </TouchableHighlight>

        </View>
      </DrawerContentScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileText: {
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  menuContainer: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  menuItem: {
    height: 56,
    justifyContent: 'center',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: '100%',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
    marginHorizontal: 24,
  },
  currentSettingText: {
    fontSize: 14,
  }
});
