import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WhatsAppMethod = 'APP' | 'API';

export interface SettingsState {
  // WhatsApp
  whatsappMethod: WhatsAppMethod;
  whatsappApiUrl: string;
  whatsappApiToken: string;
  setWhatsappMethod: (method: WhatsAppMethod) => void;
  setWhatsappApiUrl: (url: string) => void;
  setWhatsappApiToken: (token: string) => void;

  // Agent Profile
  agentName: string;
  agentRole: string;
  agentInitials: string;
  setAgentProfile: (name: string, role: string, initials: string) => void;

  // Lead Preferences
  defaultLeadStatus: string;
  setDefaultLeadStatus: (status: string) => void;

  // Follow-up Settings
  defaultReminderTime: string;
  setDefaultReminderTime: (time: string) => void;

  // Notifications
  pushNotifications: boolean;
  emailNotifications: boolean;
  setNotifications: (push: boolean, email: boolean) => void;

  // Personalization
  language: string;
  setLanguage: (lang: string) => void;
  showMetricsOnHome: boolean;
  compactView: boolean;
  setDashboardPreferences: (showMetrics: boolean, compact: boolean) => void;

  // Privacy
  shareAnalytics: boolean;
  setShareAnalytics: (share: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      whatsappMethod: 'APP',
      whatsappApiUrl: '',
      whatsappApiToken: '',
      setWhatsappMethod: (method) => set({ whatsappMethod: method }),
      setWhatsappApiUrl: (url) => set({ whatsappApiUrl: url }),
      setWhatsappApiToken: (token) => set({ whatsappApiToken: token }),

      agentName: 'John Doe',
      agentRole: 'Senior Sales Executive',
      agentInitials: 'JD',
      setAgentProfile: (name, role, initials) => set({ agentName: name, agentRole: role, agentInitials: initials }),

      defaultLeadStatus: 'Fresh',
      setDefaultLeadStatus: (status) => set({ defaultLeadStatus: status }),

      defaultReminderTime: '10:00 AM',
      setDefaultReminderTime: (time) => set({ defaultReminderTime: time }),

      pushNotifications: true,
      emailNotifications: true,
      setNotifications: (push, email) => set({ pushNotifications: push, emailNotifications: email }),

      language: 'English (US)',
      setLanguage: (lang) => set({ language: lang }),
      
      showMetricsOnHome: true,
      compactView: false,
      setDashboardPreferences: (showMetrics, compact) => set({ showMetricsOnHome: showMetrics, compactView: compact }),

      shareAnalytics: true,
      setShareAnalytics: (share) => set({ shareAnalytics: share }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
