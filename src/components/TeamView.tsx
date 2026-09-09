import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserPlus, Share, Copy, Clock, X, Calendar as CalendarIcon, Phone, MapPin, CheckCircle, RefreshCw } from 'lucide-react-native';
import { AppText } from './AppText';
import * as ShareAPI from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

type DateFilter = 'Today' | 'Last 7 Days' | '15 Days' | '1 Month' | 'Custom';

export interface MemberPerformance {
  marks: number;
  leads: number;
  siteVisits: number;
  deals: number;
  followUps: number;
}

export function TeamView() {
  const theme = useAppTheme();
  const { user, userData } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [dateFilter, setDateFilter] = useState<DateFilter>('Today');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Raw data from Firestore
  const [rawMarks, setRawMarks] = useState<any[]>([]);
  const [rawLeads, setRawLeads] = useState<any[]>([]);
  const [rawDeals, setRawDeals] = useState<any[]>([]);
  const [rawFollowUps, setRawFollowUps] = useState<any[]>([]);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = userData?.role === 'admin' || members.find(m => m.id === user?.uid)?.role === 'admin';

  useEffect(() => {
    fetchTeamData();
  }, [userData]);

  // Firestore Snapshot Listeners for real data
  useEffect(() => {
    if (!members.length) return;
    const memberIds = members.map(m => m.id).filter(Boolean);
    if (memberIds.length === 0) return;

    const marksQ = query(collection(db, 'marks_log'), where('userId', 'in', memberIds));
    const leadsQ = query(collection(db, 'leads'), where('ownerUid', 'in', memberIds));
    const dealsQ = query(collection(db, 'deals'), where('ownerUid', 'in', memberIds));
    const followUpsQ = query(collection(db, 'followUps'), where('ownerUid', 'in', memberIds));

    const unsubscribeMarks = onSnapshot(marksQ, (snap) => setRawMarks(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubscribeLeads = onSnapshot(leadsQ, (snap) => setRawLeads(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubscribeDeals = onSnapshot(dealsQ, (snap) => setRawDeals(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);
    const unsubscribeFollowUps = onSnapshot(followUpsQ, (snap) => setRawFollowUps(snap.docs.map(d => ({id: d.id, ...d.data()}))), console.error);

    return () => {
      unsubscribeMarks();
      unsubscribeLeads();
      unsubscribeDeals();
      unsubscribeFollowUps();
    };
  }, [members, refreshKey]);

  const dateRange = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (dateFilter === 'Last 7 Days') {
      start.setDate(start.getDate() - 6);
    } else if (dateFilter === '15 Days') {
      start.setDate(start.getDate() - 14);
    } else if (dateFilter === '1 Month') {
      start.setMonth(start.getMonth() - 1);
    } else if (dateFilter === 'Custom') {
      const customS = new Date(customStartDate);
      customS.setHours(0, 0, 0, 0);
      const customE = new Date(customEndDate);
      customE.setHours(23, 59, 59, 999);
      return { start: customS, end: customE };
    }
    return { start, end };
  }, [dateFilter, customStartDate, customEndDate]);

  const memberStats = useMemo(() => {
    const newStats: Record<string, MemberPerformance> = {};
    members.forEach(m => {
      newStats[m.id] = { marks: 0, leads: 0, siteVisits: 0, deals: 0, followUps: 0 };
    });

    const recordedLeadIds = new Set(rawMarks.filter(m => m.activityType === 'Lead Added').map(m => m.leadId));
    const recordedDealIds = new Set(rawMarks.filter(m => m.activityType === 'Deal Completed').map(m => m.leadId));
    const recordedFollowUpTimes = new Set(rawMarks.filter(m => m.activityType === 'Follow Up').map(m => `${m.leadId}_${m.timestamp}`));
    const { start, end } = dateRange;
    const startTs = start.getTime();
    const endTs = end.getTime();

    rawMarks.forEach(data => {
      const uid = data.userId;
      if (!newStats[uid]) return;
      const ts = new Date(data.timestamp).getTime();
      if (ts >= startTs && ts <= endTs) {
        if (data.activityType === 'Lead Added') {
          newStats[uid].leads += 1;
          if (data.leadId) recordedLeadIds.add(data.leadId);
        } else if (data.activityType === 'Follow Up') {
          newStats[uid].followUps += 1;
        } else if (data.activityType === 'Site Visit') {
          newStats[uid].siteVisits += 1;
        } else if (data.activityType === 'Deal Completed') {
          newStats[uid].deals += 1;
          if (data.leadId) recordedDealIds.add(data.leadId);
        }
      }
    });

    // Cross-reference direct leads
    rawLeads.forEach(data => {
      const uid = data.ownerUid;
      if (!newStats[uid] || recordedLeadIds.has(data.id)) return;
      const ts = new Date(data.created_at).getTime();
      if (ts >= startTs && ts <= endTs) {
        newStats[uid].leads += 1;
      }
    });

    // Cross-reference direct followUps
    rawFollowUps.forEach(data => {
      const uid = data.ownerUid;
      const key = `${data.lead_id}_${data.created_at}`;
      if (!newStats[uid] || recordedFollowUpTimes.has(key)) return;
      const ts = new Date(data.created_at).getTime();
      if (ts >= startTs && ts <= endTs) {
        newStats[uid].followUps += 1;
      }
    });

    // Cross-reference direct deals
    rawDeals.forEach(data => {
      const uid = data.ownerUid;
      if (!newStats[uid] || recordedDealIds.has(data.lead_id)) return;
      const ts = new Date(data.created_at).getTime();
      if (ts >= startTs && ts <= endTs) {
        newStats[uid].deals += 1;
      }
    });

    // Compute total marks
    members.forEach(m => {
      const s = newStats[m.id];
      s.marks = (s.leads * 1) + (s.followUps * 2) + (s.siteVisits * 5) + (s.deals * 20);
    });

    return newStats;
  }, [members, rawMarks, rawLeads, rawDeals, rawFollowUps, dateRange]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const marksA = memberStats[a.id]?.marks || 0;
      const marksB = memberStats[b.id]?.marks || 0;
      if (marksB !== marksA) {
        return marksB - marksA; // Descending
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [members, memberStats]);

  const fetchTeamData = async () => {
    if (!userData?.teamId) return;
    try {
      const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
      if (teamDoc.exists()) setTeamName(teamDoc.data().name);

      const q = query(collection(db, 'users'), where('teamId', '==', userData.teamId));
      const snapshot = await getDocs(q);
      setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      const invQ = query(collection(db, 'invitations'), where('teamId', '==', userData.teamId), where('status', '==', 'pending'));
      const invSnapshot = await getDocs(invQ);
      setInvitations(invSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    // Clear raw data immediately so the UI shows it's recalculating
    setRawMarks([]);
    setRawLeads([]);
    setRawDeals([]);
    setRawFollowUps([]);
    
    setRefreshKey(k => k + 1);
    await fetchTeamData();
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for(let i=0; i<8; i++) {
      if(i===4) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateInvite = async () => {
    if (isInviting) return;
    if (members.length + invitations.length >= 6) {
      Alert.alert('Team Full', 'Member limit reached. Maximum 5 members allowed.');
      return;
    }
    
    setIsInviting(true);
    try {
      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await addDoc(collection(db, 'invitations'), {
        code, teamId: userData.teamId, teamName, createdBy: user?.uid,
        createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString(), status: 'pending'
      });
      
      setNewInviteCode(code);
      setShowInviteModal(true);
      await fetchTeamData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (invId: string) => {
    Alert.alert('Cancel Invite', 'Are you sure you want to cancel this invitation?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await updateDoc(doc(db, 'invitations', invId), { status: 'cancelled' });
          fetchTeamData();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }}
    ]);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Invitation code copied to clipboard');
  };

  const shareInvite = (code: string) => {
    ShareAPI.Share.share({
      message: `Join my team "${teamName}" on POOROJ!

Use this unique invitation code during signup: ${code}

Note: This code expires in 24 hours and can only be used once.`,
    });
  };

  if (loading && members.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const renderRankMedal = (rank: number) => {
    let bgColor = '#f1f5f9';
    let borderColor = 'transparent';
    let textColor = '#64748b';

    if (rank === 1) {
      bgColor = '#fef08a'; // Gold background
      borderColor = '#eab308'; // Gold border
      textColor = '#854d0e'; // Gold text
    } else if (rank === 2) {
      bgColor = '#e2e8f0'; // Silver background
      borderColor = '#94a3b8'; // Silver border
      textColor = '#334155'; // Silver text
    } else if (rank === 3) {
      bgColor = '#ffedd5'; // Bronze background
      borderColor = '#fdba74'; // Bronze border
      textColor = '#9a3412'; // Bronze text
    }

    return (
      <View style={[
        styles.rankBadge, 
        { 
          backgroundColor: bgColor, 
          borderColor: borderColor,
          borderWidth: rank <= 3 ? 1.5 : 0 
        }
      ]}>
        <AppText style={[styles.rankBadgeText, { color: textColor }]}>
          {rank}
        </AppText>
      </View>
    );
  };

  const isAnyActivity = sortedMembers.some(m => (memberStats[m.id]?.marks || 0) > 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Date Filter Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 }}>
            {['Today', 'Last 7 Days', '15 Days', '1 Month', 'Custom'].map((opt) => {
              const isSelected = dateFilter === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setDateFilter(opt as DateFilter)}
                  style={[
                    styles.dateFilterChip,
                    isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                >
                  {opt === 'Custom' && <CalendarIcon size={14} color={isSelected ? '#fff' : theme.text} style={{ marginRight: 6 }} />}
                  <AppText style={[
                    styles.dateFilterText,
                    isSelected && { color: '#ffffff', fontWeight: '700' }
                  ]}>
                    {opt}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {isAdmin && (
            <TouchableOpacity 
              style={[styles.refreshBtn, { marginLeft: 12, padding: 8 }]}
              onPress={handleManualRefresh}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#64748b" />
              ) : (
                <RefreshCw size={15} color="#64748b" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Date Pickers */}
        {dateFilter === 'Custom' && (
          <View style={styles.customDateContainer}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
              <AppText style={styles.dateBtnText}>{customStartDate.toLocaleDateString()}</AppText>
            </TouchableOpacity>
            <AppText style={{ marginHorizontal: 8, color: theme.textSecondary }}>to</AppText>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
              <AppText style={styles.dateBtnText}>{customEndDate.toLocaleDateString()}</AppText>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={customStartDate}
                mode="date"
                display="default"
                maximumDate={customEndDate}
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setCustomStartDate(date);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={customEndDate}
                mode="date"
                display="default"
                minimumDate={customStartDate}
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setCustomEndDate(date);
                }}
              />
            )}
          </View>
        )}

        {/* Header Row (Invite) */}
        <View style={styles.headerRow}>
          <AppText style={styles.headerTitle}>Team Leaderboard</AppText>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.inviteBtn, { backgroundColor: theme.primary }]}
              onPress={handleCreateInvite}
              disabled={isInviting}
              activeOpacity={0.8}
            >
              {isInviting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <UserPlus size={16} color="#ffffff" strokeWidth={2.5} />
                  <AppText style={{ color: '#ffffff', fontWeight: '700', marginLeft: 6, fontSize: 13 }}>Invite Member</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Leaderboard Table */}
        <View style={{ paddingHorizontal: 16 }}>
          <View>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.colRank, { justifyContent: 'center' }]}><AppText style={styles.thText}>#</AppText></View>
              <View style={[styles.colName, { justifyContent: 'center' }]}><AppText style={styles.thText}>Name</AppText></View>
              
              <View style={[styles.colStatHeader, { backgroundColor: '#fff3e0' }]}>
                <UserPlus size={15} color="#e65100" style={{ marginBottom: 2 }} />
                <AppText style={[styles.thStatPoints, { color: '#e65100' }]}>(+1)</AppText>
              </View>
              <View style={[styles.colStatHeader, { backgroundColor: '#e8f5e9' }]}>
                <Phone size={15} color="#2e7d32" style={{ marginBottom: 2 }} />
                <AppText style={[styles.thStatPoints, { color: '#2e7d32' }]}>(+2)</AppText>
              </View>
              <View style={[styles.colStatHeader, { backgroundColor: '#e3f2fd' }]}>
                <MapPin size={15} color="#1565c0" style={{ marginBottom: 2 }} />
                <AppText style={[styles.thStatPoints, { color: '#1565c0' }]}>(+5)</AppText>
              </View>
              <View style={[styles.colStatHeader, { backgroundColor: '#f3e5f5' }]}>
                <CheckCircle size={15} color="#6a1b9a" style={{ marginBottom: 2 }} />
                <AppText style={[styles.thStatPoints, { color: '#6a1b9a' }]}>(+20)</AppText>
              </View>
              <View style={[styles.colTotalHeader, { backgroundColor: '#fde047' }]}>
                <AppText style={styles.thTotalLabel}>Total</AppText>
              </View>
            </View>

            {/* Empty State */}
            {!isAnyActivity ? (
              <View style={styles.emptyState}>
                <AppText style={styles.emptyStateTitle}>No activity yet</AppText>
                <AppText style={styles.emptyStateSub}>No team activity found for this period.</AppText>
              </View>
            ) : (
              /* Table Rows */
              sortedMembers.map((m, idx) => {
                const stats = memberStats[m.id];
                const rank = idx + 1;
                return (
                  <View key={m.id} style={styles.tableRow}>
                    <View style={styles.colRank}>{renderRankMedal(rank)}</View>
                    <View style={styles.colName}>
                      <AppText style={styles.memberName} numberOfLines={1}>{m.name || 'Unknown'}</AppText>
                    </View>
                    
                    <View style={styles.colStat}>
                      <View style={[styles.statCell, { backgroundColor: '#fff3e0' }]}>
                        <AppText style={[styles.statCellText, { color: '#e65100' }]}>{stats.leads}</AppText>
                      </View>
                    </View>
                    <View style={styles.colStat}>
                      <View style={[styles.statCell, { backgroundColor: '#e8f5e9' }]}>
                        <AppText style={[styles.statCellText, { color: '#2e7d32' }]}>{stats.followUps}</AppText>
                      </View>
                    </View>
                    <View style={styles.colStat}>
                      <View style={[styles.statCell, { backgroundColor: '#e3f2fd' }]}>
                        <AppText style={[styles.statCellText, { color: '#1565c0' }]}>{stats.siteVisits}</AppText>
                      </View>
                    </View>
                    <View style={styles.colStat}>
                      <View style={[styles.statCell, { backgroundColor: '#f3e5f5' }]}>
                        <AppText style={[styles.statCellText, { color: '#6a1b9a' }]}>{stats.deals}</AppText>
                      </View>
                    </View>
                    <View style={styles.colTotal}>
                      <View style={[styles.totalStatCell, { backgroundColor: '#fde047' }]}>
                        <AppText style={styles.totalCellText}>{stats.marks}</AppText>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Pending Invites rendering below leaderboard if any exist */}
        {invitations.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
            <AppText style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Pending Invitations</AppText>
            {invitations.map(item => {
              const isExpired = new Date(item.expiresAt) < new Date();
              if (isExpired) return null;
              return (
                <View key={item.id} style={[styles.inviteCard, { borderColor: theme.border }]}>
                  <View style={[styles.avatar, { backgroundColor: '#f59e0b20', marginRight: 12 }]}>
                    <Clock size={20} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Pending Invite</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <AppText style={{ fontSize: 13, color: theme.textSecondary, fontFamily: 'monospace' }}>{item.code}</AppText>
                      <TouchableOpacity onPress={() => copyToClipboard(item.code)} style={{ marginLeft: 8 }}>
                        <Copy size={12} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleCancelInvite(item.id)} style={{ padding: 8 }}>
                    <X size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInviteModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.surface, borderRadius: 20, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <UserPlus size={32} color={theme.primary} />
            </View>
            <AppText style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 8 }}>Invite Member</AppText>
            <AppText style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 }}>
              This code can be used once to join your team.
            </AppText>
            <AppText style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your invitation code</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 24 }}>
              <AppText style={{ fontSize: 28, fontWeight: 'bold', color: theme.primary, letterSpacing: 4, fontFamily: 'monospace' }}>{newInviteCode}</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginBottom: 24 }}>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border }} onPress={() => copyToClipboard(newInviteCode)}>
                <Copy size={20} color={theme.text} />
                <AppText style={{ color: theme.text, fontWeight: '600', marginLeft: 8 }}>Copy Code</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12 }} onPress={() => shareInvite(newInviteCode)}>
                <Share size={20} color="#fff" />
                <AppText style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Share</AppText>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b15', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, width: '100%', marginBottom: 24 }}>
              <Clock size={16} color="#f59e0b" style={{ marginRight: 8 }} />
              <AppText style={{ color: '#f59e0b', fontSize: 13, fontWeight: '500' }}>Expires in 24 hours</AppText>
            </View>
            <TouchableOpacity style={{ padding: 12 }} onPress={() => setShowInviteModal(false)}>
              <AppText style={{ color: theme.textSecondary, fontWeight: '600' }}>Close</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dateFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  colRank: { width: 26, alignItems: 'center' },
  colName: { flex: 1, minWidth: 50, justifyContent: 'center' },
  colStatHeader: { 
    width: 38, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 1,
    paddingVertical: 6,
  },
  thText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  thStatLabel: {
    fontSize: 7,
    fontWeight: '700',
    marginBottom: 1,
    textAlign: 'center',
  },
  thStatPoints: {
    fontSize: 7,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  colStat: {
    width: 38,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  colTotal: {
    width: 48,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  colTotalHeader: {
    width: 48,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 1,
    paddingVertical: 8,
  },
  statCell: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  totalStatCell: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statCellText: {
    fontSize: 13,
    fontWeight: '600',
  },
  thTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#854d0e',
    textAlign: 'center',
  },
  totalCellText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 13,
    color: '#94a3b8',
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
