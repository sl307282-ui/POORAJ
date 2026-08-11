import { useAppTheme, ACCENT_COLORS } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableHighlight, Switch, Alert, Platform, Image, LayoutAnimation, Animated, Easing, Share } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Star, Share2, Moon, Sun, ChevronRight, ChevronDown, Check, Palette, Type, User } from 'lucide-react-native';
import { useThemeStore, AccentColor, Typography } from '../store/themeStore';
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
  const { mode, toggleTheme, accentColor, setAccentColor, typography, setTypography } = useThemeStore();
  const theme = useAppTheme();
  
  const [isAccentColorExpanded, setIsAccentColorExpanded] = useState(false);
  const [isTypographyExpanded, setIsTypographyExpanded] = useState(false);

  const isDark = mode === 'dark';

  const toggleSection = (section: 'accentColor' | 'typography') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (section === 'accentColor') {
      setIsAccentColorExpanded(!isAccentColorExpanded);
    } else {
      setIsTypographyExpanded(!isTypographyExpanded);
    }
  };

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
        window.alert("Share POORAJ CRM with your team! (Sharing link copied to clipboard)");
        return;
      }
      
      const result = await Share.share({
        message: 'Check out POORAJ - Where Leads Become Deals! Download the app to manage your real estate leads efficiently: https://pooraj.com/download',
        title: 'POORAJ CRM',
        url: 'https://pooraj.com/download'
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

  const accentColorsList: AccentColor[] = ['Sunset', 'Ocean', 'Rose', 'Deep', 'Emerald', 'Burgundy', 'Royal', 'Amber', 'Graphite', 'Slate'];
  const typographyList: Typography[] = ['System Default', 'Modern', 'Classic', 'Geometric', 'Elegant'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.surface }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
        {/* Minimalist Profile Header */}
        <View style={[styles.headerContainer, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.profileContainer}>
            <View style={[styles.avatar, { borderColor: theme.border, borderWidth: 1 }]}>
              <Image 
                source={require('../../assets/images/pooraj-icon.png')} 
                style={{ width: '100%', height: '100%', borderRadius: 28 }} 
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileText}>
              <AppText style={[styles.name, { color: theme.text }]}>POORAJ</AppText>
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

          {/* Accent Color Section */}
          <TouchableHighlight 
            style={styles.menuItem} 
            onPress={() => toggleSection('accentColor')}
            underlayColor={isDark ? '#1e293b' : '#f8fafc'}
          >
            <View style={styles.menuItemContent}>
              <Palette size={22} color={theme.textSecondary} style={styles.menuIcon} />
              <AppText style={[styles.menuLabel, { color: theme.text }]}>Accent Color</AppText>
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.currentColorIndicator, { backgroundColor: ACCENT_COLORS[accentColor].primary }]} />
                {isAccentColorExpanded ? (
                  <ChevronDown size={20} color={theme.textSecondary} />
                ) : (
                  <ChevronRight size={20} color={theme.textSecondary} />
                )}
              </View>
            </View>
          </TouchableHighlight>
          
          {isAccentColorExpanded && (
            <View style={styles.colorGrid}>
              {accentColorsList.map((colorName) => {
                const colorObj = ACCENT_COLORS[colorName];
                const isSelected = accentColor === colorName;
                return (
                  <View key={colorName} style={styles.colorItemContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.colorCircle, 
                        { backgroundColor: colorObj.primary },
                        isSelected && [styles.selectedColorCircle, { borderColor: theme.text }]
                      ]}
                      onPress={() => setAccentColor(colorName)}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Check size={16} color="#ffffff" />}
                    </TouchableOpacity>
                    <AppText style={[styles.colorName, isSelected && { fontWeight: '600', color: theme.text }]}>
                      {colorName}
                    </AppText>
                  </View>
                );
              })}
            </View>
          )}

          {/* Typography Section */}
          <TouchableHighlight 
            style={styles.menuItem} 
            onPress={() => toggleSection('typography')}
            underlayColor={isDark ? '#1e293b' : '#f8fafc'}
          >
            <View style={styles.menuItemContent}>
              <Type size={22} color={theme.textSecondary} style={styles.menuIcon} />
              <AppText style={[styles.menuLabel, { color: theme.text }]}>Typography</AppText>
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                <AppText style={[styles.currentSettingText, { color: theme.textSecondary }]}>{typography}</AppText>
                {isTypographyExpanded ? (
                  <ChevronDown size={20} color={theme.textSecondary} style={{ marginLeft: 6 }} />
                ) : (
                  <ChevronRight size={20} color={theme.textSecondary} style={{ marginLeft: 6 }} />
                )}
              </View>
            </View>
          </TouchableHighlight>
          
          {isTypographyExpanded && (
            <View style={styles.typographyList}>
              {typographyList.map((type) => {
                const isSelected = typography === type;
                let subtitle = '';
                if (type === 'Modern') subtitle = 'Outfit / Inter';
                if (type === 'Classic') subtitle = 'Playfair / Lora';
                if (type === 'Geometric') subtitle = 'Montserrat / Open Sans';
                if (type === 'Elegant') subtitle = 'Cinzel / Lato';

                return (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.typographyRow, { borderTopColor: theme.border }]}
                    onPress={() => setTypography(type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radioCircle, { borderColor: isSelected ? theme.primary : theme.border }]}>
                      {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                    </View>
                    <View style={styles.typographyTextContainer}>
                      <AppText style={[styles.typographyText, { color: theme.text, fontWeight: isSelected ? '600' : '400' }]}>
                        {type}
                      </AppText>
                      {subtitle ? <AppText style={[styles.typographySubtitle, { color: theme.textSecondary }]}>{subtitle}</AppText> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  },
  currentColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  colorItemContainer: {
    alignItems: 'center',
    width: 56,
    marginBottom: 8,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedColorCircle: {
    borderWidth: 2,
  },
  colorName: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  typographyList: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  typographyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typographyTextContainer: {
    flex: 1,
  },
  typographyText: {
    fontSize: 14,
    marginBottom: 2,
  },
  typographySubtitle: {
    fontSize: 11,
  }
});
