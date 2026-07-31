import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { Settings, Star, Share2, Moon, Sun, User } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

export function CustomDrawerContent(props: any) {
  const { mode, toggleTheme } = useThemeStore();
  const theme = Colors[mode === 'dark' ? 'dark' : 'light'];
  
  const isDark = mode === 'dark';

  const handleRateUs = () => {
    if (Platform.OS === 'web') {
      window.alert("Thank you for your interest! Rating feature coming soon.");
    } else {
      Alert.alert("Rate Us", "Thank you for using Pooroj CRM! App Store link coming soon.");
    }
  };

  const handleShareUs = () => {
    if (Platform.OS === 'web') {
      window.alert("Share Pooroj CRM with your team! (Sharing link copied to clipboard)");
    } else {
      Alert.alert("Share Us", "Sharing functionality will be integrated with native share sheets.");
    }
  };

  const handleSettings = () => {
    if (Platform.OS === 'web') {
      window.alert("Settings page coming soon.");
    } else {
      Alert.alert("Settings", "Settings page coming soon.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Profile Header */}
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.headerGradient}
        >
          <View style={styles.profileContainer}>
            <View style={styles.avatar}>
              <User size={32} color={theme.primaryDark} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.name}>Pooroj Admin</Text>
              <Text style={styles.email}>admin@pooraj.com</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.menuContainer}>
          {/* Settings */}
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Settings size={22} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Settings</Text>
          </TouchableOpacity>

          {/* Rate Us */}
          <TouchableOpacity style={styles.menuItem} onPress={handleRateUs}>
            <Star size={22} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Rate Us</Text>
          </TouchableOpacity>

          {/* Share Us */}
          <TouchableOpacity style={styles.menuItem} onPress={handleShareUs}>
            <Share2 size={22} color={theme.textSecondary} style={styles.menuIcon} />
            <Text style={[styles.menuLabel, { color: theme.text }]}>Share Us</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Footer Theme Toggle */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.themeToggleRow}>
          <View style={styles.themeToggleLabelContainer}>
            {isDark ? (
              <Moon size={22} color={theme.textSecondary} />
            ) : (
              <Sun size={22} color={theme.textSecondary} />
            )}
            <Text style={[styles.themeToggleLabel, { color: theme.text }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
          </View>
          <Switch 
            value={isDark} 
            onValueChange={toggleTheme} 
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomRightRadius: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileText: {
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeToggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  }
});
