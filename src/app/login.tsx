import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAppTheme } from '../hooks/useAppTheme';
import { Colors } from '../theme/colors';
import { useRouter } from 'expo-router';
import { performGoogleSignIn } from '../utils/googleSignIn';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const theme = useAppTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in AuthContext will handle routing
    } catch (error: any) {
      console.error(error);
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        setErrorMsg('Incorrect email or password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please try again later.');
      } else {
        setErrorMsg('Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const result = await performGoogleSignIn();

    if (result.status === 'existing_user') {
      setIsLoading(false);
      return; // Auth context detects Firebase state change and redirects
    }
    
    if (result.status === 'new_user' && result.email) {
      try {
        const allowlistRef = doc(db, 'adminAllowlist', result.email.toLowerCase().trim());
        const allowlistSnap = await getDoc(allowlistRef);
        const isAdminAllowlisted = allowlistSnap.exists();

        router.push({
          pathname: '/signup/role-selection',
          params: { 
            email: result.email.toLowerCase().trim(),
            isAdminAllowlisted: isAdminAllowlisted ? 'true' : 'false',
            googleUid: result.uid, 
            googleName: result.name 
          },
        } as any);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Could not verify account status.');
      }
      setIsLoading(false);
      return;
    }
    
    if (result.status === 'error') {
      Alert.alert('Google Sign-In Failed', result.message);
    }
    setIsLoading(false);
  };

  const isFormValid = email.trim().length > 0 && password.length > 0;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        
        <View style={styles.greetingContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to continue</Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

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
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
            <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? (
                <EyeOff size={20} color={theme.textSecondary} />
              ) : (
                <Eye size={20} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: '#f97316', opacity: isFormValid ? 1 : 0.5 }]}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          {/* Note: Google Sign-In requires extra native setup via @react-native-google-signin/google-signin.
              Adding a placeholder button to match requirements. */}
          <View style={styles.dividerContainer}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or continue with</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity onPress={handleGoogleSignIn} style={[styles.googleButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
            Use the same sign-in method every time to access your account.
          </Text>

          <View style={styles.signupContainer}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '600' }}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/signup' as any)}>
              <Text style={{ color: '#f97316', fontSize: 17, fontWeight: '800', textDecorationLine: 'underline', letterSpacing: 0.3 }}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  greetingContainer: {
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
    hintText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
});
