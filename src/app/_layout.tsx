import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../theme/colors';

export default function RootLayout() {
  const isWeb = Platform.OS === 'web';
  const { mode } = useThemeStore();
  const theme = Colors[mode === 'dark' ? 'dark' : 'light'];
  
  return (
    <View style={[styles.outerContainer, { backgroundColor: mode === 'dark' ? '#000000' : '#f1f5f9' }]}>
      <View style={[styles.container, isWeb && styles.webMobileFrame, { backgroundColor: theme.surface }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Drawer 
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{ 
            headerShown: false,
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
    backgroundColor: '#f1f5f9', // Light gray background for web margins
    alignItems: 'center', 
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Pure white
    width: '100%',
  },
  webMobileFrame: {
    maxWidth: 400,
    maxHeight: 850,
    borderWidth: 8,
    borderColor: '#e2e8f0', // Slate 200 frame
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    marginVertical: 20,
  }
});
