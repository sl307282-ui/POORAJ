import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lead, FollowUp, Deal, LeadStatus } from '../models/types';
import { useSyncStore } from './syncStore';
import { useNotificationStore } from './notificationStore';
import { scheduleFollowUpReminder, cancelFollowUpReminder, cancelLeadFollowUpReminders } from '../utils/followUpReminders';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';

const cleanFirestoreData = (data: Record<string, any>) => {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
};

const logMarkActivity = async (
  activityType: 'Lead Added' | 'Follow Up' | 'Site Visit' | 'Deal Completed',
  points: number,
  leadId: string,
  leadName: string
) => {
  const user = auth.currentUser;
  if (!user) return;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const teamId = userDoc.exists() ? userDoc.data().teamId : null;
    
    await addDoc(collection(db, 'marks_log'), cleanFirestoreData({
      userId: user.uid,
      teamId: teamId || null,
      leadId: leadId || '',
      leadName: leadName || 'Unnamed Lead',
      activityType,
      points,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to log mark activity:', error);
  }
};

interface LeadStoreState {
  leads: Lead[];
  followUps: FollowUp[];
  deals: Deal[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<Lead | undefined>;
  updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'created_at'>, isInitial?: boolean, skipMark?: boolean) => Promise<void>;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'created_at'>) => Promise<void>;
  
  // Selectors/Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: LeadStatus | 'All';
  setActiveFilter: (filter: LeadStatus | 'All') => void;
  
  // Clear method
  clearData: () => void;
}

export const useLeadStore = create<LeadStoreState>()(
  persist(
    (set, get) => ({
      leads: [],
      followUps: [],
      deals: [],
      loading: false,
      error: null,
      
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      activeFilter: 'All',
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      
      clearData: () => set({ leads: [], followUps: [], deals: [] }),

      fetchLeads: async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        set({ loading: true, error: null });
        try {
          // Fetch Leads
          const leadsRef = collection(db, 'leads');
          // Important: Query enforces ownerUid for security rules (if team member)
          // Since Admin can read all, if they are admin, they might fetch all. For now, we enforce ownerUid based on the role logic (Team Member sees only theirs).
          // To keep it simple and safe for Team Members, we fetch where ownerUid == current user.
          // In a full implementation, Admin Dashboard would have a separate fetch.
          const q = query(leadsRef, where('ownerUid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const fetchedLeads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[];
          fetchedLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          // Similarly fetch followUps and deals (simplified here for brevity)
          const followUpsRef = collection(db, 'followUps');
          const followUpsSnapshot = await getDocs(query(followUpsRef, where('ownerUid', '==', user.uid)));
          const fetchedFollowUps = followUpsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FollowUp[];
          fetchedFollowUps.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          const dealsRef = collection(db, 'deals');
          const dealsSnapshot = await getDocs(query(dealsRef, where('ownerUid', '==', user.uid)));
          const fetchedDeals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[];
          fetchedDeals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          set({ leads: fetchedLeads, followUps: fetchedFollowUps, deals: fetchedDeals, loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addLead: async (lead) => {
        const user = auth.currentUser;
        if (!user) {
          console.error('[leadStore] addLead: User is not authenticated');
          return undefined;
        }

        // Duplicate check on 10-digit mobile number
        const cleanMobile = (lead.mobile || '').trim().replace(/\D/g, '').slice(-10);
        if (cleanMobile.length === 10) {
          const existing = get().leads.find((l) => {
            const m = (l.mobile || '').trim().replace(/\D/g, '').slice(-10);
            return m.length === 10 && m === cleanMobile;
          });
          if (existing) {
            console.warn('[leadStore] Duplicate lead detected with mobile:', cleanMobile);
            const msg = `Mobile number ${lead.mobile} is already registered for ${existing.name || 'another lead'}.`;
            set({ error: msg });
            throw new Error(msg);
          }
        }

        set({ loading: true, error: null });
        try {
          const newLeadData = cleanFirestoreData({
            ...lead,
            ownerUid: user.uid, // DB Level Security requirement
            created_at: new Date().toISOString(),
            status: lead.status || 'Fresh',
          });
          const docRef = await addDoc(collection(db, 'leads'), newLeadData);
          const newLead = { id: docRef.id, ...newLeadData } as Lead;
          
          // Log Mark in background for instant responsiveness
          logMarkActivity('Lead Added', 1, docRef.id, lead.name || 'New Lead').catch((err) => {
            console.error('[leadStore] logMarkActivity background error:', err);
          });
          // Trigger in-app notification removed as requested

          set((state) => ({ leads: [newLead, ...state.leads], loading: false }));
          return newLead;
        } catch (error: any) {
          console.error('[leadStore] addLead error:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateLeadStatus: async (id, status) => {
        try {
          await updateDoc(doc(db, 'leads', id), { status });
          
          const lead = get().leads.find(l => l.id === id);
          if (lead) {
            const user = auth.currentUser;
            if (status === 'Site Visit') {
              await logMarkActivity('Site Visit', 5, id, lead.name);
            }
          }
          
          if (status === 'Deal Closed' || status === 'Lost') {
            cancelLeadFollowUpReminders(get().followUps, id).catch(console.error);
          }

          set((state) => ({
            leads: state.leads.map((l) => (l.id === id ? { ...l, status } : l))
          }));
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      updateLead: async (id, updates) => {
        try {
          await updateDoc(doc(db, 'leads', id), cleanFirestoreData(updates));
          set((state) => ({
            leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates } : l))
          }));
        } catch (error: any) {
          console.error('[leadStore] updateLead error:', error);
          set({ error: error.message });
        }
      },

      deleteLead: async (id) => {
        try {
          await deleteDoc(doc(db, 'leads', id));
          cancelLeadFollowUpReminders(get().followUps, id).catch(console.error);
          set((state) => ({
            leads: state.leads.filter((l) => l.id !== id),
            followUps: state.followUps.filter((f) => f.lead_id !== id),
            deals: state.deals.filter((d) => d.lead_id !== id),
          }));
        } catch (error: any) {
          console.error('[leadStore] deleteLead error:', error);
          set({ error: error.message });
        }
      },

      addFollowUp: async (followUp, isInitial = false, skipMark = false) => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const newFollowUpData = cleanFirestoreData({
            ...followUp,
            is_initial: isInitial,
            ownerUid: user.uid,
            created_at: new Date().toISOString(),
          });
          const docRef = await addDoc(collection(db, 'followUps'), newFollowUpData);
          const newFollowUp = { id: docRef.id, ...newFollowUpData } as FollowUp;
          
          const lead = get().leads.find(l => l.id === followUp.lead_id);
          if (lead) {
            if (!isInitial && !skipMark) {
              await logMarkActivity('Follow Up', 2, lead.id, lead.name || 'Lead');
            }
            
            // Cancel any existing scheduled reminders for this lead since this is the new latest follow-up
            await cancelLeadFollowUpReminders(get().followUps, lead.id);

            // Schedule 2-hour prior local reminder notification
            if (newFollowUp.next_follow_up_date) {
              scheduleFollowUpReminder(newFollowUp, lead.name).catch(console.error);
            }
          }

          set((state) => ({ followUps: [newFollowUp, ...state.followUps] }));
        } catch (error: any) {
          console.error('[leadStore] addFollowUp error:', error);
          set({ error: error.message });
        }
      },

      updateFollowUp: async (id, updates) => {
        try {
          await updateDoc(doc(db, 'followUps', id), cleanFirestoreData(updates));
          set((state) => ({
            followUps: state.followUps.map(f => (f.id === id ? { ...f, ...updates } : f))
          }));

          // Accurately update or cancel scheduled notification
          const updated = get().followUps.find(f => f.id === id);
          if (updated) {
            const lead = get().leads.find(l => l.id === updated.lead_id);
            if (updated.next_follow_up_date) {
              scheduleFollowUpReminder(updated, lead?.name).catch(console.error);
            } else {
              cancelFollowUpReminder(id).catch(console.error);
            }
          }
        } catch (error: any) {
          console.error('[leadStore] updateFollowUp error:', error);
          set({ error: error.message });
        }
      },

      deleteFollowUp: async (id) => {
        try {
          await deleteDoc(doc(db, 'followUps', id));
          cancelFollowUpReminder(id).catch(console.error);
          set((state) => ({
            followUps: state.followUps.filter(f => f.id !== id)
          }));
        } catch (error: any) {
          console.error('[leadStore] deleteFollowUp error:', error);
          set({ error: error.message });
        }
      },

      addDeal: async (deal) => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const newDealData = cleanFirestoreData({
            ...deal,
            ownerUid: user.uid,
            created_at: new Date().toISOString(),
          });
          const docRef = await addDoc(collection(db, 'deals'), newDealData);
          const newDeal = { id: docRef.id, ...newDealData } as Deal;

          const lead = get().leads.find(l => l.id === deal.lead_id);
          await logMarkActivity('Deal Completed', 20, deal.lead_id, lead?.name || 'Customer');

          set((state) => ({ deals: [newDeal, ...state.deals] }));
        } catch (error: any) {
          console.error('[leadStore] addDeal error:', error);
          set({ error: error.message });
        }
      }
    }),
    {
      name: 'pooraj-crm-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        leads: state.leads, 
        followUps: state.followUps, 
        deals: state.deals 
      }),
    }
  )
);
