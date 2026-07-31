import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Animated, Platform } from 'react-native';
import { Users, CalendarClock, UserPlus, CheckCircle, TrendingUp, Clock, ChevronRight, Menu, Bell } from 'lucide-react-native';
import { useLeadStore } from '../../store/leadStore';
import { MetricCard } from '../../components/MetricCard';
import { useRouter, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';

export default function Dashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { leads, followUps, deals, fetchLeads } = useLeadStore();
  const { mode } = useThemeStore();
  const theme = Colors[mode === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    fetchLeads(); // Fetch from store (currently dummy data)
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const totalLeads = leads.length || 0;
  
  const latestFollowUps = leads.map(lead => followUps.find(f => f.lead_id === lead.id)).filter(Boolean);
  
  const todayFollowUps = latestFollowUps.filter(f => f.next_follow_up_date === today).length || 0;
  const upcomingFollowUps = latestFollowUps.filter(f => f.next_follow_up_date && f.next_follow_up_date > today).length || 0;
  const pendingFollowUps = latestFollowUps.filter(f => f.next_follow_up_date && f.next_follow_up_date < today).length || 0;
  
  const freshCustomers = leads.filter(l => l.status === 'Fresh').length || 0;
  const closedDeals = deals.filter(d => d.deal_status === 'Won').length || 0;

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.stickyHeader, { borderBottomColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surface, opacity: headerBackgroundOpacity }]} />
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => (navigation as any).openDrawer()}
            >
              <Menu size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.brandTitle, { color: theme.text }]}>Pooroj</Text>
          </View>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={22} color={theme.text} />
            <View style={[styles.notificationBadge, { borderColor: theme.background }]} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: Platform.OS !== 'web' }
        )}
        scrollEventThrottle={16}
      >
        <LinearGradient
          colors={[mode === 'dark' ? 'rgba(2, 132, 199, 0.15)' : 'rgba(2, 132, 199, 0.08)', 'transparent']}
          style={styles.headerGradient}
        />

        <View style={styles.metricsGrid}>
          <MetricCard title="Today's Follow-ups" value={todayFollowUps} icon={CalendarClock} color="#d97706" onPress={() => router.push('/search?filter=today')} />
          <MetricCard title="Pending Follow-ups" value={pendingFollowUps} icon={Clock} color="#dc2626" onPress={() => router.push('/search?filter=pending')} />
          <MetricCard title="Upcoming Follow-ups" value={upcomingFollowUps} icon={CalendarClock} color="#0ea5e9" onPress={() => router.push('/search?filter=upcoming')} />
          <MetricCard title="Fresh Customers" value={freshCustomers} icon={UserPlus} color="#059669" onPress={() => router.push('/search?filter=fresh')} />
          <MetricCard title="Closed Deals" value={closedDeals} icon={CheckCircle} color="#7c3aed" onPress={() => router.push('/search?filter=closed')} />
          <MetricCard title="Total Leads" value={totalLeads} icon={Users} color="#0284c7" onPress={() => router.push('/search?filter=total')} />
        </View>

        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Leads</Text>
          {leads.slice(0, 3).map((lead) => (
            <TouchableOpacity 
              key={lead.id} 
              style={[styles.leadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => router.push(`/lead/${lead.id}`)}
            >
              <View style={styles.leadInfo}>
                <Text style={[styles.leadName, { color: theme.text }]}>{lead.name}</Text>
                <Text style={[styles.leadStatus, { color: theme.textSecondary }]}>{lead.status}</Text>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/lead/new')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#0ea5e9', '#0284c7']}
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
    backgroundColor: '#ffffff',
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
    paddingTop: 80,
    paddingBottom: 120,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginLeft: 4,
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
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a', // Slate 900
    marginBottom: 16,
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0', // Slate 200
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
    color: '#0f172a', // Slate 900
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
