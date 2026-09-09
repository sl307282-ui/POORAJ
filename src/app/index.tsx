import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const theme = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Auth Context handles detailed routing logic in _layout.tsx
  // This just serves as the root entry point to drop authenticated users into the tabs
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
