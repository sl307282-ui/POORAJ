import { create } from 'zustand';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface SyncStoreState {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingOperations: number;
  
  setIsOnline: (online: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  enqueueOperation: () => void;
  processSyncQueue: () => Promise<void>;
  initializeNetworkListener: () => () => void;
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  isOnline: true,
  syncStatus: 'synced',
  pendingOperations: 0,
  
  setIsOnline: (online) => {
    const { pendingOperations, isOnline: wasOnline } = get();
    
    // Only process if status actually changed
    if (online !== wasOnline) {
      if (online) {
        if (pendingOperations > 0) {
          set({ isOnline: true, syncStatus: 'syncing' });
          get().processSyncQueue();
        } else {
          set({ isOnline: true, syncStatus: 'synced' });
        }
      } else {
        set({ isOnline: false, syncStatus: 'offline' });
      }
    }
  },
  
  setSyncStatus: (status) => set({ syncStatus: status }),
  
  enqueueOperation: () => {
    const { isOnline } = get();
    if (!isOnline) {
      set((state) => ({ pendingOperations: state.pendingOperations + 1, syncStatus: 'offline' }));
    } else {
      // Simulate instant sync when online
      set({ syncStatus: 'syncing' });
      setTimeout(() => {
        set({ syncStatus: 'synced' });
      }, 500);
    }
  },
  
  processSyncQueue: async () => {
    const { pendingOperations, isOnline } = get();
    if (!isOnline || pendingOperations === 0) return;
    
    set({ syncStatus: 'syncing' });
    
    // Simulate background sync processing
    await new Promise(resolve => setTimeout(resolve, Math.max(1000, pendingOperations * 300)));
    
    set({ syncStatus: 'synced', pendingOperations: 0 });
  },

  initializeNetworkListener: () => {
    let isConnected = true;
    
    const checkNetwork = async () => {
      try {
        // Fetch a tiny, highly-available file to check real connectivity
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD', 
          cache: 'no-store' 
        });
        
        const online = response.ok;
        if (online !== isConnected) {
          isConnected = online;
          get().setIsOnline(online);
        }
      } catch (error) {
        // Fetch failed, meaning no internet
        if (isConnected) {
          isConnected = false;
          get().setIsOnline(false);
        }
      }
    };
    
    // Check immediately on launch
    checkNetwork();
    
    // Poll every 5 seconds
    const interval = setInterval(checkNetwork, 5000);
    return () => clearInterval(interval);
  }
}));
