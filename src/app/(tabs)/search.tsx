import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText } from '../../components/AppText';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, Filter, ChevronRight, User, Phone, MessageCircle, Edit3, X, Calendar as CalendarIcon, Check, Lock, Square, CheckSquare } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLeadStore } from '../../store/leadStore';
import { callNumber, openWhatsApp } from '../../utils/deepLinks';
import { useSettingsStore } from '../../store/settingsStore';
import { CalendarList } from 'react-native-calendars';
import { LeadStatus } from '../../models/types';
import { FollowUpDatePicker } from '../../components/FollowUpDatePicker';

export default function SearchScreen() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams();
  const filterParam = params.filter as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const { leads, followUps, deals, updateLeadStatus, addFollowUp, addDeal } = useLeadStore();
  const insets = useSafeAreaInsets();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCustomerType, setFilterCustomerType] = useState<string | null>(null);
  const [filterDateAdded, setFilterDateAdded] = useState<string | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkQueueModal, setShowBulkQueueModal] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);

  const toggleSelection = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const { whatsappMethod, whatsappApiUrl, whatsappApiToken } = useSettingsStore();
  const [showApiQueueModal, setShowApiQueueModal] = useState(false);
  const [apiIsSending, setApiIsSending] = useState(false);

  const handleWhatsAppAction = () => {
    if (selectedLeads.length === 0) return;

    if (whatsappMethod === 'API') {
      setShowApiQueueModal(true);
    } else {
      if (selectedLeads.length === 1) {
        const lead = leads.find(l => l.id === selectedLeads[0]);
        if (lead) {
          openWhatsApp(lead.mobile, bulkMessage);
        }
      } else if (selectedLeads.length > 1) {
        setQueueIndex(0);
        setShowBulkQueueModal(true);
      }
    }
  };
  const [bulkMessage, setBulkMessage] = useState("Hello, this is Pooroj CRM following up on your property inquiry.");

  const processQueueNext = () => {
    if (queueIndex < selectedLeads.length) {
      const lead = leads.find(l => l.id === selectedLeads[queueIndex]);
      if (lead) {
        openWhatsApp(lead.mobile, bulkMessage);
      }
      setQueueIndex(queueIndex + 1);
    }
  };

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateResults = [
    'Interested',
    'Not Interested',
    'Call Later',
    'No Answer',
    'Meeting Scheduled',
    'Deal Closed'
  ];

  let displayedLeads = leads;
  let screenTitle = 'Total Leads';

  const today = new Date().toISOString().split('T')[0];

  const getLatestFollowUp = (leadId: string) => {
    return followUps.find(f => f.lead_id === leadId);
  };

  if (filterParam === 'fresh') {
    displayedLeads = leads.filter(l => l.status === 'Fresh');
    screenTitle = 'Fresh Customers';
  } else if (filterParam === 'today') {
    displayedLeads = leads.filter(l => {
      const latest = getLatestFollowUp(l.id);
      return latest && latest.next_follow_up_date === today;
    });
    screenTitle = "Today's Follow-ups";
  } else if (filterParam === 'completed') {
    const completedFollowUps = followUps.filter(f => f.created_at?.startsWith(today) || f.visit_date === today);
    const completedLeadIds = completedFollowUps.map(f => f.lead_id);
    displayedLeads = leads.filter(l => completedLeadIds.includes(l.id));
    screenTitle = 'Completed Today';
  } else if (filterParam === 'upcoming') {
    displayedLeads = leads.filter(l => {
      const latest = getLatestFollowUp(l.id);
      return latest && latest.next_follow_up_date && latest.next_follow_up_date > today;
    });
    screenTitle = "Upcoming Follow-ups";
  } else if (filterParam === 'pending') {
    displayedLeads = leads.filter(l => {
      const latest = getLatestFollowUp(l.id);
      return latest && latest.next_follow_up_date && latest.next_follow_up_date < today;
    });
    screenTitle = 'Pending Follow-ups';
    
    // Sort pending by oldest first
    displayedLeads.sort((a, b) => {
      const aLatest = getLatestFollowUp(a.id);
      const bLatest = getLatestFollowUp(b.id);
      const aDate = aLatest?.next_follow_up_date ? new Date(aLatest.next_follow_up_date).getTime() : 0;
      const bDate = bLatest?.next_follow_up_date ? new Date(bLatest.next_follow_up_date).getTime() : 0;
      return aDate - bDate;
    });
  } else if (filterParam === 'closed') {
    const closedDealLeadIds = deals.filter(d => d.deal_status === 'Won').map(d => d.lead_id);
    displayedLeads = leads.filter(l => closedDealLeadIds.includes(l.id));
    screenTitle = 'Closed Deals';
  } else if (filterParam === 'total') {
    screenTitle = 'Total Leads';
  }

  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    displayedLeads = displayedLeads.filter(l => 
      l.name.toLowerCase().includes(query) || 
      l.mobile.includes(query) ||
      (l.district && l.district.toLowerCase().includes(query)) ||
      (l.state && l.state.toLowerCase().includes(query)) ||
      (l.location && l.location.toLowerCase().includes(query)) ||
      (l.status && l.status.toLowerCase().includes(query))
    );
  }

  if (filterStatus) {
    displayedLeads = displayedLeads.filter(l => l.status === filterStatus);
  }
  if (filterCustomerType) {
    displayedLeads = displayedLeads.filter(l => l.customer_type === filterCustomerType);
  }
  if (filterDateAdded) {
    const now = new Date();
    let pastDate = new Date();
    if (filterDateAdded === 'Today') {
      pastDate.setHours(0,0,0,0);
    } else if (filterDateAdded === 'Last 7 Days') {
      pastDate.setDate(now.getDate() - 7);
      pastDate.setHours(0,0,0,0);
    } else if (filterDateAdded === 'Last 30 Days') {
      pastDate.setDate(now.getDate() - 30);
      pastDate.setHours(0,0,0,0);
    }
    
    displayedLeads = displayedLeads.filter(l => {
      const addedDate = new Date(l.created_at);
      return addedDate >= pastDate;
    });
  }

  const handleUpdateSave = async () => {
    const canSave = updateResult || notes.trim() || nextVisit;
    if (!selectedLeadId || !canSave) return;
    setIsSubmitting(true);
    
    let finalNextVisit = nextVisit.trim() ? nextVisit.trim() : null;
    let newStatus: LeadStatus | undefined;

    if (updateResult === 'Not Interested') {
      finalNextVisit = null;
      newStatus = 'Lost';
    } else if (updateResult === 'Deal Closed') {
      finalNextVisit = null;
      newStatus = 'Deal Closed';
      const lead = leads.find(l => l.id === selectedLeadId);
      if (lead) {
        await addDeal({
          lead_id: lead.id,
          deal_date: new Date().toISOString().split('T')[0],
          property_size: lead.size || '',
          location: lead.location || '',
          deal_status: 'Won',
          final_amount: parseInt((lead.budget || '').replace(/[^0-9]/g, ''), 10) || 0
        });
      }
    } else if (updateResult === 'Meeting Scheduled') {
      newStatus = 'Site Visit';
    } else if (updateResult === 'Interested') {
      newStatus = 'Negotiation';
    }

    if (newStatus) {
      await updateLeadStatus(selectedLeadId, newStatus);
    }

    let finalComment = notes.trim();
    if (updateResult) {
      finalComment = `${updateResult}${finalComment ? ' - ' + finalComment : ''}`;
    }
    if (!finalComment) finalComment = 'Follow-up logged';

    await addFollowUp({
      lead_id: selectedLeadId,
      comment: finalComment,
      visit_date: new Date().toISOString().split('T')[0],
      next_follow_up_date: finalNextVisit,
      reminder_sent: false,
    });

    setShowUpdateModal(false);
    setIsSubmitting(false);
    setSelectedLeadId(null);
    setUpdateResult(null);
    setNotes('');
    setNextVisit('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTextContainer}>
          <AppText style={[styles.headerTitle, { color: theme.text }]}>{screenTitle}</AppText>
          <AppText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Find and filter your leads</AppText>
        </View>
      </View>
      <View style={[styles.searchHeader, { paddingTop: 12 }]}>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={screenTitle.startsWith('Search') ? `${screenTitle}...` : `Search ${screenTitle}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterBtn, isSelectionMode && { backgroundColor: theme.surfaceLight }]} 
          onPress={() => {
            if (isSelectionMode) {
              setIsSelectionMode(false);
              setSelectedLeads([]);
            } else {
              setIsSelectionMode(true);
            }
          }}
        >
          {isSelectionMode ? <X size={20} color={theme.primaryDark} /> : <CheckSquare size={20} color={theme.primaryDark} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilterModal(true)}>
          <Filter size={20} color={theme.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {(filterStatus || filterCustomerType || filterDateAdded) && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.activeFiltersContainer}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {filterStatus && (
            <TouchableOpacity style={styles.activeFilterChip} onPress={() => setFilterStatus(null)}>
              <AppText style={styles.activeFilterText}>{filterStatus}</AppText>
              <X size={14} color={theme.primaryDark} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
          {filterCustomerType && (
            <TouchableOpacity style={styles.activeFilterChip} onPress={() => setFilterCustomerType(null)}>
              <AppText style={styles.activeFilterText}>{filterCustomerType}</AppText>
              <X size={14} color={theme.primaryDark} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
          {filterDateAdded && (
            <TouchableOpacity style={styles.activeFilterChip} onPress={() => setFilterDateAdded(null)}>
              <AppText style={styles.activeFilterText}>{filterDateAdded}</AppText>
              <X size={14} color={theme.primaryDark} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <Modal visible={showFilterModal} animationType="slide" transparent={true}>
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <AppText style={styles.filterModalTitle}>Filters</AppText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
              <AppText style={styles.filterSectionTitle}>Status</AppText>
              <View style={styles.filterChipsRow}>
                {['Fresh', 'Follow-up Today', 'Site Visit', 'Negotiation', 'Deal Closed', 'Lost'].map(status => (
                  <TouchableOpacity 
                    key={status} 
                    style={[styles.filterChip, filterStatus === status && styles.filterChipSelected]}
                    onPress={() => setFilterStatus(filterStatus === status ? null : status)}
                  >
                    <AppText style={[styles.filterChipText, filterStatus === status && styles.filterChipTextSelected]}>{status}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText style={styles.filterSectionTitle}>Customer Type</AppText>
              <View style={styles.filterChipsRow}>
                {['Fresh Lead', 'Visited Customer', 'Existing Customer'].map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.filterChip, filterCustomerType === type && styles.filterChipSelected]}
                    onPress={() => setFilterCustomerType(filterCustomerType === type ? null : type)}
                  >
                    <AppText style={[styles.filterChipText, filterCustomerType === type && styles.filterChipTextSelected]}>{type}</AppText>
                  </TouchableOpacity>
                ))}
              </View>

              <AppText style={styles.filterSectionTitle}>Date Added</AppText>
              <View style={styles.filterChipsRow}>
                {['Today', 'Last 7 Days', 'Last 30 Days'].map(range => (
                  <TouchableOpacity 
                    key={range} 
                    style={[styles.filterChip, filterDateAdded === range && styles.filterChipSelected]}
                    onPress={() => setFilterDateAdded(filterDateAdded === range ? null : range)}
                  >
                    <AppText style={[styles.filterChipText, filterDateAdded === range && styles.filterChipTextSelected]}>{range}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity 
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setFilterStatus(null);
                  setFilterCustomerType(null);
                  setFilterDateAdded(null);
                }}
              >
                <AppText style={styles.clearFiltersText}>Clear</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyFiltersBtn} onPress={() => setShowFilterModal(false)}>
                <AppText style={styles.applyFiltersText}>Apply Filters</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isSelectionMode && (
        <View style={styles.selectionHeader}>
          <TouchableOpacity 
            style={styles.selectAllBtn}
            onPress={() => {
              if (selectedLeads.length === displayedLeads.length) {
                setSelectedLeads([]);
                setIsSelectionMode(false);
              } else {
                setSelectedLeads(displayedLeads.map(l => l.id));
              }
            }}
          >
            {selectedLeads.length === displayedLeads.length ? (
              <CheckSquare size={20} color={theme.primaryDark} />
            ) : (
              <Square size={20} color="#94a3b8" />
            )}
            <AppText style={styles.selectAllText}>
              {selectedLeads.length === displayedLeads.length ? 'Deselect All' : 'Select All'}
            </AppText>
          </TouchableOpacity>
          {selectedLeads.length > 0 && (
            <TouchableOpacity 
              style={styles.headerWhatsAppBtn}
              onPress={handleWhatsAppAction}
            >
              <MessageCircle size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <AppText style={styles.headerWhatsAppText}>WhatsApp ({selectedLeads.length})</AppText>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.listContainer, isSelectionMode && { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {displayedLeads.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyStateText}>No leads found.</AppText>
          </View>
        ) : (
          displayedLeads.map(lead => {
            if (['pending', 'upcoming', 'today'].includes(filterParam)) {
              const latest = getLatestFollowUp(lead.id);
              
              let dueText = 'Unknown';
              if (latest?.next_follow_up_date) {
                const dueDate = new Date(latest.next_follow_up_date);
                const todayDate = new Date();
                todayDate.setHours(0,0,0,0);
                dueDate.setHours(0,0,0,0);
                
                const diffTime = todayDate.getTime() - dueDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                  dueText = 'Yesterday';
                } else if (diffDays > 1) {
                  dueText = `${diffDays} days ago`;
                } else if (diffDays === 0) {
                  dueText = 'Today';
                } else if (diffDays === -1) {
                  dueText = 'Tomorrow';
                } else if (diffDays < -1) {
                  dueText = `In ${Math.abs(diffDays)} days`;
                } else {
                  dueText = new Date(latest.next_follow_up_date).toLocaleDateString();
                }
              }

              let statusColor = '#dc2626'; // Default Overdue Red
              let badgeBg = '#fee2e2';
              let statusText = 'Overdue';

              if (filterParam === 'upcoming') {
                statusColor = '#0ea5e9'; // Sky blue
                badgeBg = '#e0f2fe';
                statusText = 'Upcoming';
              } else if (filterParam === 'today') {
                statusColor = '#d97706'; // Orange
                badgeBg = '#fef3c7';
                statusText = 'Today';
              } else if (filterParam === 'completed') {
                statusColor = '#10b981'; // Green
                badgeBg = '#d1fae5';
                statusText = 'Completed';
              }

              return (
                <View key={lead.id} style={styles.pendingCardRow}>
                  {isSelectionMode && (
                    <TouchableOpacity 
                      style={styles.checkboxContainer}
                      onPress={() => toggleSelection(lead.id)}
                    >
                      {selectedLeads.includes(lead.id) ? (
                        <CheckSquare size={20} color={theme.primaryDark} />
                      ) : (
                        <Square size={20} color="#cbd5e1" />
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.pendingCard}
                    onLongPress={() => {
                      if (!isSelectionMode) {
                        setIsSelectionMode(true);
                        setSelectedLeads([lead.id]);
                      }
                    }}
                    onPress={() => {
                      if (isSelectionMode) {
                        toggleSelection(lead.id);
                      } else {
                        router.push(`/lead/${lead.id}`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pendingCardHeader}>
                      <View style={styles.pendingLeadInfo}>
                        <AppText style={styles.pendingLeadName}>{lead.name}</AppText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Phone size={14} color="#64748b" style={{ marginRight: 4 }} />
                          <AppText style={styles.pendingLeadSub}>Call Follow-up</AppText>
                        </View>
                      </View>
                    
                    <TouchableOpacity 
                      style={styles.inlineUpdateBtn} 
                      onPress={() => {
                        setSelectedLeadId(lead.id);
                        setShowUpdateModal(true);
                      }}
                    >
                      <Edit3 size={14} color="#ffffff" />
                      <AppText style={styles.inlineUpdateText}>Update</AppText>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.pendingDetailsRow}>
                    <AppText style={styles.pendingDueText}>Due: {dueText}</AppText>
                    <View style={[styles.pendingStatusBadge, { backgroundColor: badgeBg }]}>
                      <AppText style={[styles.pendingStatusText, { color: statusColor }]}>{statusText}</AppText>
                    </View>
                  </View>

                  <View style={styles.pendingActionsRow}>
                    <TouchableOpacity style={styles.pendingActionBtn} onPress={() => callNumber(lead.mobile)}>
                      <Phone size={18} color={theme.primaryDark} />
                      <AppText style={[styles.pendingActionText, { color: theme.primaryDark }]}>Call</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pendingActionBtn} onPress={() => openWhatsApp(lead.mobile)}>
                      <MessageCircle size={18} color="#059669" />
                      <AppText style={[styles.pendingActionText, { color: '#059669' }]}>WhatsApp</AppText>
                    </TouchableOpacity>
                  </View>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <View key={lead.id} style={styles.leadCardRow}>
                {isSelectionMode && (
                  <TouchableOpacity 
                    style={styles.checkboxContainer}
                    onPress={() => toggleSelection(lead.id)}
                  >
                    {selectedLeads.includes(lead.id) ? (
                      <CheckSquare size={20} color={theme.primaryDark} />
                    ) : (
                      <Square size={20} color="#cbd5e1" />
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.leadCard}
                  onLongPress={() => {
                    if (!isSelectionMode) {
                      setIsSelectionMode(true);
                      setSelectedLeads([lead.id]);
                    }
                  }}
                  onPress={() => {
                    if (isSelectionMode) {
                      toggleSelection(lead.id);
                    } else {
                      router.push(`/lead/${lead.id}`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <User size={20} color={theme.primaryDark} />
                  </View>
                  <View style={styles.leadInfo}>
                    <AppText style={styles.leadName}>{lead.name}</AppText>
                    <AppText style={styles.leadMobile}>{lead.mobile}</AppText>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    lead.status === 'Deal Closed' && { backgroundColor: theme.surfaceLight },
                    lead.status === 'Lost' && { backgroundColor: '#f3f4f6' }
                  ]}>
                    <AppText style={[
                      styles.statusText,
                      lead.status === 'Deal Closed' && { color: '#dc2626' },
                      lead.status === 'Lost' && { color: '#4b5563' }
                    ]}>{lead.status}</AppText>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>



      <Modal visible={showBulkQueueModal} animationType="fade" transparent={true}>
        <View style={styles.premiumModalOverlay}>
          <View style={styles.premiumModalContent}>
            {queueIndex >= selectedLeads.length ? (
              <>
                <View style={[styles.premiumIconCircle, { backgroundColor: theme.surfaceLight }]}>
                  <Check size={32} color="#16a34a" />
                </View>
                <AppText style={styles.premiumTitle}>Queue Complete!</AppText>
                <AppText style={styles.premiumDesc}>
                  You have successfully messaged all {selectedLeads.length} selected customers.
                </AppText>
                <TouchableOpacity 
                  style={styles.premiumCloseBtn}
                  onPress={() => setShowBulkQueueModal(false)}
                >
                  <AppText style={styles.premiumCloseBtnText}>Done</AppText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.premiumIconCircle, { backgroundColor: theme.surfaceLight }]}>
                  <MessageCircle size={32} color={theme.primaryDark} />
                </View>
                <AppText style={styles.premiumTitle}>Bulk Send Queue</AppText>
                <View style={{ width: '100%', marginBottom: 15 }}>
                  {(() => {
                    const currentLead = leads.find(l => l.id === selectedLeads[queueIndex]);
                    return currentLead ? (
                      <View style={{ backgroundColor: theme.background, padding: 12, borderRadius: 8, marginBottom: 15 }}>
                        <AppText style={{ fontSize: 13, color: theme.icon, fontWeight: '500' }}>Sending to:</AppText>
                        <AppText style={{ fontSize: 16, color: theme.text, fontWeight: '700', marginTop: 2 }}>{currentLead.name}</AppText>
                        <AppText style={{ fontSize: 14, color: theme.textSecondary, marginTop: 1 }}>{currentLead.mobile}</AppText>
                      </View>
                    ) : null;
                  })()}
                  <AppText style={{ fontSize: 13, color: theme.icon, fontWeight: '600', marginBottom: 6 }}>WhatsApp Message</AppText>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: theme.divider,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: theme.text,
                      minHeight: 100,
                      backgroundColor: theme.surface,
                      textAlignVertical: 'top'
                    }}
                    multiline
                    value={bulkMessage}
                    onChangeText={setBulkMessage}
                    placeholder="Enter your message..."
                  />
                </View>
                
                <AppText style={styles.premiumDesc}>
                  Message {queueIndex + 1} of {selectedLeads.length}
                </AppText>
                
                <View style={styles.queueProgressContainer}>
                  <View style={[styles.queueProgressBar, { width: `${((queueIndex) / selectedLeads.length) * 100}%` }]} />
                </View>
                
                <TouchableOpacity 
                  style={styles.premiumCloseBtn}
                  onPress={processQueueNext}
                >
                  <AppText style={styles.premiumCloseBtnText}>
                    Send Message #{queueIndex + 1}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.fallbackBtn}
                  onPress={() => setShowBulkQueueModal(false)}
                >
                  <AppText style={styles.fallbackBtnText}>Pause & Exit Queue</AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showApiQueueModal} animationType="fade" transparent={true}>
        <View style={styles.premiumModalOverlay}>
          <View style={styles.premiumModalContent}>
            {apiIsSending ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color={theme.primaryDark} />
                <AppText style={{ marginTop: 16, fontSize: 16, color: theme.text, fontWeight: '600' }}>Sending via API...</AppText>
              </View>
            ) : (
              <>
                <View style={[styles.premiumIconCircle, { backgroundColor: theme.surfaceLight }]}>
                  <MessageCircle size={32} color={theme.primaryDark} />
                </View>
                <AppText style={styles.premiumTitle}>API Bulk Send</AppText>
                
                <AppText style={[styles.premiumDesc, { marginBottom: 20 }]}>
                  You are about to send a WhatsApp message to {selectedLeads.length} selected client{selectedLeads.length > 1 ? 's' : ''} in the background.
                </AppText>

                <View style={{ width: '100%', marginBottom: 15 }}>
                  <AppText style={{ fontSize: 13, color: theme.icon, fontWeight: '600', marginBottom: 6 }}>WhatsApp Message</AppText>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: theme.divider,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: theme.text,
                      minHeight: 100,
                      backgroundColor: theme.surface,
                      textAlignVertical: 'top'
                    }}
                    multiline
                    value={bulkMessage}
                    onChangeText={setBulkMessage}
                    placeholder="Enter your message..."
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.premiumCloseBtn}
                  onPress={async () => {
                    if (!whatsappApiUrl || !whatsappApiToken) {
                      Alert.alert("Configuration Missing", "Please configure the WhatsApp API URL and Token in Settings.");
                      return;
                    }
                    setApiIsSending(true);
                    try {
                      // Mock API delay
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      setApiIsSending(false);
                      setShowApiQueueModal(false);
                      Alert.alert("Success", `Sent messages to ${selectedLeads.length} clients via API.`);
                      // Optionally clear selection:
                      // setSelectedLeads([]);
                    } catch (e) {
                      setApiIsSending(false);
                      Alert.alert("API Error", "Failed to send messages.");
                    }
                  }}
                >
                  <AppText style={styles.premiumCloseBtnText}>
                    Send All via API
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.fallbackBtn}
                  onPress={() => setShowApiQueueModal(false)}
                >
                  <AppText style={styles.fallbackBtnText}>Cancel</AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUpdateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpdateModal(false)}
        transparent={Platform.OS === 'web'}
      >
        <View style={Platform.OS === 'web' ? styles.webModalOverlay : { flex: 1 }}>
          <KeyboardAvoidingView 
            style={[{ flex: 1, backgroundColor: theme.surface }, Platform.OS === 'web' && styles.webModalFrame]} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Follow-up Result</AppText>
              <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                <X size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.optionsGrid}>
                {updateResults.map(res => (
                  <TouchableOpacity
                    key={res}
                    style={[styles.optionCard, updateResult === res && styles.optionCardSelected]}
                    onPress={() => setUpdateResult(res)}
                  >
                    <AppText style={[styles.optionText, updateResult === res && styles.optionTextSelected]}>{res}</AppText>
                    {updateResult === res && <Check size={16} color={theme.primaryDark} />}
                  </TouchableOpacity>
                ))}
              </View>

              <AppText style={styles.inputLabel}>Notes</AppText>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter details here..."
                placeholderTextColor="#94a3b8"
                multiline
                value={notes}
                onChangeText={setNotes}
              />

              <AppText style={styles.inputLabel}>Next Follow-up Date</AppText>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <CalendarIcon size={20} color="#64748b" />
                <AppText style={styles.dateSelectorText}>{nextVisit || 'Select Date & Time'}</AppText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveButton, !(updateResult || notes.trim() || nextVisit) && styles.saveButtonDisabled]} 
                onPress={handleUpdateSave}
                disabled={!(updateResult || notes.trim() || nextVisit) || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <AppText style={styles.saveButtonText}>Save</AppText>
                )}
              </TouchableOpacity>
            </ScrollView>
            <FollowUpDatePicker
              visible={showDatePicker}
              initialDate={nextVisit}
              onClose={() => setShowDatePicker(false)}
              onSave={(date, time) => {
                setNextVisit(date);
                // Currently ignoring time string for DB storage, but it updates the UI
                setShowDatePicker(false);
              }}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surfaceLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    backgroundColor: theme.surface,
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
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    height: '100%',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  activeFiltersContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: theme.surface,
  },
  activeFiltersContent: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  filterModalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 480,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  filterScrollContent: {
    padding: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
    marginTop: 20,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterChipSelected: {
    backgroundColor: theme.surfaceLight,
    borderColor: '#0284c7',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  filterChipTextSelected: {
    color: '#0284c7',
    fontWeight: '600',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: theme.surface,
  },
  clearFiltersBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: theme.background,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  applyFiltersBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#0284c7',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.surface,
  },

  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: 8,
  },
  headerWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerWhatsAppText: {
    color: theme.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelSelectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  checkboxContainer: {
    padding: 12,
    justifyContent: 'center',
  },
  pendingCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leadCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: theme.text,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 100,
  },
  selectionCountText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  actionBarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnTextWhatsApp: {
    color: theme.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  premiumModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  premiumModalContent: {
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  premiumIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  premiumDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  premiumBadgeRow: {
    backgroundColor: theme.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  premiumBadgeText: {
    color: theme.icon,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  premiumCloseBtn: {
    backgroundColor: theme.text,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumCloseBtnText: {
    color: theme.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  fallbackBtn: {
    paddingVertical: 12,
  },
  fallbackBtnText: {
    color: '#0ea5e9',
    fontSize: 15,
    fontWeight: '600',
  },
  queueProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.background,
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  queueProgressBar: {
    height: '100%',
    backgroundColor: '#0284c7',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
  },

  listContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.icon,
    fontSize: 16,
  },
  leadCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  leadMobile: {
    fontSize: 14,
    color: theme.icon,
  },
  statusBadge: {
    backgroundColor: theme.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
  },
  pendingCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pendingLeadInfo: {
    flex: 1,
  },
  pendingLeadName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  pendingLeadSub: {
    fontSize: 14,
    color: theme.icon,
    fontWeight: '500',
  },
  inlineUpdateBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inlineUpdateText: {
    color: theme.surface,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  pendingDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingDueText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
    marginRight: 12,
  },
  pendingStatusBadge: {
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingStatusText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pendingActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.background,
  },
  pendingUpdateBtn: {
    backgroundColor: '#0284c7',
  },
  pendingActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  webModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webModalFrame: {
    width: '100%',
    maxWidth: 400,
    maxHeight: 850,
    borderWidth: 8,
    borderColor: theme.border,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    marginVertical: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  modalContent: {
    padding: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  optionCardSelected: {
    borderColor: '#0284c7',
    backgroundColor: theme.surfaceLight,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  optionTextSelected: {
    color: '#0284c7',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  dateSelectorText: {
    fontSize: 16,
    color: theme.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: theme.icon,
  },
  saveButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  calendarModalContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: 450,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
});
}
