import { useAppTheme } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Switch, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, Edit2, Users, CalendarClock, CheckCircle, 
  Settings, MessageCircle, Bell, Palette, Globe, 
  LayoutDashboard, Shield, Lock, Activity, LogOut, ChevronRight
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeStore } from '../store/themeStore';
import { useLeadStore } from '../store/leadStore';
import { Colors } from '../theme/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, toggleTheme } = useThemeStore();
  const theme = useAppTheme();
  
  const settingsStore = useSettingsStore();
  const { leads, followUps } = useLeadStore();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Modals state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [tempName, setTempName] = useState(settingsStore.agentName);
  const [tempRole, setTempRole] = useState(settingsStore.agentRole);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [tempPass, setTempPass] = useState('');

  // Metrics calculation
  const today = new Date().toISOString().split('T')[0];
  const totalLeads = leads.length;
  const latestFollowUps = leads.map(lead => followUps.find(f => f.lead_id === lead.id)).filter(Boolean);
  const dueTodayCount = latestFollowUps.filter(f => f?.next_follow_up_date === today).length || 0;
  const completedTodayCount = followUps.filter(f => f.created_at?.startsWith(today) || f.visit_date === today).length || 0;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSaveProfile = () => {
    const initials = tempName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JD';
    settingsStore.setAgentProfile(tempName, tempRole, initials);
    setProfileModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive',
        onPress: () => {
          Alert.alert('Logged Out', 'Your session has been cleared. (Simulated)');
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
        
        {/* Agent Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.profileInfoRow}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primaryDark + '20' }]}>
              <AppText style={[styles.avatarText, { color: theme.primaryDark }]}>{settingsStore.agentInitials}</AppText>
              <View style={[styles.activeStatusDot, { borderColor: theme.surface }]} />
            </View>
            <View style={styles.profileDetails}>
              <AppText style={[styles.agentName, { color: theme.text }]}>{settingsStore.agentName}</AppText>
              <AppText style={[styles.agentRole, { color: theme.textSecondary }]}>{settingsStore.agentRole}</AppText>
            </View>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.surfaceLight }]}
              onPress={() => {
                setTempName(settingsStore.agentName);
                setTempRole(settingsStore.agentRole);
                setProfileModalVisible(true);
              }}
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
          <SettingsRow icon={<Settings size={20} color={theme.icon} />} title="Lead Preferences" theme={theme} onPress={() => toggleSection('lead')} expanded={expandedSection === 'lead'} value={settingsStore.defaultLeadStatus} />
          
          {expandedSection === 'lead' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <AppText style={[styles.subText, { color: theme.textSecondary, marginBottom: 12 }]}>Default Lead Status</AppText>
              <View style={styles.methodSelector}>
                {['Fresh', 'Visited Customer', 'Existing Customer'].map((status) => (
                  <TouchableOpacity 
                    key={status}
                    style={[styles.methodOption, { borderColor: theme.border, backgroundColor: theme.surface }, settingsStore.defaultLeadStatus === status && { borderColor: theme.primaryDark, backgroundColor: theme.primaryDark + '10' }]}
                    onPress={() => settingsStore.setDefaultLeadStatus(status)}
                  >
                    <AppText style={[styles.methodOptionText, { color: theme.textSecondary }, settingsStore.defaultLeadStatus === status && { color: theme.primaryDark }]}>{status}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <SettingsRow icon={<CalendarClock size={20} color={theme.icon} />} title="Follow-up Settings" theme={theme} onPress={() => toggleSection('followup')} expanded={expandedSection === 'followup'} value={settingsStore.defaultReminderTime} />
          {expandedSection === 'followup' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <AppText style={[styles.subText, { color: theme.textSecondary, marginBottom: 12 }]}>Default Reminder Time</AppText>
              <View style={styles.methodSelector}>
                {['09:00 AM', '10:00 AM', '02:00 PM'].map((time) => (
                  <TouchableOpacity 
                    key={time}
                    style={[styles.methodOption, { borderColor: theme.border, backgroundColor: theme.surface }, settingsStore.defaultReminderTime === time && { borderColor: theme.primaryDark, backgroundColor: theme.primaryDark + '10' }]}
                    onPress={() => settingsStore.setDefaultReminderTime(time)}
                  >
                    <AppText style={[styles.methodOptionText, { color: theme.textSecondary }, settingsStore.defaultReminderTime === time && { color: theme.primaryDark }]}>{time}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
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
          
          <SettingsRow icon={<Bell size={20} color={theme.icon} />} title="Notifications" theme={theme} isLast onPress={() => toggleSection('notifications')} expanded={expandedSection === 'notifications'} />
          {expandedSection === 'notifications' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <View style={styles.settingsRow}>
                <AppText style={[styles.subText, { color: theme.text, flex: 1 }]}>Push Notifications</AppText>
                <Switch value={settingsStore.pushNotifications} onValueChange={(v) => settingsStore.setNotifications(v, settingsStore.emailNotifications)} trackColor={{ false: theme.border, true: theme.primaryDark }} />
              </View>
            </View>
          )}
        </View>

        {/* Personalization */}
        <AppText style={[styles.sectionHeading, { color: theme.text }]}>Personalization</AppText>
        <View style={[styles.settingsGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <Palette size={20} color={theme.icon} />
              <AppText style={[styles.settingsRowTitle, { color: theme.text }]}>Dark Mode</AppText>
            </View>
            <Switch 
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#94a3b8', true: theme.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor="#94a3b8"
              style={{ transform: Platform.OS === 'ios' ? [{ scale: 0.9 }] : undefined }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <SettingsRow icon={<Globe size={20} color={theme.icon} />} title="Language" theme={theme} value={settingsStore.language} onPress={() => toggleSection('lang')} expanded={expandedSection === 'lang'} />
          {expandedSection === 'lang' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <View style={styles.methodSelector}>
                {['English (US)', 'Spanish (ES)', 'French (FR)'].map((lang) => (
                  <TouchableOpacity 
                    key={lang}
                    style={[styles.methodOption, { borderColor: theme.border, backgroundColor: theme.surface }, settingsStore.language === lang && { borderColor: theme.primaryDark, backgroundColor: theme.primaryDark + '10' }]}
                    onPress={() => settingsStore.setLanguage(lang)}
                  >
                    <AppText style={[styles.methodOptionText, { color: theme.textSecondary }, settingsStore.language === lang && { color: theme.primaryDark }]}>{lang.split(' ')[0]}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <SettingsRow icon={<LayoutDashboard size={20} color={theme.icon} />} title="Dashboard Preferences" theme={theme} isLast onPress={() => toggleSection('dash')} expanded={expandedSection === 'dash'} />
          {expandedSection === 'dash' && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surfaceLight }]}>
              <View style={styles.settingsRow}>
                <AppText style={[styles.subText, { color: theme.text, flex: 1 }]}>Show Metrics on Home</AppText>
                <Switch value={settingsStore.showMetricsOnHome} onValueChange={(v) => settingsStore.setDashboardPreferences(v, settingsStore.compactView)} trackColor={{ false: theme.border, true: theme.primaryDark }} />
              </View>
              <View style={styles.settingsRow}>
                <AppText style={[styles.subText, { color: theme.text, flex: 1 }]}>Compact View</AppText>
                <Switch value={settingsStore.compactView} onValueChange={(v) => settingsStore.setDashboardPreferences(settingsStore.showMetricsOnHome, v)} trackColor={{ false: theme.border, true: theme.primaryDark }} />
              </View>
            </View>
          )}
        </View>


        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <AppText style={[styles.apiSettingsTitle, { color: theme.text }]}>Edit Profile</AppText>
            
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</AppText>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={tempName}
                onChangeText={setTempName}
                placeholderTextColor={theme.icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>Job Role</AppText>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={tempRole}
                onChangeText={setTempRole}
                placeholderTextColor={theme.icon}
              />
            </View>

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

      {/* Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPasswordModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
            <AppText style={[styles.apiSettingsTitle, { color: theme.text }]}>Change Password</AppText>
            
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: theme.textSecondary }]}>New Password</AppText>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                value={tempPass}
                onChangeText={setTempPass}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor={theme.icon}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={{ padding: 12, marginRight: 8 }} onPress={() => setPasswordModalVisible(false)}>
                <AppText style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={{ padding: 12, backgroundColor: theme.primaryDark, borderRadius: 8 }} onPress={() => {
                Alert.alert('Success', 'Password updated successfully!');
                setPasswordModalVisible(false);
              }}>
                <AppText style={{ color: '#fff', fontWeight: '600' }}>Update</AppText>
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
      {value && <AppText style={[styles.settingsRowValue, { color: theme.textSecondary }]}>{value}</AppText>}
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
});
