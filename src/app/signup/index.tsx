import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { performGoogleSignIn } from '../../utils/googleSignIn';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

export default function SignupEmailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkAllowlistAndProceed = async (
    userEmail: string, 
    googleData?: { googleUid: string, googleName: string | null }
  ) => {
    setIsLoading(true);
    try {
      // First check if user already exists
      const cleanEmail = userEmail.toLowerCase().trim();
      
      try {
        const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
        if (methods && methods.length > 0) {
          router.push({ pathname: '/signup/account-exists' as any, params: { email: cleanEmail } });
          return;
        }
      } catch (authErr: any) {
        // Fallback: Query Firestore users collection (Requires Firestore Rules Update)
        try {
          const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', cleanEmail), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            router.push({ pathname: '/signup/account-exists' as any, params: { email: cleanEmail } });
            return;
          } else {
            // Query succeeded but user was not found in Firestore.
            // Let them proceed.
          }
        } catch (firestoreErr: any) {
           Alert.alert('Database Check Failed', 'Please reload the app. Error: ' + firestoreErr.message);
        }
      }

      // Check if email is in the adminAllowlist
      const allowlistRef = doc(db, 'adminAllowlist', cleanEmail);
      const allowlistSnap = await getDoc(allowlistRef);
      const isAdminAllowlisted = allowlistSnap.exists();

      router.push({
        pathname: '/signup/role-selection' as any,
        params: { 
          email: cleanEmail, 
          isAdminAllowlisted: isAdminAllowlisted ? 'true' : 'false',
          ...(googleData || {}) 
        }
      });
    } catch (error: any) {
      Alert.alert('Error', 'Could not verify email. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    checkAllowlistAndProceed(email);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await performGoogleSignIn();
    setIsLoading(false);

    if (result.status === 'cancelled') return;

    if (result.status === 'existing_user') {
      Alert.alert('Account Exists', 'This Google account already has an account. Please sign in from the login page.');
      return;
    }

    if (result.status === 'error') {
      Alert.alert('Google Sign-In Failed', result.message);
      return;
    }

    // New user with Google - check allowlist
    if (result.email) {
      await checkAllowlistAndProceed(result.email, { googleUid: result.uid, googleName: result.name });
    } else {
      Alert.alert('Error', 'Could not get email from Google.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter your email to get started
          </Text>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email address"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: '#f97316', opacity: email ? 1 : 0.5 }]}
              onPress={handleEmailContinue}
              disabled={!email || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  backButton: { padding: 4, width: 40 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  continueButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  divider: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 14, fontWeight: '500' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    height: 56,
    borderRadius: 12,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
