import { useAppTheme, ACCENT_COLORS } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, Edit2, Users, CalendarClock, CheckCircle, 
  MessageCircle, Bell, LogOut, ChevronRight,
  Palette, Type, Check
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeStore, AccentColor, Typography } from '../store/themeStore';
import { useLeadStore } from '../store/leadStore';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const getInitials = (text: string, fallback: string) => {
  const clean = (text || '').trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user, role, userData, logout } = useAuth();
  const isAdmin = role === 'admin';
  
  const settingsStore = useSettingsStore();
  const { accentColor, setAccentColor, typography, setTypography } = useThemeStore();
  const { leads, followUps } = useLeadStore();

  const accentColorsList: AccentColor[] = ['Sunset', 'Ocean', 'Rose', 'Deep', 'Emerald', 'Burgundy', 'Royal', 'Amber', 'Graphite', 'Slate'];
  const typographyList: Typography[] = ['System Default', 'Modern', 'Classic', 'Geometric', 'Elegant'];

  const [adminCompanyName, setAdminCompanyName] = useState(settingsStore.companyName || 'ABC Properties');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Modals state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState(settingsStore.companyName || 'ABC Properties');
  const [tempName, setTempName] = useState(userData?.name || settingsStore.agentName || 'Rahul Sharma');
  const [tempRole, setTempRole] = useState(userData?.jobRole || settingsStore.agentRole || 'Sales Executive');

  useEffect(() => {
    if (isAdmin && userData?.teamId) {
      getDoc(doc(db, 'teams', userData.teamId)).then((snap) => {
        if (snap.exists() && snap.data()?.name) {
          setAdminCompanyName(snap.data().name);
          settingsStore.setCompanyName(snap.data().name);
        }
      }).catch(console.error);
    }
  }, [isAdmin, userData?.teamId]);

  // Profile Card Titles & Initials
  const profileTitle = isAdmin 
    ? (adminCompanyName || settingsStore.companyName || 'ABC Properties')
    : (userData?.name || settingsStore.agentName || 'Rahul Sharma');

  const profileSubtitle = isAdmin 
    ? 'Admin'
    : (userData?.jobRole || userData?.memberRole || settingsStore.agentRole || 'Sales Executive');

  const avatarInitials = getInitials(profileTitle, isAdmin ? 'AP' : 'RS');

  // Metrics calculation
  const today = new Date().toISOString().split('T')[0];
  const totalLeads = leads.length;
  const latestFollowUps = leads.map(lead => followUps.find(f => f.lead_id === lead.id)).filter(Boolean);
  const dueTodayCount = latestFollowUps.filter(f => f?.next_follow_up_date === today).length || 0;
  const completedTodayCount = followUps.filter(f => f.created_at?.startsWith(today) || f.visit_date === today).length || 0;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleOpenEdit = () => {
    if (isAdmin) {
      setTempCompanyName(profileTitle);
    } else {
      setTempName(profileTitle);
      setTempRole(profileSubtitle);
    }
    setProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (isAdmin) {
      const trimmed = tempCompanyName.trim() || 'ABC Properties';
      settingsStore.setCompanyName(trimmed);
      setAdminCompanyName(trimmed);
      if (userData?.teamId) {
        try {
          await updateDoc(doc(db, 'teams', userData.teamId), { name: trimmed });
        } catch (err) {
          console.error('Failed to update company name in Firestore:', err);
        }
      }
    } else {
      const trimmedName = tempName.trim() || 'Rahul Sharma';
      const trimmedRole = tempRole.trim() || 'Sales Executive';
      const initials = getInitials(trimmedName, 'RS');
      settingsStore.setAgentProfile(trimmedName, trimmedRole, initials);
      if (user?.uid) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            name: trimmedName,
            jobRole: trimmedRole,
          });
        } catch (err) {
          console.error('Failed to update user profile in Firestore:', err);
        }
      }
    }
    setProfileModalVisible(false);
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText style={[styles.headerTitle, { color: theme.text }]}>Profile & Settings</AppText>
          <AppText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage your profile, preferences and account</AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Upper Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileInfoRow}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primaryDark + '20' }]}>
              <AppText style={[styles.avatarText, { color: theme.primaryDark }]}>{avatarInitials}</AppText>
              <View style={[styles.activeStatusDot, { borderColor: theme.surface }]} />
            </View>
            <View style={styles.profileDetails}>
              <AppText style={[styles.agentName, { color: theme.text }]}>{profileTitle}</AppText>
              <AppText style={[styles.agentRole, { color: theme.textSecondary }]}>{profileSubtitle}</AppText>
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.surfaceLight }]}
              onPress={handleOpenEdit}
            >
              <Edit2 size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today at a Glance */}
        <AppText style={[styles.sectionHeading, { color: theme.text }]}>Today at a glance</AppText>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.metricIconBg, { backgroundColor: '#e0f2fe' }]}>
              <Users size={20} color={theme.primaryDark} />
            </View>
            <AppText style={[styles.metricValue, { color: theme.text }]}>{totalLeads}</AppText>
            <AppText style={[styles.metricLabel, { color: theme.textSecondary }]}>Total Leads</AppText>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.metricIconBg, { backgroundColor: '#fef3c7' }]}>
              <CalendarClock size={20} color="#d97706" />
            </View>
            <AppText style={[styles.metricValue, { color: theme.text }]}>{dueTodayCount}</AppText>
            <AppText style={[styles.metricLabel, { color: theme.textSecondary }]}>Follow-ups Due</AppText>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.metricIconBg, { backgroundColor: '#dcfce7' }]}>
              <CheckCircle size={20} color="#059669" />
            </View>
            <AppText style={[styles.metricValue, { color: theme.text }]}>{completedTodayCount}</AppText>
            <AppText style={[styles.metricLabel, { color: theme.textSecondary }]}>Completed</AppText>
          </View>
        </View>

        {/* Workspace */}
        <AppText style={[styles.sectionHeading, { color: theme.text }]}>Workspace</AppText>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SettingsRow 
            icon={<MessageCircle size={20} color={theme.icon} />} 
            title="WhatsApp & Messaging" 
            theme={theme}
            onPress={() => toggleSection('whatsapp')}
            expanded={expandedSection === 'whatsapp'}
            value={settingsStore.whatsappMethod}
          />
          {expandedSection === 'whatsapp' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <AppText style={[styles.subText, { color: theme.textSecondary, marginBottom: 12 }]}>
                Choose how you want to send bulk WhatsApp messages. By default, the app uses your native WhatsApp application.
              </AppText>
              <View style={styles.methodSelector}>
                <TouchableOpacity 
                  style={[styles.methodOption, { borderColor: theme.border, backgroundColor: theme.surface }, settingsStore.whatsappMethod === 'APP' && { borderColor: theme.primaryDark, backgroundColor: theme.primaryDark + '10' }]}
                  onPress={() => settingsStore.setWhatsappMethod('APP')}
                >
                  <AppText style={[styles.methodOptionText, { color: theme.textSecondary }, settingsStore.whatsappMethod === 'APP' && { color: theme.primaryDark }]}>WhatsApp App (Default)</AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.methodOption, { borderColor: theme.border, backgroundColor: theme.surface }, settingsStore.whatsappMethod === 'API' && { borderColor: theme.primaryDark, backgroundColor: theme.primaryDark + '10' }]}
                  onPress={() => settingsStore.setWhatsappMethod('API')}
                >
                  <AppText style={[styles.methodOptionText, { color: theme.textSecondary }, settingsStore.whatsappMethod === 'API' && { color: theme.primaryDark }]}>WhatsApp Business API</AppText>
                </TouchableOpacity>
              </View>

              {settingsStore.whatsappMethod === 'API' && (
                <View style={[styles.apiSettingsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <AppText style={[styles.apiSettingsTitle, { color: theme.text }]}>API Configuration</AppText>
                  <View style={styles.inputGroup}>
                    <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>API URL Endpoint</AppText>
                    <TextInput
                      style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                      value={settingsStore.whatsappApiUrl}
                      onChangeText={settingsStore.setWhatsappApiUrl}
                      placeholder="https://graph.facebook.com/v17.0/..."
                      placeholderTextColor={theme.icon}
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>API Bearer Token</AppText>
                    <TextInput
                      style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                      value={settingsStore.whatsappApiToken}
                      onChangeText={settingsStore.setWhatsappApiToken}
                      placeholder="EAAPXxxx..."
                      placeholderTextColor={theme.icon}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                  <AppText style={[styles.apiSettingsHint, { color: theme.textSecondary }]}>
                    These credentials will be used to send bulk messages securely in the background.
                  </AppText>
                </View>
              )}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <SettingsRow icon={<Bell size={20} color={theme.icon} />} title="Notifications" theme={theme} onPress={() => toggleSection('notifications')} expanded={expandedSection === 'notifications'} />
          {expandedSection === 'notifications' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <View style={styles.settingsRow}>
                <AppText style={[styles.subText, { color: theme.text, flex: 1 }]}>Push Notifications</AppText>
                <Switch value={settingsStore.pushNotifications} onValueChange={(v) => settingsStore.setNotifications(v, settingsStore.emailNotifications)} trackColor={{ false: theme.border, true: theme.primaryDark }} />
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Accent Color Section */}
          <SettingsRow 
            icon={<Palette size={20} color={theme.icon} />} 
            title="Accent Color" 
            theme={theme} 
            value={
              <View style={[styles.currentColorIndicator, { backgroundColor: ACCENT_COLORS[accentColor]?.primary || theme.primaryDark }]} />
            }
            onPress={() => toggleSection('accentColor')} 
            expanded={expandedSection === 'accentColor'} 
          />
          {expandedSection === 'accentColor' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <View style={styles.colorGrid}>
                {accentColorsList.map((colorName) => {
                  const colorObj = ACCENT_COLORS[colorName];
                  const isSelected = accentColor === colorName;
                  return (
                    <View key={colorName} style={styles.colorItemContainer}>
                      <TouchableOpacity 
                        style={[
                          styles.colorCircle, 
                          { backgroundColor: colorObj.primary },
                          isSelected && [styles.selectedColorCircle, { borderColor: theme.text }]
                        ]}
                        onPress={() => setAccentColor(colorName)}
                        activeOpacity={0.8}
                      >
                        {isSelected && <Check size={16} color="#ffffff" />}
                      </TouchableOpacity>
                      <AppText style={[styles.colorName, { color: isSelected ? theme.text : theme.textSecondary, fontWeight: isSelected ? '600' : '400' }]}>
                        {colorName}
                      </AppText>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Typography Section */}
          <SettingsRow 
            icon={<Type size={20} color={theme.icon} />} 
            title="Typography" 
            theme={theme} 
            value={typography}
            isLast 
            onPress={() => toggleSection('typography')} 
            expanded={expandedSection === 'typography'} 
          />
          {expandedSection === 'typography' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <View style={styles.typographyList}>
                {typographyList.map((type) => {
                  const isSelected = typography === type;
                  let subtitle = '';
                  if (type === 'Modern') subtitle = 'Outfit / Inter';
                  if (type === 'Classic') subtitle = 'Playfair / Lora';
                  if (type === 'Geometric') subtitle = 'Montserrat / Open Sans';
                  if (type === 'Elegant') subtitle = 'Cinzel / Lato';

                  return (
                    <TouchableOpacity 
                      key={type} 
                      style={[styles.typographyRow, { borderTopColor: theme.border }]}
                      onPress={() => setTypography(type)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, { borderColor: isSelected ? theme.primaryDark : theme.border }]}>
                        {isSelected && <View style={[styles.radioInner, { backgroundColor: theme.primaryDark }]} />}
                      </View>
                      <View style={styles.typographyTextContainer}>
                        <AppText style={[styles.typographyText, { color: theme.text, fontWeight: isSelected ? '600' : '400' }]}>
                          {type}
                        </AppText>
                        {subtitle ? <AppText style={[styles.typographySubtitle, { color: theme.textSecondary }]}>{subtitle}</AppText> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <View style={{ paddingHorizontal: 4, marginTop: 12 }}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#fee2e2' }]} 
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <AppText style={[styles.logoutText, { color: '#ef4444' }]}>Sign out</AppText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <AppText style={[styles.apiSettingsTitle, { color: theme.text }]}>
              {isAdmin ? 'Edit Company Profile' : 'Edit Profile'}
            </AppText>
            
            {isAdmin ? (
              <View style={styles.inputGroup}>
                <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>Company Name</AppText>
                <TextInput
                  style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                  value={tempCompanyName}
                  onChangeText={setTempCompanyName}
                  placeholder="Enter company name"
                  placeholderTextColor={theme.icon}
                />
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</AppText>
                  <TextInput
                    style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="Enter full name"
                    placeholderTextColor={theme.icon}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>Job Role / Designation</AppText>
                  <TextInput
                    style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={tempRole}
                    onChangeText={setTempRole}
                    placeholder="e.g. Sales Executive"
                    placeholderTextColor={theme.icon}
                  />
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 8 }} onPress={() => setProfileModalVisible(false)}>
                <AppText style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 12, backgroundColor: theme.primaryDark, borderRadius: 8 }} onPress={handleSaveProfile}>
                <AppText style={{ color: '#fff', fontWeight: '600' }}>Save Changes</AppText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

// Helper Component for List Rows
const SettingsRow = ({ icon, title, theme, value, onPress, isLast, expanded }: any) => (
  <TouchableOpacity style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
    <View style={styles.settingsRowLeft}>
      {icon}
      <AppText style={[styles.settingsRowTitle, { color: theme.text }]}>{title}</AppText>
    </View>
    <View style={styles.settingsRowRight}>
      {React.isValidElement(value) ? (
        value
      ) : value ? (
        <AppText style={[styles.settingsRowValue, { color: theme.textSecondary }]}>{value}</AppText>
      ) : null}
      <ChevronRight 
        size={20} 
        color={theme.icon} 
        style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
      />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    padding: 20,
  },
  
  // Profile Card
  profileCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  activeStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: '#10b981',
    borderRadius: 7,
    borderWidth: 2,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 16,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  agentRole: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    padding: 10,
    borderRadius: 12,
  },

  // Headings
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Settings Groups
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsRowValue: {
    fontSize: 14,
    marginRight: 8,
  },
  divider: {
    height: 1,
    marginLeft: 48,
  },
  
  // Expanded Content (WhatsApp)
  expandedContent: {
    padding: 16,
    paddingLeft: 48,
  },
  subText: {
    fontSize: 13,
    lineHeight: 18,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  methodOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  methodOptionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  apiSettingsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  apiSettingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  apiSettingsHint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 8,
  },

  // Accent Color & Typography in Settings
  currentColorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  colorItemContainer: {
    alignItems: 'center',
    width: 52,
    marginBottom: 8,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedColorCircle: {
    borderWidth: 2.5,
  },
  colorName: {
    fontSize: 10,
    textAlign: 'center',
  },
  typographyList: {
    paddingTop: 4,
  },
  typographyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typographyTextContainer: {
    flex: 1,
  },
  typographyText: {
    fontSize: 14,
    marginBottom: 2,
  },
  typographySubtitle: {
    fontSize: 11,
  },
});
