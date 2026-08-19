import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lead, FollowUp, Deal, LeadStatus } from '../models/types';
import { dummyLeads, dummyFollowUps, dummyDeals } from '../utils/dummyData';
import { useSyncStore } from './syncStore';

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
  addFollowUp: (followUp: Omit<FollowUp, 'id' | 'created_at'>) => Promise<void>;
  updateFollowUp: (id: string, updates: Partial<FollowUp>) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'created_at'>) => Promise<void>;
  
  // Selectors/Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: LeadStatus | 'All';
  setActiveFilter: (filter: LeadStatus | 'All') => void;
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

      fetchLeads: async () => {
        const currentState = get();
        if (currentState.leads.length > 0) return;

        set({ loading: true, error: null });
        try {
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
        }
      },

      addLead: async (lead) => {
        set({ loading: true, error: null });
        try {
          const newLead = {
            ...lead,
            id: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
            status: lead.status || 'Fresh',
          } as Lead;
          set((state) => ({ leads: [newLead, ...state.leads], loading: false }));
          useSyncStore.getState().enqueueOperation();
          return newLead;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          return undefined;
        }
      },

      updateLeadStatus: async (id, status) => {
        try {
          // Temporarily mock local state update without supabase
          set((state) => ({
            leads: state.leads.map((l) => (l.id === id ? { ...l, status } : l))
          }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      updateLead: async (id, updates) => {
        try {
          set((state) => ({
            leads: state.leads.map((l) => (l.id === id ? { ...l, ...updates } : l))
          }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      deleteLead: async (id) => {
        try {
          set((state) => ({
            leads: state.leads.filter((l) => l.id !== id),
            followUps: state.followUps.filter((f) => f.lead_id !== id),
            deals: state.deals.filter((d) => d.lead_id !== id),
          }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      addFollowUp: async (followUp) => {
        try {
          // Temporarily mock local state update
          const newFollowUp = {
            ...followUp,
            id: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
          } as FollowUp;
          set((state) => ({ followUps: [newFollowUp, ...state.followUps] }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      updateFollowUp: async (id, updates) => {
        try {
          set((state) => ({
            followUps: state.followUps.map(f => (f.id === id ? { ...f, ...updates } : f))
          }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      deleteFollowUp: async (id) => {
        try {
          set((state) => ({
            followUps: state.followUps.filter(f => f.id !== id)
          }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      addDeal: async (deal) => {
        try {
          // Temporarily mock local state update
          const newDeal = {
            ...deal,
            id: Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
          } as Deal;
          set((state) => ({ deals: [newDeal, ...state.deals] }));
          useSyncStore.getState().enqueueOperation();
        } catch (error: any) {
          set({ error: error.message });
        }
      }
    }),
    {
      name: 'pooraj-crm-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the core data, not the ephemeral loading/search state
      partialize: (state) => ({ 
        leads: state.leads, 
        followUps: state.followUps, 
        deals: state.deals 
      }),
    }
  )
);
