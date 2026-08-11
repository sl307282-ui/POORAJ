import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useThemeStore, Typography } from '../store/themeStore';

import { 
  useFonts as useOutfit, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold 
} from '@expo-google-fonts/outfit';
import { 
  useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold 
} from '@expo-google-fonts/inter';
import { 
  useFonts as usePlayfair, PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { 
  useFonts as useLora, Lora_400Regular, Lora_500Medium, Lora_600SemiBold, Lora_700Bold 
} from '@expo-google-fonts/lora';
import { 
  useFonts as useMontserrat, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold 
} from '@expo-google-fonts/montserrat';
import { 
  useFonts as useOpenSans, OpenSans_400Regular, OpenSans_500Medium, OpenSans_600SemiBold, OpenSans_700Bold 
} from '@expo-google-fonts/open-sans';
import { 
  useFonts as useCinzel, Cinzel_400Regular, Cinzel_500Medium, Cinzel_600SemiBold, Cinzel_700Bold 
} from '@expo-google-fonts/cinzel';
import { 
  useFonts as useLato, Lato_400Regular, Lato_700Bold 
} from '@expo-google-fonts/lato';

export function useAppFonts() {
  const [outfitLoaded] = useOutfit({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });
  const [loraLoaded] = useLora({ Lora_400Regular, Lora_500Medium, Lora_600SemiBold, Lora_700Bold });
  const [montserratLoaded] = useMontserrat({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold });
  const [openSansLoaded] = useOpenSans({ OpenSans_400Regular, OpenSans_500Medium, OpenSans_600SemiBold, OpenSans_700Bold });
  const [cinzelLoaded] = useCinzel({ Cinzel_400Regular, Cinzel_500Medium, Cinzel_600SemiBold, Cinzel_700Bold });
  const [latoLoaded] = useLato({ Lato_400Regular, Lato_700Bold });

  return outfitLoaded && interLoaded && playfairLoaded && loraLoaded && montserratLoaded && openSansLoaded && cinzelLoaded && latoLoaded;
}

export function AppText(props: TextProps) {
  const { typography } = useThemeStore();
  
  // Try to determine if this is a heading based on standard styles
  const flattenStyle = StyleSheet.flatten(props.style || {});
  const isHeading = flattenStyle.fontSize && flattenStyle.fontSize >= 18 || flattenStyle.fontWeight === 'bold' || flattenStyle.fontWeight >= '600';
  const weight = flattenStyle.fontWeight || '400';

  let fontFamily = undefined;

  if (typography !== 'System Default') {
    if (typography === 'Modern') {
      if (isHeading) {
        fontFamily = weight >= '700' ? 'Outfit_700Bold' : weight >= '600' ? 'Outfit_600SemiBold' : weight >= '500' ? 'Outfit_500Medium' : 'Outfit_400Regular';
      } else {
        fontFamily = weight >= '700' ? 'Inter_700Bold' : weight >= '600' ? 'Inter_600SemiBold' : weight >= '500' ? 'Inter_500Medium' : 'Inter_400Regular';
      }
    } else if (typography === 'Classic') {
      if (isHeading) {
        fontFamily = weight >= '700' ? 'PlayfairDisplay_700Bold' : weight >= '600' ? 'PlayfairDisplay_600SemiBold' : weight >= '500' ? 'PlayfairDisplay_500Medium' : 'PlayfairDisplay_400Regular';
      } else {
        fontFamily = weight >= '700' ? 'Lora_700Bold' : weight >= '600' ? 'Lora_600SemiBold' : weight >= '500' ? 'Lora_500Medium' : 'Lora_400Regular';
      }
    } else if (typography === 'Geometric') {
      if (isHeading) {
        fontFamily = weight >= '700' ? 'Montserrat_700Bold' : weight >= '600' ? 'Montserrat_600SemiBold' : weight >= '500' ? 'Montserrat_500Medium' : 'Montserrat_400Regular';
      } else {
        fontFamily = weight >= '700' ? 'OpenSans_700Bold' : weight >= '600' ? 'OpenSans_600SemiBold' : weight >= '500' ? 'OpenSans_500Medium' : 'OpenSans_400Regular';
      }
    } else if (typography === 'Elegant') {
      if (isHeading) {
        fontFamily = weight >= '700' ? 'Cinzel_700Bold' : weight >= '600' ? 'Cinzel_600SemiBold' : weight >= '500' ? 'Cinzel_500Medium' : 'Cinzel_400Regular';
      } else {
        fontFamily = weight >= '700' || weight >= '600' ? 'Lato_700Bold' : 'Lato_400Regular';
      }
    }
  }

  // If a custom font family is resolved, apply it overriding fontWeight to avoid system default bolding clashes
  const customStyle = fontFamily ? { fontFamily, fontWeight: undefined } : {};

  return <Text {...props} style={[props.style, customStyle]} />;
}
