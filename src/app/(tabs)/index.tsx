import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import { AppText } from '../../components/AppText';
import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, CalendarClock, UserPlus, CheckCircle, TrendingUp, Clock, ChevronRight, Menu, Bell, LogOut } from 'lucide-react-native';
import { useLeadStore } from '../../store/leadStore';
import { MetricCard } from '../../components/MetricCard';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSyncStore } from '../../store/syncStore';
import { Colors } from '../../theme/colors';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { TeamView } from '../../components/TeamView';
import { MarksProgress } from '../../components/MarksProgress';
import { useNotificationStore } from '../../store/notificationStore';

export default function Dashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { leads, followUps, deals, fetchLeads } = useLeadStore();
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const { user, role, logout, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const { syncStatus, pendingOperations } = useSyncStore();
  const { dashboardMode, setDashboardMode } = useSettingsStore();
  const { unreadCount, subscribeToNotifications, syncDueReminders } = useNotificationStore();

  const activeTab = role === 'admin' ? dashboardMode : 'personal';
  const [adminTeamName, setAdminTeamName] = React.useState('My Team');

  React.useLayoutEffect(() => {
    const isTeamMode = role === 'admin' && activeTab === 'team';
    navigation.setOptions({
      tabBarStyle: isTeamMode
        ? { display: 'none' }
        : {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopWidth: 0,
            elevation: 0,
            height: 80,
            backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.75)',
          },
    });
  }, [navigation, role, activeTab, mode]);

  React.useEffect(() => {
    if (role === 'admin' && userData?.teamId) {
      import('firebase/firestore').then(({ doc, getDoc }) => {
        import('../../config/firebase').then(({ db }) => {
          getDoc(doc(db, 'teams', userData.teamId)).then((snap) => {
            if (snap.exists()) setAdminTeamName(snap.data().name);
          });
        });
      });
    }
  }, [role, userData]);

  
  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign out', 
        style: 'destructive',
        onPress: () => {
          logout().then(() => {
            useLeadStore.getState().clearData();
          });
        }
      }
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeads();
    }, [user])
  );

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToNotifications(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid && leads.length > 0) {
      syncDueReminders(leads, followUps, user.uid);
    }
  }, [user?.uid, leads, followUps]);

  const { dueTodayCount, completedTodayCount, upcomingFollowUps, freshCustomers, closedDeals, totalLeads } = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const total = leads.length;

    // Fast O(1) map for lead follow-ups
    const followUpByLead = new Map();
    for (let i = 0; i < followUps.length; i++) {
      const f = followUps[i];
      if (!followUpByLead.has(f.lead_id)) {
        followUpByLead.set(f.lead_id, f);
      }
    }

    let completedToday = 0;
    let dueToday = 0;
    let upcoming = 0;
    let fresh = 0;
    let wonDeals = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const isDealClosed = lead.status === 'Deal Closed' || deals.some(d => d.lead_id === lead.id && d.deal_status === 'Won');
      
      if (isDealClosed) {
        wonDeals++;
      }

      const custType = lead.customer_type as any;
      if (custType === 'Fresh Lead' || custType === 'Fresh' || custType?.trim() === 'Fresh') {
        fresh++;
      }
      
      if (!isDealClosed) {
        const f = followUpByLead.get(lead.id);
        if (f && f.next_follow_up_date) {
          if (f.next_follow_up_date === today) {
            dueToday++;
          } else if (f.next_follow_up_date > today) {
            upcoming++;
          }
        }
      }

      const hasCompletedToday = followUps.some(f => 
        f.lead_id === lead.id && 
        (f.created_at?.startsWith(today) || f.visit_date === today) && 
        !f.is_initial &&
        !f.comment?.startsWith('Deal Completed')
      );
      if (hasCompletedToday) {
        completedToday++;
      }
    }

    return {
      dueTodayCount: dueToday,
      completedTodayCount: completedToday,
      upcomingFollowUps: upcoming,
      freshCustomers: fresh,
      closedDeals: wonDeals,
      totalLeads: total,
    };
  }, [leads, followUps, deals]);

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => (navigation as any).openDrawer()}
        >
          <Menu size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText style={[styles.headerTitle, { color: theme.text }]}>
            {role === 'admin' ? adminTeamName : (userData?.name || 'My Dashboard')}
          </AppText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton} 
            onPress={() => router.push('/notifications' as any)}
            activeOpacity={0.7}
          >
            <Bell size={24} color={theme.text} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { borderColor: theme.surface }]}>
                <AppText style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 6 }} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Admin Toggle: Personal | Team */}
      {role === 'admin' && (
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <View style={[styles.toggleContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.toggleButton, activeTab === 'personal' && { backgroundColor: theme.primary }]}
              onPress={() => setDashboardMode('personal')}
            >
              <AppText style={{ color: activeTab === 'personal' ? '#fff' : theme.textSecondary, fontWeight: '600' }}>
                Personal
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, activeTab === 'team' && { backgroundColor: theme.primary }]}
              onPress={() => setDashboardMode('team')}
            >
              <AppText style={{ color: activeTab === 'team' ? '#fff' : theme.textSecondary, fontWeight: '600' }}>
                Team
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'team' && role === 'admin' ? (
        <TeamView />
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollY.setValue(e.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
        >
          <LinearGradient
            colors={[mode === 'dark' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.08)', 'transparent']}
            style={styles.headerGradient}
          />

          <View style={styles.metricsGrid}>
            <AppText style={[styles.sectionTitle, { color: theme.text, width: '100%', marginBottom: 12, marginTop: 0 }]}>Today's Tasks</AppText>
            <MetricCard title="Follow-ups Due Today" value={dueTodayCount} icon={CalendarClock} color="#d97706" onPress={() => router.push('/search?filter=today')} />
            <MetricCard title="Follow-ups Completed Today" value={completedTodayCount} icon={CheckCircle} color="#10b981" onPress={() => router.push('/search?filter=completed')} />
            
            <AppText style={[styles.sectionTitle, { color: theme.text, width: '100%', marginBottom: 12, marginTop: 8 }]}>Overview</AppText>
            <MetricCard title="Upcoming Follow-ups" value={upcomingFollowUps} icon={CalendarClock} color={theme.primary} onPress={() => router.push('/search?filter=upcoming')} />
            <MetricCard title="Fresh Customers" value={freshCustomers} icon={UserPlus} color="#059669" onPress={() => router.push('/search?filter=fresh')} />
            <MetricCard title="Deals Completed" value={closedDeals} icon={CheckCircle} color="#7c3aed" onPress={() => router.push('/search?filter=closed')} />
            <MetricCard title="Total Leads" value={totalLeads} icon={Users} color={theme.primaryDark} onPress={() => router.push('/search?filter=total')} />
          </View>
          
          <MarksProgress scope="personal" />
        </ScrollView>
      )}

      {activeTab === 'personal' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/lead/new')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.fabGradient}
          >
            <UserPlus size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  headerGradient: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 300,
    borderRadius: 150,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  menuButton: {
    padding: 4,
  },
  notificationButton: {
    padding: 6,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    zIndex: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  leadCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  leadStatus: {
    fontSize: 14,
    color: '#0284c7', // Sky 600
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
