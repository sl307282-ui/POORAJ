import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { User } from 'lucide-react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function AccountExistsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { borderColor: '#f97316' }]}>
            <User size={60} color="#f97316" />
          </View>
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>
          You already have an account
        </Text>
        
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          <Text style={{ fontWeight: 'bold' }}>{email || 'This email'}</Text> is already registered.
          {"\n"}Sign in instead — and if you've forgotten your password, you can reset it from there.
        </Text>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#f97316' }]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>Sign in instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
