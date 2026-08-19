import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useThemeStore, Typography } from '../store/themeStore';

import { 
  useFonts as useOutfit, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold 
} from '@expo-google-fonts/inter';

export function useAppFonts() {
  const [outfitLoaded] = useOutfit({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  return outfitLoaded && interLoaded;
}

export function AppText(props: TextProps) {
  const { typography } = useThemeStore();
  
  // Try to determine if this is a heading based on standard styles
  const flattenStyle = StyleSheet.flatten(props.style || {});
  const isHeading = flattenStyle.fontSize && flattenStyle.fontSize >= 18 || flattenStyle.fontWeight === 'bold' || flattenStyle.fontWeight >= '600';
  const weight = flattenStyle.fontWeight || '400';

  let fontFamily = undefined;

  if (typography !== 'System Default') {
    // We optimized fonts for Android. Only Modern theme uses custom downloaded fonts.
    // Classic, Geometric, and Elegant fallback to system defaults or the modern fonts to save memory.
    if (typography === 'Modern' || typography !== 'System Default') {
      if (isHeading) {
        fontFamily = weight >= '700' ? 'Outfit_700Bold' : weight >= '600' ? 'Outfit_600SemiBold' : weight >= '500' ? 'Outfit_500Medium' : 'Outfit_400Regular';
      } else {
        fontFamily = weight >= '700' ? 'Inter_700Bold' : weight >= '600' ? 'Inter_600SemiBold' : weight >= '500' ? 'Inter_500Medium' : 'Inter_400Regular';
      }
    }
  }

  // If a custom font family is resolved, apply it overriding fontWeight to avoid system default bolding clashes
  const customStyle = fontFamily ? { fontFamily, fontWeight: undefined } : {};

  return <Text {...props} style={[props.style, customStyle]} />;
}
