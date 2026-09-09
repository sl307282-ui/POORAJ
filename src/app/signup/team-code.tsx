import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Hash } from 'lucide-react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function TeamCodeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  
  const { googleUid, googleName, email } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter an invitation code');
      return;
    }

    setIsLoading(true);
    try {
      const q = query(collection(db, 'invitations'), where('code', '==', code.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Invalid Code', 'This invitation code does not exist.');
        setIsLoading(false);
        return;
      }

      const inviteDoc = querySnapshot.docs[0];
      const inviteData = inviteDoc.data();
      
      if (inviteData.status !== 'pending') {
        Alert.alert('Invalid Code', 'This invitation code has already been used or cancelled.');
        setIsLoading(false);
        return;
      }
      
      if (new Date(inviteData.expiresAt) < new Date()) {
        Alert.alert('Expired', 'This invitation code has expired.');
        setIsLoading(false);
        return;
      }

      // Check team size limit
      const teamUsersQ = query(collection(db, 'users'), where('teamId', '==', inviteData.teamId));
      const teamUsersSnap = await getDocs(teamUsersQ);
      if (teamUsersSnap.size >= 6) {
        Alert.alert('Team Full', 'Member limit reached. Maximum 5 members allowed.');
        setIsLoading(false);
        return;
      }

      // Proceed to form with team ID, name, and invite ID
      router.push({
        pathname: '/signup/team-form',
        params: { teamId: inviteData.teamId, teamName: inviteData.teamName, inviteId: inviteDoc.id, googleUid, googleName, email }
      });
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to verify code. Please try again.');
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Join a team</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Enter the invitation code provided by your Admin.</Text>

          <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
            <Hash size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Invitation Code"
              placeholderTextColor={theme.textSecondary}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: '#3b82f6' }]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  backButton: { padding: 4 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16, marginBottom: 24 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', letterSpacing: 2 },
  submitButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
