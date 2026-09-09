import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { Mail } from 'lucide-react-native';
import { auth } from '../config/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function VerifyEmailScreen() {
  const theme = useAppTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Auto-poll for verification status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const checkVerification = async () => {
      if (!auth.currentUser) return;
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          // If they verified, replace the route to the main app
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error reloading user:', error);
      }
    };

    // Check every 3 seconds
    interval = setInterval(checkVerification, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      Alert.alert('Email Sent', 'We have resent the verification email to ' + auth.currentUser.email);
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        Alert.alert('Hold on', 'We recently sent an email. Please check your spam folder or wait a minute before trying again.');
      } else {
        console.error('Email verification error:', error);
        Alert.alert('Error', 'Failed to send verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Mail size={48} color="#22c55e" />
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Check your email</Text>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          We sent a confirmation link to{'\n'}
          <Text style={{ fontWeight: 'bold', color: theme.text }}>{user?.email}</Text>.{'\n'}
          Tap the link to activate your account.
        </Text>

        <ActivityIndicator color="#22c55e" style={{ marginBottom: 32 }} />

        <TouchableOpacity 
          style={[styles.buttonSecondary, { borderColor: '#22c55e' }]} 
          onPress={handleResend}
          disabled={isResending}
        >
          {isResending ? (
            <ActivityIndicator color="#22c55e" />
          ) : (
            <Text style={[styles.buttonTextSecondary, { color: '#22c55e' }]}>Resend email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={[styles.logoutText, { color: '#22c55e' }]}>Back to sign in</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 32,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
