import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText } from '../../components/AppText';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Phone, MessageCircle, Send, Plus, Pencil, Trash, X, Calendar as CalendarIcon, Check, MoreVertical } from 'lucide-react-native';
import { useLeadStore } from '../../store/leadStore';
import { LeadStatus } from '../../models/types';
import { callNumber, openWhatsApp } from '../../utils/deepLinks';
import { CalendarList } from 'react-native-calendars';
import { FollowUpDatePicker } from '../../components/FollowUpDatePicker';

export default function LeadDetailScreen() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };
  
  const [comment, setComment] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [nextVisitTime, setNextVisitTime] = useState('10:00 AM');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateResults = [
    'Follow Up',
    'Site Visit',
    'Deal Completed'
  ];
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const { leads, followUps, addFollowUp, updateFollowUp, deleteFollowUp, updateLeadStatus, addDeal, deleteLead, updateLead } = useLeadStore();
  const lead = leads.find(l => l.id === id);
  const leadFollowUps = followUps.filter(f => f.lead_id === id);

  const handleAddFollowUp = async () => {
    const canSave = !!updateResult; // Compulsory to select one
    if (!canSave) return;
    setIsSubmitting(true);
    
    let finalNextVisit = nextVisit.trim() ? nextVisit.trim() : null;
    let newStatus: string | undefined;

    if (updateResult === 'Deal Completed') {
      finalNextVisit = null;
      newStatus = 'Deal Closed';
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
    } else if (updateResult === 'Site Visit') {
      newStatus = 'Site Visit';
    } else if (updateResult === 'Follow Up') {
      newStatus = 'Negotiation';
    }

    if (newStatus && lead) {
      await updateLeadStatus(lead.id, newStatus as LeadStatus);
    }

    let finalComment = comment.trim();
    if (updateResult) {
      finalComment = `${updateResult}${finalComment ? ' - ' + finalComment : ''}`;
    }
    if (finalNextVisit && nextVisitTime && !finalComment.includes('Time:')) {
      finalComment = `${finalComment ? finalComment + ' ' : ''}(Time: ${nextVisitTime})`;
    }
    if (!finalComment) finalComment = 'Follow-up logged';

    if (editingFollowUpId) {
      await updateFollowUp(editingFollowUpId, {
        comment: finalComment,
        next_follow_up_date: finalNextVisit,
      });
    } else {
      const shouldSkipMark = updateResult === 'Deal Completed' || updateResult === 'Site Visit';
      await addFollowUp({
        lead_id: id as string,
        comment: finalComment,
        visit_date: new Date().toISOString().split('T')[0],
        next_follow_up_date: finalNextVisit,
        reminder_sent: false,
      }, false, shouldSkipMark);
    }

    setComment('');
    setNextVisit('');
    setNextVisitTime('10:00 AM');
    setUpdateResult(null);
    setEditingFollowUpId(null);
    setShowAddFollowUpModal(false);
    setIsSubmitting(false);
  };

  const handleEditFollowUp = (followUp: any) => {
    setComment(followUp.comment);
    setNextVisit(followUp.next_follow_up_date || '');
    const timeMatch = followUp.comment?.match(/\(Time:\s*([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM))\)/i);
    if (timeMatch && timeMatch[1]) {
      setNextVisitTime(timeMatch[1]);
    }
    setEditingFollowUpId(followUp.id);
    setShowAddFollowUpModal(true);
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    Alert.alert(
      "Delete Follow-up",
      "Are you sure you want to delete this follow-up? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteFollowUp(followUpId) }
      ]
    );
  };

  if (!lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <AppText style={styles.emptyStateText}>Lead not found.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleDeleteContact = () => {
    setShowContactMenu(false);
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            deleteLead(id as string);
            router.push('/(tabs)');
          }
        }
      ]
    );
  };

  const handleEditContact = () => {
    setShowContactMenu(false);
    router.push(`/lead/edit/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
              <ChevronLeft size={24} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <AppText style={styles.headerTitle}>{lead.name}</AppText>
              <AppText style={styles.headerSubTitle}>{lead.mobile}</AppText>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => callNumber(lead.mobile)} style={styles.headerActionBtn}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
                <Phone size={18} color={theme.primaryDark} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openWhatsApp(lead.mobile)} style={styles.headerActionBtn}>
              <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
                <MessageCircle size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowContactMenu(true)} style={[styles.headerActionBtn, { marginLeft: 8 }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.background }]}>
                <MoreVertical size={20} color="#475569" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView contentContainerStyle={styles.content}>

        <AppText style={styles.sectionTitle}>Lead Information</AppText>
        <View style={styles.infoCard}>
          
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Customer Type</AppText>
            <AppText style={styles.infoValue}>{lead.customer_type || 'N/A'}</AppText>
          </View>
          {lead.source ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Lead Source</AppText>
                <AppText style={styles.infoValue}>{lead.source}</AppText>
              </View>
            </>
          ) : null}
          {lead.visited_location ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>📍 Location</AppText>
                <AppText style={styles.infoValue}>{lead.visited_location}</AppText>
              </View>
            </>
          ) : null}
          {lead.property_name ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>🏠 Property Name</AppText>
                <AppText style={styles.infoValue}>{lead.property_name}</AppText>
              </View>
            </>
          ) : null}
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <AppText style={styles.infoLabel}>Address</AppText>
            <AppText style={styles.infoValue}>{lead.address || 'N/A'}</AppText>
          </View>
          {lead.district ? (
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>District</AppText>
              <AppText style={styles.infoValue}>{lead.district}</AppText>
            </View>
          ) : null}
          {lead.state ? (
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>State</AppText>
              <AppText style={styles.infoValue}>{lead.state}</AppText>
            </View>
          ) : null}
          {showAllInfo && (
            <>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Profile</AppText>
                <AppText style={styles.infoValue}>{lead.profile || 'N/A'}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Requirement</AppText>
                <AppText style={styles.infoValue}>{lead.requirement || 'N/A'}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Budget</AppText>
                <AppText style={styles.infoValue}>{lead.budget || 'N/A'}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Property Type</AppText>
                <AppText style={styles.infoValue}>{lead.property_type || 'N/A'}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Size</AppText>
                <AppText style={styles.infoValue}>{lead.size ? `${lead.size} sq yd` : 'N/A'}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Road Size</AppText>
                <AppText style={styles.infoValue}>{Array.isArray(lead.road_size) ? lead.road_size.join(', ') : (lead.road_size || 'N/A')}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Property Facing</AppText>
                <AppText style={styles.infoValue}>{Array.isArray(lead.facing) ? lead.facing.join(', ') : (lead.facing || 'N/A')}</AppText>
              </View>
              <View style={styles.divider} />
              
              {Boolean(lead.station) && (
                <>
                  <View style={styles.infoRow}>
                    <AppText style={styles.infoLabel}>Station</AppText>
                    <AppText style={styles.infoValue}>{lead.station}</AppText>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Location</AppText>
                <AppText style={styles.infoValue}>{lead.location || 'N/A'}</AppText>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>Bank Loan</AppText>
                <AppText style={styles.infoValue}>{lead.loan_requirement || 'N/A'}</AppText>
              </View>
            </>
          )}

          <TouchableOpacity 
            style={styles.seeMoreButton} 
            onPress={() => setShowAllInfo(!showAllInfo)}
          >
            <AppText style={styles.seeMoreButtonText}>
              {showAllInfo ? 'See Less' : 'See More'}
            </AppText>
          </TouchableOpacity>
          
        </View>

        <View style={styles.sectionHeaderContainer}>
          <MessageCircle size={20} color="#0f172a" style={styles.sectionIcon} />
          <AppText style={styles.sectionTitleWithIcon}>Conversation</AppText>
          <View style={styles.sectionDivider} />
          <TouchableOpacity 
            style={styles.conversationUpdateBtn}
            onPress={() => {
              setComment('');
              setNextVisit('');
              setEditingFollowUpId(null);
              setShowAddFollowUpModal(true);
            }}
          >
            <Pencil size={14} color={theme.primaryDark} />
            <AppText style={styles.conversationUpdateText}>Update</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.customerHeader}>
          <AppText style={styles.customerHeaderIcon}>👤</AppText>
          <AppText style={styles.customerHeaderText}>Customer</AppText>
        </View>

        {leadFollowUps.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyStateText}>No follow-ups recorded yet.</AppText>
          </View>
        ) : (
          <View style={styles.latestFollowUpCard}>
            {(() => {
              const latestFollowUp = leadFollowUps[leadFollowUps.length - 1];
              const nextVisitStr = latestFollowUp.next_follow_up_date && !isNaN(new Date(latestFollowUp.next_follow_up_date).getTime()) 
                ? new Date(latestFollowUp.next_follow_up_date).toLocaleString('en-US', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  }) 
                : 'Not Scheduled';
              
              return (
                <>
                  <View style={styles.latestFollowUpSection}>
                    <AppText style={styles.latestFollowUpLabel}>Next Visit</AppText>
                    <AppText style={styles.latestFollowUpValue}>{nextVisitStr}</AppText>
                  </View>
                  <View style={styles.latestFollowUpSection}>
                    <AppText style={styles.latestFollowUpLabel}>Last Comment</AppText>
                    <AppText style={styles.latestFollowUpComment}>{latestFollowUp.comment}</AppText>
                  </View>
                </>
              );
            })()}
            
            <TouchableOpacity 
              style={styles.viewHistoryButton} 
              onPress={() => setShowHistoryModal(true)}
            >
              <AppText style={styles.viewHistoryButtonText}>View Full History</AppText>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showHistoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowHistoryModal(false)}
          transparent={false}
        >
          <View style={{ flex: 1 }}>
            <SafeAreaView style={[styles.historyModalContainer]}>
            <View style={styles.historyModalHeader}>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.historyModalCloseButton}>
                <ChevronLeft size={24} color="#0f172a" />
                <AppText style={styles.historyModalCloseText}>Back</AppText>
              </TouchableOpacity>
              <AppText style={styles.historyModalTitle}>Conversation History</AppText>
              <View style={{ width: 60 }} />
            </View>
            
            <ScrollView contentContainerStyle={styles.historyModalContent}>
              <TouchableOpacity 
                style={styles.addConversationProfessionalBtn}
                onPress={() => {
                  setComment('');
                  setNextVisit('');
                  setUpdateResult(null);
                  setEditingFollowUpId(null);
                  setShowAddFollowUpModal(true);
                }}
              >
                <Pencil size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <AppText style={styles.addConversationProfessionalText}>Add New Conversation</AppText>
              </TouchableOpacity>

              {leadFollowUps.map((follow, index) => {
                const dateStr = follow.created_at ? new Date(follow.created_at).toLocaleString('en-US', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', hour12: true
                }) : 'Unknown Date';

                const nextVisitStr = follow.next_follow_up_date && !isNaN(new Date(follow.next_follow_up_date).getTime())
                  ? new Date(follow.next_follow_up_date).toLocaleString('en-US', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    }) 
                  : null;
                
                return (
                  <View key={follow.id} style={styles.conversationTimelineItem}>
                    <View style={styles.timelineHeaderRow}>
                      <View style={styles.timelineDateRow}>
                        <AppText style={styles.timelineDateIcon}>📅</AppText>
                        <AppText style={styles.timelineDateText}>{dateStr}</AppText>
                      </View>
                      <View style={styles.timelineActionRow}>
                        <TouchableOpacity onPress={() => handleEditFollowUp(follow)} style={styles.timelineActionBtn}>
                          <Pencil size={16} color="#64748b" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteFollowUp(follow.id)} style={styles.timelineActionBtn}>
                          <Trash size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <AppText style={styles.timelineComment}>{follow.comment}</AppText>
                    
                    {nextVisitStr && (
                      <View style={styles.timelineNextVisitRow}>
                        <AppText style={styles.timelineNextVisitIcon}>📅</AppText>
                        <View>
                          <AppText style={styles.timelineNextVisitLabel}>Next Visit:</AppText>
                          <AppText style={styles.timelineNextVisitValue}>{nextVisitStr}</AppText>
                        </View>
                      </View>
                    )}
                    
                    {index < leadFollowUps.length - 1 && (
                      <View style={styles.timelineSeparator} />
                    )}
                  </View>
                )
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      </ScrollView>

      <Modal
        visible={showContactMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPressOut={() => setShowContactMenu(false)}
        >
          <View style={{ flex: 1, position: 'relative', width: '100%' }}>
            <View style={styles.contactMenuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEditContact}>
                <Pencil size={18} color="#0f172a" style={styles.menuIcon} />
                <AppText style={styles.menuItemText}>Edit Contact</AppText>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteContact}>
                <Trash size={18} color="#ef4444" style={styles.menuIcon} />
                <AppText style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Contact</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showAddFollowUpModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddFollowUpModal(false)}
        transparent={false}
      >
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView 
            style={[{ flex: 1, backgroundColor: theme.surface }]} 
            behavior={undefined}
          >
            <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 44 : 20) + 12, paddingBottom: 16 }]}>
              <AppText style={styles.modalTitle}>{editingFollowUpId ? 'Edit Follow-up Result' : 'Follow-up Result'}</AppText>
              <TouchableOpacity onPress={() => setShowAddFollowUpModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={24} color={theme.text} />
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
                value={comment}
                onChangeText={setComment}
              />

              <AppText style={styles.inputLabel}>Next Follow-up Date</AppText>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <CalendarIcon size={20} color="#64748b" />
                <AppText style={styles.dateSelectorText}>
                  {nextVisit 
                    ? `📅 ${new Date(nextVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}${nextVisitTime ? `  🕒 ${nextVisitTime}` : ''}` 
                    : 'Select Date & Time'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveButton, !updateResult && styles.saveButtonDisabled]} 
                onPress={handleAddFollowUp}
                disabled={!updateResult || isSubmitting}
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
              initialTime={nextVisitTime}
              onClose={() => setShowDatePicker(false)}
              onSave={(date, time) => {
                setNextVisit(date);
                if (time) setNextVisitTime(time);
                setShowDatePicker(false);
              }}
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubTitle: {
    fontSize: 13,
    color: theme.icon,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    padding: 0,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 80,
  },
  actionButton: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: theme.icon,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.background,
    marginVertical: 12,
  },
  seeMoreButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  seeMoreButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: theme.icon,
    fontSize: 14,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitleWithIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 12,
  },
  conversationUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  conversationUpdateText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  customerHeaderIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  customerHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  conversationTimelineItem: {
    marginBottom: 16,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timelineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineActionBtn: {
    padding: 6,
    marginLeft: 8,
    backgroundColor: theme.background,
    borderRadius: 6,
  },
  timelineDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDateIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  timelineDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.icon,
  },
  timelineComment: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 22,
    marginBottom: 16,
    paddingLeft: 4,
  },
  timelineNextVisitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineNextVisitIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timelineNextVisitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.icon,
  },
  timelineNextVisitValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginTop: 2,
  },
  timelineSeparator: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: 24,
    marginBottom: 8,
  },
  addFollowUpContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: theme.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  addFollowUpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  inputComment: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  inputDate: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.icon,
  },
  submitButtonText: {
    color: theme.surface,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 35,
    elevation: 24,
  },
  calendarElement: {
    borderRadius: 24,
    padding: 10,
  },
  calendarModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  calendarCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    backgroundColor: theme.background,
    borderRadius: 12,
  },
  calendarCloseText: {
    color: theme.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
  latestFollowUpCard: {
    backgroundColor: theme.surfaceLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  latestFollowUpSection: {
    marginBottom: 16,
  },
  latestFollowUpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.icon,
    marginBottom: 6,
  },
  latestFollowUpValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
  },
  latestFollowUpComment: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  viewHistoryButton: {
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewHistoryButtonText: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 15,
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: theme.surface,
  },
  historyModalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'stretch',
  },
  webMenuFrame: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    position: 'relative',
  },
  contactMenuContainer: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 8,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.background,
    marginHorizontal: 16,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  historyModalCloseText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
    marginLeft: 4,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timelineBubble: {
    padding: 12,
    borderRadius: 12,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
    marginLeft: 6,
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

  historyModalContent: {
    padding: 24,
  },
  addConversationProfessionalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addConversationProfessionalText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
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
  }
});
}
