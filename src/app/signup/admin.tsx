import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Building, Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { createAdminProfileGoogle } from '../../utils/googleSignIn';

export default function AdminSignup() {
  const theme = useAppTheme();
  const router = useRouter();

  const { email: initialEmail, googleUid, googleName } = useLocalSearchParams<{
    email?: string; googleUid?: string; googleName?: string;
  }>();
  const isGoogleFlow = !!googleUid;

  const [name, setName] = useState((googleName as string) ?? '');
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState((initialEmail as string) ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateInviteCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreate = async () => {
    if (!name || !teamName || !email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isGoogleFlow && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      if (isGoogleFlow && googleUid) {
        // Google user — just create Firestore profile (already authenticated)
        await createAdminProfileGoogle(googleUid as string, name, email, teamName);
      } else {
        // Email/password signup
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(user);
        
        const inviteCode = generateInviteCode();
        const teamId = `team_${user.uid}`;
        await setDoc(doc(db, 'teams', teamId), {
          name: teamName,
          adminUid: user.uid,
          inviteCode,
          createdAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email: email.trim(),
          role: 'admin',
          teamId,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      }
      // Auth context detects Firebase state and redirects to Admin Dashboard
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
          <Text style={[styles.title, { color: theme.text }]}>Create your team</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Set up your admin account and team workspace
          </Text>

          {isGoogleFlow && (
            <View style={[styles.googleBadge, { backgroundColor: 'rgba(249,115,22,0.1)', borderColor: '#f97316' }]}>
              <Text style={{ color: '#f97316', fontWeight: '600', fontSize: 14 }}>
                ✓ Google account: {email}
              </Text>
            </View>
          )}

          <View style={styles.form}>
            {/* Name — read-only if Google */}
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, opacity: isGoogleFlow ? 0.7 : 1 }]}>
              <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Your Name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                editable={!isGoogleFlow}
              />
            </View>

            {/* Team Name */}
            <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
              <Building size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Company / Team Name"
                placeholderTextColor={theme.textSecondary}
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>

            {/* Email — locked in from previous screen */}
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

            {/* Password fields — only for email signup */}
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
              style={[styles.submitButton, { backgroundColor: '#f97316' }]}
              onPress={handleCreate}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitButtonText}>Create Account</Text>}
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
