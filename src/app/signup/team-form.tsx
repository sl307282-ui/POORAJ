import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { createTeamMemberProfileGoogle } from '../../utils/googleSignIn';

export default function TeamMemberSignup() {
  const theme = useAppTheme();
  const router = useRouter();

  const { teamId, teamName, inviteId, googleUid, googleName, email: initialEmail } = useLocalSearchParams<any>();
  const isGoogleFlow = !!googleUid;

  const [name, setName] = useState(googleName ?? '');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isGoogleFlow && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!teamId || !inviteId) {
      Alert.alert('Error', 'Missing team or invitation info. Please try joining again.');
      return;
    }

    setIsLoading(true);
    try {
      let currentUserId = googleUid;
      if (isGoogleFlow && googleUid) {
        // Google user — already authenticated, just create Firestore profile
        await createTeamMemberProfileGoogle(googleUid, name, email, teamId);
      } else {
        // Email/password signup
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(user);

        currentUserId = user.uid;
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email: email.trim(),
          role: 'team',
          teamId,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }

      // Mark invitation as used
      if (inviteId && currentUserId) {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'invitations', inviteId), {
          status: 'used',
          usedBy: currentUserId,
          usedAt: new Date().toISOString()
        });
      }
      
      // Auth context detects Firebase state and redirects to Home
    } catch (error: any) {
      setIsLoading(false);
      if (error.code === 'auth/email-already-in-use' || error.message?.includes('already in use')) {
        router.push({ pathname: '/signup/account-exists' as any, params: { email: email.trim() } });
      } else {
        Alert.alert('Error', 'Failed to create account. Please try again later.');
      }
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Joining team:{' '}
            <Text style={{ color: '#3b82f6', fontWeight: '700' }}>{teamName}</Text>
          </Text>

          {isGoogleFlow && (
            <View style={[styles.googleBadge, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6' }]}>
              <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14 }}>
                ✓ Google account: {email}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, opacity: isGoogleFlow ? 0.7 : 1 }]}>
              <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                editable={!isGoogleFlow}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.surface, opacity: 0.7 }]}>
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email Address"
                placeholderTextColor={theme.textSecondary}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>

            {!isGoogleFlow && (
              <>
                <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
                  <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Password"
                    placeholderTextColor={theme.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword
                      ? <EyeOff size={20} color={theme.textSecondary} />
                      : <Eye size={20} color={theme.textSecondary} />}
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
                  <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#3b82f6' }]}
              onPress={handleJoin}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitButtonText}>Join Team</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  backButton: { padding: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 16 },
  googleBadge: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 24 },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  eyeIcon: { padding: 8 },
  submitButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
