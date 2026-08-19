import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText } from '../../components/AppText';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, CalendarClock, UserPlus, CheckCircle, TrendingUp, Clock, ChevronRight, Menu, Bell } from 'lucide-react-native';
import { useLeadStore } from '../../store/leadStore';
import { MetricCard } from '../../components/MetricCard';
import { useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { useSyncStore } from '../../store/syncStore';
import { Colors } from '../../theme/colors';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';

export default function Dashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { leads, followUps, deals, fetchLeads } = useLeadStore();
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { syncStatus, pendingOperations } = useSyncStore();

  useEffect(() => {
    fetchLeads(); // Fetch from store
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const totalLeads = leads.length || 0;
  
  const latestFollowUps = leads.map(lead => followUps.find(f => f.lead_id === lead.id)).filter(Boolean);
  
  const dueTodayCount = latestFollowUps.filter(f => f.next_follow_up_date === today).length || 0;
  const completedTodayCount = followUps.filter(f => f.created_at?.startsWith(today) || f.visit_date === today).length || 0;
  
  const upcomingFollowUps = latestFollowUps.filter(f => f.next_follow_up_date && f.next_follow_up_date > today).length || 0;
  
  const freshCustomers = leads.filter(l => l.customer_type === 'Fresh Lead' || l.customer_type === 'Fresh' || (l.customer_type as any) === 'Fresh ').length || 0;
  const closedDeals = deals.filter(d => d.deal_status === 'Won').length || 0;

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
          <AppText style={[styles.headerTitle, { color: theme.text }]}>POOROJ</AppText>
        </View>
        
      </View>

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
          <MetricCard title="Closed Deals" value={closedDeals} icon={CheckCircle} color="#7c3aed" onPress={() => router.push('/search?filter=closed')} />
          <MetricCard title="Total Leads" value={totalLeads} icon={Users} color={theme.primaryDark} onPress={() => router.push('/search?filter=total')} />
        </View>

        <View style={styles.recentSection}>
          <AppText style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>Recent Leads</AppText>
          {leads.length > 0 ? (
            leads.slice(0, 3).map((lead) => (
              <TouchableOpacity 
                key={lead.id} 
                style={[styles.leadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => router.push(`/lead/${lead.id}`)}
              >
                <View style={styles.leadInfo}>
                  <AppText style={[styles.leadName, { color: theme.text }]}>{lead.name}</AppText>
                  <AppText style={[styles.leadStatus, { color: theme.textSecondary }]}>{lead.status}</AppText>
                </View>
                <ChevronRight size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginTop: 4 }}>
              <Users size={32} color={theme.icon} style={{ marginBottom: 12 }} />
              <AppText style={{ fontSize: 16, color: theme.textSecondary, fontWeight: '500', marginBottom: 16 }}>No recent leads yet</AppText>
              <TouchableOpacity 
                style={{ backgroundColor: theme.primaryDark, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
                onPress={() => router.push('/lead/new')}
              >
                <AppText style={{ color: '#fff', fontWeight: '600' }}>Add Lead</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    gap: 12,
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
    padding: 8,
    marginRight: -8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
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
