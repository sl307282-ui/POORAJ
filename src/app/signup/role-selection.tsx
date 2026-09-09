import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Crown, User, ChevronLeft } from 'lucide-react-native';

export default function RoleSelectionScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  
  const { 
    email, 
    isAdminAllowlisted, 
    googleUid, 
    googleName 
  } = useLocalSearchParams<{
    email: string;
    isAdminAllowlisted: string;
    googleUid?: string;
    googleName?: string;
  }>();

  const handleRoleSelect = (role: 'admin' | 'team') => {
    if (role === 'admin') {
      router.push({
        pathname: '/signup/admin',
        params: { email, googleUid, googleName }
      });
    } else {
      router.push({
        pathname: '/signup/team-code',
        params: { email, googleUid, googleName }
      });
    }
  };

  const showAdmin = isAdminAllowlisted === 'true';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Choose your role</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {showAdmin 
            ? 'Since your email is authorized, you can create a new team or join an existing one.'
            : 'Join an existing team to get started.'}
        </Text>

        <View style={styles.googleBadge}>
          <Text style={styles.googleBadgeText}>
            Continuing as: {email}
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Admin Card - Only visible if allowlisted */}
          {showAdmin && (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => handleRoleSelect('admin')}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                <Crown size={28} color="#f97316" />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>👑 Continue as Admin</Text>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                  Create and manage your own team
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Team Member Card - Always visible */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => handleRoleSelect('team')}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <User size={28} color="#3b82f6" />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>👤 Continue as Member</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                Join a team with an invitation code
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  backButton: { padding: 4, width: 40 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  googleBadge: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  googleBadgeText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
  cardsContainer: { gap: 16 },
  card: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 14, lineHeight: 20 },
});
