import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Award, Share, Calendar, UserPlus, Phone, MapPin, CheckCircle } from 'lucide-react-native';
import { AppText } from './AppText';
import * as ShareAPI from 'react-native';
import { MarkActivity } from '../models/types';
import DateTimePicker from '@react-native-community/datetimepicker';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const subDays = (d: Date, days: number) => { const n = new Date(d); n.setDate(n.getDate() - days); return n; };
const subMonths = (d: Date, months: number) => { const n = new Date(d); n.setMonth(n.getMonth() - months); return n; };
const formatDate = (d: Date, formatStr: string) => {
  if (formatStr === 'MMM d, yyyy') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (formatStr === 'h:mm a') {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return d.toString();
};

type PeriodFilter = 'Today' | 'Last 7 Days' | '15 Days' | '1 Month' | 'Custom Date';

interface Props {
  scope: 'personal' | 'team' | 'member';
  memberId?: string;
}

export function MarksProgress({ scope, memberId }: Props) {
  const theme = useAppTheme();
  const { user, userData } = useAuth();
  
  const [filter, setFilter] = useState<PeriodFilter>('Today');
  const [loading, setLoading] = useState(false);
  const [totalMarks, setTotalMarks] = useState(0);
  const [metrics, setMetrics] = useState({ leads: 0, followUps: 0, siteVisits: 0, closedDeals: 0 });

  const [customStart, setCustomStart] = useState<Date>(new Date());
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchMarks = async () => {
        if (!user) return;
        setLoading(true);
        try {
          let q;
          const marksRef = collection(db, 'marks_log');
          const targetUid = scope === 'member' && memberId ? memberId : user.uid;
          
          if (scope === 'team' && userData?.teamId) {
            q = query(marksRef, where('teamId', '==', userData.teamId));
          } else {
            q = query(marksRef, where('userId', '==', targetUid));
          }
          
          const snapshot = await getDocs(q);
          const allMarks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarkActivity));
          
          // Cross-reference direct Firestore collections for completeness
          try {
            const leadsRef = collection(db, 'leads');
            const leadsSnap = await getDocs(query(leadsRef, where('ownerUid', '==', targetUid)));
            const recordedLeadIds = new Set(allMarks.filter(m => m.activityType === 'Lead Added').map(m => m.leadId));
            
            leadsSnap.docs.forEach(d => {
              if (!recordedLeadIds.has(d.id)) {
                const data = d.data();
                allMarks.push({
                  id: `db_lead_${d.id}`,
                  userId: targetUid,
                  teamId: data.teamId || null,
                  leadId: d.id,
                  leadName: data.name || 'Lead',
                  activityType: 'Lead Added',
                  points: 1,
                  timestamp: data.created_at || new Date().toISOString()
                } as MarkActivity);
              }
            });

            const followUpsRef = collection(db, 'followUps');
            const followUpsSnap = await getDocs(query(followUpsRef, where('ownerUid', '==', targetUid)));
            const recordedFollowUpTimes = new Set(allMarks.filter(m => m.activityType === 'Follow Up').map(m => `${m.leadId}_${m.timestamp}`));
            
            followUpsSnap.docs.forEach(d => {
              const data = d.data();
              const key = `${data.lead_id}_${data.created_at}`;
              if (!recordedFollowUpTimes.has(key)) {
                allMarks.push({
                  id: `db_fu_${d.id}`,
                  userId: targetUid,
                  teamId: data.teamId || null,
                  leadId: data.lead_id,
                  leadName: 'Follow Up',
                  activityType: 'Follow Up',
                  points: 2,
                  timestamp: data.created_at || new Date().toISOString()
                } as MarkActivity);
              }
            });

            const dealsRef = collection(db, 'deals');
            const dealsSnap = await getDocs(query(dealsRef, where('ownerUid', '==', targetUid)));
            const recordedDealIds = new Set(allMarks.filter(m => m.activityType === 'Deal Completed').map(m => m.leadId));
            
            dealsSnap.docs.forEach(d => {
              const data = d.data();
              if (!recordedDealIds.has(data.lead_id)) {
                allMarks.push({
                  id: `db_deal_${d.id}`,
                  userId: targetUid,
                  teamId: data.teamId || null,
                  leadId: data.lead_id,
                  leadName: 'Deal',
                  activityType: 'Deal Completed',
                  points: 20,
                  timestamp: data.created_at || new Date().toISOString()
                } as MarkActivity);
              }
            });
          } catch (e) {
            // Handled gracefully if security rule restricts non-admin from querying other collections
          }

          allMarks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          const now = new Date();
          let startDate: Date;
          let endDate = endOfDay(now);

          switch (filter) {
            case 'Today':
              startDate = startOfDay(now);
              break;
            case 'Last 7 Days':
              startDate = startOfDay(subDays(now, 7));
              break;
            case '15 Days':
              startDate = startOfDay(subDays(now, 15));
              break;
            case '1 Month':
              startDate = startOfDay(subMonths(now, 1));
              break;
            case 'Custom Date': {
              const actualStart = customStart <= customEnd ? customStart : customEnd;
              const actualEnd = customStart <= customEnd ? customEnd : customStart;
              startDate = startOfDay(actualStart);
              endDate = endOfDay(actualEnd);
              break;
            }
            default:
              startDate = startOfDay(now);
          }

          const filteredMarks = allMarks.filter(mark => {
            const markDate = new Date(mark.timestamp);
            return markDate.getTime() >= startDate.getTime() && markDate.getTime() <= endDate.getTime();
          });

          if (isActive) {
            const leadsCount = filteredMarks.filter(m => m.activityType === 'Lead Added').length;
            const followUpsCount = filteredMarks.filter(m => m.activityType === 'Follow Up').length;
            const siteVisitsCount = filteredMarks.filter(m => m.activityType === 'Site Visit').length;
            const closedDealsCount = filteredMarks.filter(m => m.activityType === 'Deal Completed').length;

            const total = (leadsCount * 1) + (followUpsCount * 2) + (siteVisitsCount * 5) + (closedDealsCount * 20);

            setTotalMarks(total);
            setMetrics({
              leads: leadsCount,
              followUps: followUpsCount,
              siteVisits: siteVisitsCount,
              closedDeals: closedDealsCount,
            });
          }
        } catch (error) {
          console.error('Error fetching marks:', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchMarks();

      return () => {
        isActive = false;
      };
    }, [scope, filter, customStart, customEnd, user, memberId])
  );


  const FILTERS: PeriodFilter[] = ['Today', 'Last 7 Days', '15 Days', '1 Month', 'Custom Date'];

  const getPeriodSubtitle = () => {
    if (filter === 'Custom Date') {
      return `${formatDate(customStart, 'MMM d')} - ${formatDate(customEnd, 'MMM d')}`;
    }
    if (filter === 'Today') {
      return 'Earned today';
    }
    if (filter === 'Last 7 Days') {
      return 'Last 7 Days';
    }
    return `Last ${filter}`;
  };

  const isMember = scope === 'member';

  return (
    <View style={isMember ? styles.memberContainer : styles.container}>
      {!isMember && (
        <View style={styles.header}>
          <AppText style={[styles.title, { color: theme.text }]}>Progress</AppText>
        </View>
      )}

      {/* Filter Pills at the top */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={[styles.filterScroll, isMember && styles.memberFilterScroll]}
        contentContainerStyle={isMember ? styles.memberFilterContent : undefined}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterPill,
              isMember && styles.memberFilterPill,
              { 
                backgroundColor: filter === f ? theme.primary : theme.surface, 
                borderColor: filter === f ? theme.primary : theme.border 
              }
            ]}
            onPress={() => {
              setFilter(f);
              if (f === 'Custom Date') {
                setShowStartPicker(true);
              }
            }}
          >
            <AppText 
              style={{ 
                color: filter === f ? '#fff' : theme.textSecondary, 
                fontWeight: '600',
                fontSize: isMember ? 12 : 13,
              }}
            >
              {f}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Custom Date Range Picker */}
      {filter === 'Custom Date' && (
        <View style={[styles.customDateContainer, isMember && styles.memberCustomDateContainer]}>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => setShowStartPicker(true)}
          >
            <Calendar size={13} color={theme.primary} style={{ marginRight: 6 }} />
            <AppText style={{ color: theme.text, fontSize: 11.5, fontWeight: '500' }}>
              From: {formatDate(customStart, 'MMM d, yyyy')}
            </AppText>
          </TouchableOpacity>
          <AppText style={{ color: theme.textSecondary, fontSize: 12 }}>to</AppText>
          <TouchableOpacity 
            style={[styles.dateButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => setShowEndPicker(true)}
          >
            <Calendar size={13} color={theme.primary} style={{ marginRight: 6 }} />
            <AppText style={{ color: theme.text, fontSize: 11.5, fontWeight: '500' }}>
              To: {formatDate(customEnd, 'MMM d, yyyy')}
            </AppText>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={customStart}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (event.type !== 'dismissed' && date) {
                  setCustomStart(date);
                  if (date > customEnd) {
                    setCustomEnd(date);
                  }
                  setTimeout(() => setShowEndPicker(true), 250);
                }
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={customEnd}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (event.type !== 'dismissed' && date) {
                  setCustomEnd(date);
                }
              }}
            />
          )}
        </View>
      )}

      {/* Performance Marks & Metrics Card */}
      <View 
        style={[
          styles.marksCard, 
          { 
            backgroundColor: theme.primary + '0D', 
            borderColor: theme.primary + '25', 
            padding: isMember ? 12 : 16, 
            marginHorizontal: isMember ? 0 : 24,
            borderRadius: 12,
            borderWidth: 1,
            flexDirection: 'row', 
            alignItems: 'center' 
          }
        ]}
      >
        {loading ? (
          <View style={{ flex: 1, paddingVertical: 28, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <>
            {/* Left Side: Total Marks */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingRight: 8 }}>
              <Award size={isMember ? 30 : 34} color={theme.primary} style={{ marginBottom: 4 }} />
              <AppText style={{ fontSize: isMember ? 28 : 32, fontWeight: '800', color: theme.text }}>
                {totalMarks}
              </AppText>
              <AppText style={{ fontSize: 13, fontWeight: '700', color: theme.primary, marginTop: 1 }}>
                Marks
              </AppText>
              <AppText style={{ fontSize: 10.5, color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
                {getPeriodSubtitle()}
              </AppText>
            </View>

            {/* Vertical Divider */}
            <View style={{ width: 1, height: '80%', backgroundColor: theme.primary + '25' }} />

            {/* Right Side: 1x1 Vertical Grid with Mark Rules */}
            <View style={{ flex: 1.6, paddingLeft: 12, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ backgroundColor: theme.primary + '15', padding: 4, borderRadius: 6, marginRight: 8 }}>
                  <UserPlus size={13} color={theme.primary} />
                </View>
                <AppText style={{ fontSize: 14, fontWeight: '800', color: theme.text, marginRight: 6 }}>
                  {metrics.leads}
                </AppText>
                <AppText style={{ fontSize: 11.5, color: theme.textSecondary, fontWeight: '600' }}>
                  Leads Added (+1)
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ backgroundColor: '#d9770615', padding: 4, borderRadius: 6, marginRight: 8 }}>
                  <Phone size={13} color="#d97706" />
                </View>
                <AppText style={{ fontSize: 14, fontWeight: '800', color: theme.text, marginRight: 6 }}>
                  {metrics.followUps}
                </AppText>
                <AppText style={{ fontSize: 11.5, color: theme.textSecondary, fontWeight: '600' }}>
                  Follow-ups (+2)
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ backgroundColor: '#05966915', padding: 4, borderRadius: 6, marginRight: 8 }}>
                  <MapPin size={13} color="#059669" />
                </View>
                <AppText style={{ fontSize: 14, fontWeight: '800', color: theme.text, marginRight: 6 }}>
                  {metrics.siteVisits}
                </AppText>
                <AppText style={{ fontSize: 11.5, color: theme.textSecondary, fontWeight: '600' }}>
                  Site Visits (+5)
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#7c3aed15', padding: 4, borderRadius: 6, marginRight: 8 }}>
                  <CheckCircle size={13} color="#7c3aed" />
                </View>
                <AppText style={{ fontSize: 14, fontWeight: '800', color: theme.text, marginRight: 6 }}>
                  {metrics.closedDeals}
                </AppText>
                <AppText style={{ fontSize: 11.5, color: theme.textSecondary, fontWeight: '600' }}>
                  Deals Completed (+20)
                </AppText>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  memberContainer: {
    paddingVertical: 12,
  },
  memberFilterScroll: {
    paddingLeft: 0,
    marginBottom: 12,
  },
  memberFilterContent: {
    paddingHorizontal: 0,
  },
  memberFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  memberCustomDateContainer: {
    marginHorizontal: 0,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  marksCard: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  marksValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  marksLabel: {
    fontSize: 14,
  },
  filterScroll: {
    paddingLeft: 24,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  breakdownContainer: {
    paddingHorizontal: 24,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  pointsText: {
    fontWeight: '700',
    fontSize: 14,
  },
  logType: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  logLead: {
    fontSize: 12,
  },
  logTime: {
    fontSize: 12,
  },
});
