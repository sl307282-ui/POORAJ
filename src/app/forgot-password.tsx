import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function ForgotPasswordScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // A basic email regex to enable the button
  const isValidEmail = email.trim().length > 5 && email.includes('@') && email.includes('.');

  const handleSendLink = async () => {
    if (!isValidEmail) return;

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setIsSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {isSent ? (
            <View style={styles.successContainer}>
              <View style={styles.iconContainer}>
                <Mail size={80} color="#f97316" />
              </View>
              
              <Text style={[styles.title, { color: theme.text, textAlign: 'center', marginBottom: 12 }]}>
                Check your email
              </Text>
              
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                If an account exists for <Text style={{ fontWeight: 'bold', color: theme.text }}>{email}</Text>, 
                we've sent a password reset link.
              </Text>

              <TouchableOpacity 
                style={styles.backButtonOnly}
                onPress={() => router.replace('/login')}
              >
                <Text style={[styles.backToSignInText, { color: '#f97316' }]}>Back to sign in</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Reset your password</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter your email and we'll send a reset link.
              </Text>

              <View style={styles.form}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity 
                  style={[
                    styles.submitButton, 
                    { 
                      backgroundColor: '#f97316', 
                      opacity: isValidEmail ? 1 : 0.5 
                    }
                  ]}
                  onPress={handleSendLink}
                  disabled={!isValidEmail || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send reset link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.backButtonContainer} 
                  onPress={() => router.replace('/login')}
                >
                  <Text style={[styles.backText, { color: theme.textSecondary }]}>
                    Back to <Text style={{ color: '#f97316', fontWeight: '600' }}>sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 40 
  },
  form: { 
    gap: 16 
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: -8,
    marginLeft: 4,
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 56, 
    borderRadius: 8, 
    paddingHorizontal: 16 
  },
  input: { 
    flex: 1, 
    fontSize: 16 
  },
  submitButton: { 
    height: 56, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8 
  },
  submitButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  backButtonContainer: {
    alignItems: 'center',
    marginTop: 24,
    padding: 8,
  },
  backText: {
    fontSize: 15,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  backButtonOnly: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backToSignInText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
