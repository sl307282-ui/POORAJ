import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Phone, MessageCircle, Send, Plus, Pencil, Trash, X, Calendar as CalendarIcon, Check, MoreVertical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLeadStore } from '../../store/leadStore';
import { callNumber, openWhatsApp } from '../../utils/deepLinks';
import { Calendar } from 'react-native-calendars';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };
  
  const [comment, setComment] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [showAllInfo, setShowAllInfo] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateResults = [
    'Interested',
    'Not Interested',
    'Call Later',
    'No Answer',
    'Meeting Scheduled',
    'Deal Closed'
  ];
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [showContactMenu, setShowContactMenu] = useState(false);
  const { leads, followUps, addFollowUp, updateFollowUp, deleteFollowUp, updateLeadStatus, addDeal, deleteLead, updateLead } = useLeadStore();
  const lead = leads.find(l => l.id === id);
  const leadFollowUps = followUps.filter(f => f.lead_id === id);

  const handleAddFollowUp = async () => {
    const canSave = updateResult || comment.trim() || nextVisit;
    if (!canSave) return;
    setIsSubmitting(true);
    
    let finalNextVisit = nextVisit.trim() ? nextVisit.trim() : null;
    let newStatus: string | undefined;

    if (updateResult === 'Not Interested') {
      finalNextVisit = null;
      newStatus = 'Lost';
    } else if (updateResult === 'Deal Closed') {
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
    } else if (updateResult === 'Meeting Scheduled') {
      newStatus = 'Site Visit';
    } else if (updateResult === 'Interested') {
      newStatus = 'Negotiation';
    }

    if (newStatus && lead) {
      await updateLeadStatus(lead.id, newStatus);
    }

    let finalComment = comment.trim();
    if (updateResult) {
      finalComment = `${updateResult}${finalComment ? ' - ' + finalComment : ''}`;
    }
    if (!finalComment) finalComment = 'Follow-up logged';

    if (editingFollowUpId) {
      await updateFollowUp(editingFollowUpId, {
        comment: finalComment,
        next_follow_up_date: finalNextVisit,
      });
    } else {
      await addFollowUp({
        lead_id: id as string,
        comment: finalComment,
        visit_date: new Date().toISOString().split('T')[0],
        next_follow_up_date: finalNextVisit,
        reminder_sent: false,
      });
    }

    setComment('');
    setNextVisit('');
    setUpdateResult(null);
    setEditingFollowUpId(null);
    setShowAddFollowUpModal(false);
    setIsSubmitting(false);
  };

  const handleEditFollowUp = (followUp: any) => {
    setComment(followUp.comment);
    setNextVisit(followUp.next_follow_up_date || '');
    setEditingFollowUpId(followUp.id);
    setShowAddFollowUpModal(true);
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this follow-up? This action cannot be undone.")) {
        deleteFollowUp(followUpId);
      }
    } else {
      Alert.alert(
        "Delete Follow-up",
        "Are you sure you want to delete this follow-up? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteFollowUp(followUpId) }
        ]
      );
    }
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
          <Text style={styles.emptyStateText}>Lead not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleDeleteContact = () => {
    setShowContactMenu(false);
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
        deleteLead(id as string);
        router.push('/(tabs)');
      }
    } else {
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
    }
  };

  const handleEditContact = () => {
    setShowContactMenu(false);
    router.push(`/lead/edit/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{lead.name}</Text>
              <Text style={styles.headerSubTitle}>{lead.mobile}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => callNumber(lead.mobile)} style={styles.headerActionBtn}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
                <Phone size={18} color="#0284c7" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openWhatsApp(lead.mobile)} style={styles.headerActionBtn}>
              <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
                <MessageCircle size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowContactMenu(true)} style={[styles.headerActionBtn, { marginLeft: 8 }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                <MoreVertical size={20} color="#475569" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionTitle}>Lead Information</Text>
        <View style={styles.infoCard}>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer Type</Text>
            <Text style={styles.infoValue}>{lead.customer_type || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{lead.address || 'N/A'}</Text>
          </View>
          {lead.district ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>District</Text>
              <Text style={styles.infoValue}>{lead.district}</Text>
            </View>
          ) : null}
          {lead.state ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>State</Text>
              <Text style={styles.infoValue}>{lead.state}</Text>
            </View>
          ) : null}
          {showAllInfo && (
            <>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Profile</Text>
                <Text style={styles.infoValue}>{lead.profile || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Requirement</Text>
                <Text style={styles.infoValue}>{lead.requirement || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>{lead.budget || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Property Type</Text>
                <Text style={styles.infoValue}>{lead.property_type || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Size</Text>
                <Text style={styles.infoValue}>{lead.size ? `${lead.size} sq yd` : 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Road Size</Text>
                <Text style={styles.infoValue}>{lead.road_size || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Facing</Text>
                <Text style={styles.infoValue}>{lead.facing || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{lead.location || 'N/A'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank Loan</Text>
                <Text style={styles.infoValue}>{lead.loan_requirement || 'N/A'}</Text>
              </View>
            </>
          )}

          <TouchableOpacity 
            style={styles.seeMoreButton} 
            onPress={() => setShowAllInfo(!showAllInfo)}
          >
            <Text style={styles.seeMoreButtonText}>
              {showAllInfo ? 'See Less' : 'See More'}
            </Text>
          </TouchableOpacity>
          
        </View>

        <View style={styles.sectionHeaderContainer}>
          <MessageCircle size={20} color="#0f172a" style={styles.sectionIcon} />
          <Text style={styles.sectionTitleWithIcon}>Conversation</Text>
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
            <Pencil size={14} color="#0284c7" />
            <Text style={styles.conversationUpdateText}>Update</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.customerHeader}>
          <Text style={styles.customerHeaderIcon}>👤</Text>
          <Text style={styles.customerHeaderText}>Customer</Text>
        </View>

        {leadFollowUps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No follow-ups recorded yet.</Text>
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
                    <Text style={styles.latestFollowUpLabel}>Next Visit</Text>
                    <Text style={styles.latestFollowUpValue}>{nextVisitStr}</Text>
                  </View>
                  <View style={styles.latestFollowUpSection}>
                    <Text style={styles.latestFollowUpLabel}>Last Comment</Text>
                    <Text style={styles.latestFollowUpComment}>{latestFollowUp.comment}</Text>
                  </View>
                </>
              );
            })()}
            
            <TouchableOpacity 
              style={styles.viewHistoryButton} 
              onPress={() => setShowHistoryModal(true)}
            >
              <Text style={styles.viewHistoryButtonText}>View Full History</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          visible={showHistoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowHistoryModal(false)}
          transparent={Platform.OS === 'web'}
        >
          <View style={Platform.OS === 'web' ? styles.webModalOverlay : { flex: 1 }}>
            <SafeAreaView style={[styles.historyModalContainer, Platform.OS === 'web' && styles.webModalFrame]}>
            <View style={styles.historyModalHeader}>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.historyModalCloseButton}>
                <ChevronLeft size={24} color="#0f172a" />
                <Text style={styles.historyModalCloseText}>Back</Text>
              </TouchableOpacity>
              <Text style={styles.historyModalTitle}>Conversation History</Text>
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
                <Text style={styles.addConversationProfessionalText}>Add New Conversation</Text>
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
                        <Text style={styles.timelineDateIcon}>📅</Text>
                        <Text style={styles.timelineDateText}>{dateStr}</Text>
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
                    <Text style={styles.timelineComment}>{follow.comment}</Text>
                    
                    {nextVisitStr && (
                      <View style={styles.timelineNextVisitRow}>
                        <Text style={styles.timelineNextVisitIcon}>📅</Text>
                        <View>
                          <Text style={styles.timelineNextVisitLabel}>Next Visit:</Text>
                          <Text style={styles.timelineNextVisitValue}>{nextVisitStr}</Text>
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
          <View style={Platform.OS === 'web' ? styles.webMenuFrame : { flex: 1, position: 'relative', width: '100%' }}>
            <View style={styles.contactMenuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEditContact}>
                <Pencil size={18} color="#0f172a" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Edit Contact</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDeleteContact}>
                <Trash size={18} color="#ef4444" style={styles.menuIcon} />
                <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete Contact</Text>
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
        transparent={Platform.OS === 'web'}
      >
        <View style={Platform.OS === 'web' ? styles.webModalOverlay : { flex: 1 }}>
          <KeyboardAvoidingView 
            style={[{ flex: 1, backgroundColor: '#ffffff' }, Platform.OS === 'web' && styles.webModalFrame]} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingFollowUpId ? 'Edit Follow-up Result' : 'Follow-up Result'}</Text>
              <TouchableOpacity onPress={() => setShowAddFollowUpModal(false)}>
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
                    <Text style={[styles.optionText, updateResult === res && styles.optionTextSelected]}>{res}</Text>
                    {updateResult === res && <Check size={16} color="#0284c7" />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter details here..."
                placeholderTextColor="#94a3b8"
                multiline
                value={comment}
                onChangeText={setComment}
              />

              <Text style={styles.inputLabel}>Next Follow-up Date</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <CalendarIcon size={20} color="#64748b" />
                <Text style={styles.dateSelectorText}>{nextVisit || 'Select Date & Time'}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveButton, !(updateResult || comment.trim() || nextVisit) && styles.saveButtonDisabled]} 
                onPress={handleAddFollowUp}
                disabled={!(updateResult || comment.trim() || nextVisit) || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setShowDatePicker(false)}
        >
          <View style={styles.calendarModalContainer}>
            <TouchableOpacity activeOpacity={1}>
              <Calendar
                current={nextVisit || undefined}
                onDayPress={(day: any) => {
                  setNextVisit(day.dateString);
                  setShowDatePicker(false);
                }}
                markedDates={
                  nextVisit ? {
                    [nextVisit]: { selected: true, selectedColor: '#0284c7' }
                  } : {}
                }
                theme={{
                  todayTextColor: '#0284c7',
                  selectedDayBackgroundColor: '#0284c7',
                  arrowColor: '#0284c7',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  monthTextColor: '#0f172a',
                }}
                style={styles.calendarElement}
              />
              <View style={styles.calendarModalActions}>
                <TouchableOpacity 
                  style={styles.calendarCloseButton} 
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.calendarCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
  },
  headerSubTitle: {
    fontSize: 13,
    color: '#64748b',
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
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    color: '#94a3b8',
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
    color: '#0f172a',
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 12,
  },
  conversationUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
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
    color: '#334155',
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
    backgroundColor: '#f1f5f9',
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
    color: '#64748b',
  },
  timelineComment: {
    fontSize: 15,
    color: '#0f172a',
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
    color: '#64748b',
  },
  timelineNextVisitValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  timelineSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 24,
    marginBottom: 8,
  },
  addFollowUpContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addFollowUpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  inputComment: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  inputDate: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
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
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '92%',
    maxWidth: 340,
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
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  calendarCloseText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 15,
  },
  latestFollowUpCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  latestFollowUpSection: {
    marginBottom: 16,
  },
  latestFollowUpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  latestFollowUpValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  latestFollowUpComment: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  viewHistoryButton: {
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewHistoryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 15,
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  historyModalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  webMenuFrame: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    position: 'relative',
  },
  contactMenuContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 16,
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyModalCloseText: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    marginLeft: 4,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
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
    color: '#0f172a',
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
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  optionCardSelected: {
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  optionTextSelected: {
    color: '#0284c7',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    color: '#ffffff',
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
    color: '#ffffff',
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
    borderColor: '#e2e8f0',
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    marginVertical: 20,
  }
});
