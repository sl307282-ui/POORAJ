import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useNavigationBuilder, TabRouter, createNavigatorFactory } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '../store/themeStore';
import { useAppTheme } from '../hooks/useAppTheme';

function CustomTabNavigator({ initialRouteName, children, screenOptions, tabBarStyle, ...rest }: any) {
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder(TabRouter, {
    initialRouteName,
    children,
    screenOptions,
  });

  return (
    <NavigationContent>
      <CustomTabsUI state={state} navigation={navigation} descriptors={descriptors} />
    </NavigationContent>
  );
}

export const createCustomBottomTabNavigator = createNavigatorFactory(CustomTabNavigator);
export const CustomTabs = withLayoutContext(createCustomBottomTabNavigator().Navigator);

function CustomTabsUI({ state, navigation, descriptors }: any) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const transition = useSharedValue(state.index);
  const [loaded, setLoaded] = useState<number[]>([state.index]);
  const { mode } = useThemeStore();
  const theme = useAppTheme();

  useEffect(() => {
    // Stagger the preloading of background tabs to avoid blocking the JS thread
    // This guarantees they are ready before the user taps them, but doesn't
    // delay the initial dashboard render.
    const timers: NodeJS.Timeout[] = [];
    
    state.routes.forEach((_: any, i: number) => {
      if (i !== state.index) {
        // Stagger each background render by 200ms to keep the main thread fluid
        const timer = setTimeout(() => {
          setLoaded(prev => {
            if (prev.includes(i)) return prev;
            return [...prev, i];
          });
        }, 300 + (i * 200));
        timers.push(timer);
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [state.routes.length]); // Run when routes are initialized

  useEffect(() => {
    // If the user clicks a tab before the background timer hits it, load it immediately
    if (!loaded.includes(state.index)) {
      setLoaded(prev => [...prev, state.index]);
    }
    
    // Animate to the new index.
    // 150-180ms ease-out curve, ensuring smooth hardware accelerated slide.
    transition.value = withTiming(state.index, { 
      duration: 180, 
      easing: Easing.out(Easing.cubic) 
    });
  }, [state.index]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -transition.value * SCREEN_WIDTH }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Horizontal track of screens */}
      <Animated.View style={[styles.screensContainer, { width: SCREEN_WIDTH * state.routes.length }, animatedContainerStyle]}>
        {state.routes.map((route: any, i: number) => {
          const hasBeenLoaded = loaded.includes(i);
          return (
            <View key={route.key} style={{ width: SCREEN_WIDTH, flex: 1, backgroundColor: theme.background }}>
              {/* Keep screens mounted after first load to prevent flickering and API refetches */}
              {hasBeenLoaded ? descriptors[route.key].render() : null}
            </View>
          );
        })}
      </Animated.View>
      
      {/* Custom BlurView Bottom Tab Bar */}
      <View style={[styles.tabBar, { 
        borderTopColor: theme.border,
        backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)'
      }]}>
          <BlurView intensity={mode === 'dark' ? 50 : 80} tint={mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!event.defaultPrevented) {
                if (route.name === 'search') {
                  // Always navigate to Total Leads when Search tab is pressed
                  navigation.navigate('search', { filter: 'total', reset: Date.now() });
                } else if (!isFocused) {
                  navigation.navigate(route.name, route.params);
                }
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                {options.tabBarIcon ? options.tabBarIcon({ 
                  focused: isFocused, 
                  color: isFocused ? theme.primaryDark : theme.textSecondary, 
                  size: 24 
                }) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  screensContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    elevation: 0,
    height: 80,
  },
  tabBarInner: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
