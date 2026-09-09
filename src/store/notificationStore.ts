import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification, NotificationType, Lead, FollowUp } from '../models/types';
import { auth, db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
} from 'firebase/firestore';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  subscribeToNotifications: (userId: string) => () => void;
  createNotification: (notif: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    leadId?: string | null;
    teamId?: string | null;
  }) => Promise<string | undefined>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  syncDueReminders: (leads: Lead[], followUps: FollowUp[], userId: string) => Promise<void>;
}

const cleanData = (obj: Record<string, any>) => {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      initialized: false,

      subscribeToNotifications: (userId: string) => {
        if (!userId) return () => {};

        set({ loading: true });

        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const list: AppNotification[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<AppNotification, 'id'>),
            }));

            // Sort newest first
            list.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });

            const unread = list.filter((n) => !n.read).length;

            set({
              notifications: list,
              unreadCount: unread,
              loading: false,
              initialized: true,
            });
          },
          (err) => {
            console.error('[NotificationStore] Subscription error:', err);
            set({ loading: false });
          }
        );

        return unsubscribe;
      },

      createNotification: async (notif) => {
        try {
          const docData = cleanData({
            ...notif,
            read: false,
            createdAt: new Date().toISOString(),
          });

          const docRef = await addDoc(collection(db, 'notifications'), docData);
          const newNotif: AppNotification = { id: docRef.id, ...docData } as AppNotification;

          set((state) => {
            const updated = [newNotif, ...state.notifications.filter((n) => n.id !== docRef.id)];
            return {
              notifications: updated,
              unreadCount: updated.filter((n) => !n.read).length,
            };
          });

          return docRef.id;
        } catch (error) {
          console.error('[NotificationStore] createNotification error:', error);
          return undefined;
        }
      },

      markAsRead: async (id: string) => {
        // Optimistic update
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });

        try {
          await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (error) {
          console.error('[NotificationStore] markAsRead error:', error);
        }
      },

      markAllAsRead: async () => {
        const unreadItems = get().notifications.filter((n) => !n.read);
        if (unreadItems.length === 0) return;

        // Optimistic update
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));

        try {
          const batch = writeBatch(db);
          unreadItems.forEach((n) => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
          });
          await batch.commit();
        } catch (error) {
          console.error('[NotificationStore] markAllAsRead error:', error);
        }
      },

      deleteNotification: async (id: string) => {
        // Optimistic update
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });

        try {
          await deleteDoc(doc(db, 'notifications', id));
        } catch (error) {
          console.error('[NotificationStore] deleteNotification error:', error);
        }
      },

      clearAllNotifications: async () => {
        const currentNotifications = get().notifications;
        set({ notifications: [], unreadCount: 0 });

        try {
          const batch = writeBatch(db);
          currentNotifications.forEach((n) => {
            batch.delete(doc(db, 'notifications', n.id));
          });
          await batch.commit();
        } catch (error) {
          console.error('[NotificationStore] clearAllNotifications error:', error);
        }
      },

      syncDueReminders: async (leads: Lead[], followUps: FollowUp[], userId: string) => {
        if (!userId || !leads.length || !followUps.length) return;

        const today = new Date().toISOString().split('T')[0];
        const existingNotifications = get().notifications;
        const now = Date.now();

        // Find follow-ups due today
        for (const f of followUps) {
          if (f.next_follow_up_date === today) {
            const lead = leads.find((l) => l.id === f.lead_id);
            if (!lead) continue;

            // Check if reminder already created today for this follow-up
            const alreadyExists = existingNotifications.some((n) => {
              const sameLead = n.leadId === lead.id;
              const isFollowUp = n.type === 'follow_up';
              const isToday = n.createdAt?.startsWith(today);
              // Ensure we don't duplicate for the exact same follow-up ID if stored
              const isSameFollowUp = n.body.includes('1 hour remaining');
              return sameLead && isFollowUp && isToday && isSameFollowUp;
            });

            if (!alreadyExists) {
              // Calculate target time to match the push logic
              // Parse time from f.comment or use 10:00 AM
              let timeStr = f.follow_up_time?.trim() || null;
              if (!timeStr && f.comment) {
                const timeMatch = f.comment.match(/\(Time:\s*([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM)?)\)/i);
                if (timeMatch && timeMatch[1]) {
                  timeStr = timeMatch[1].trim();
                }
              }

              let h = 10;
              let m = 0;
              let displayTime = '10:00 AM';

              if (timeStr) {
                const timeRegex = /([0-9]{1,2}):([0-9]{2})\s*(AM|PM)?/i;
                const match = timeStr.match(timeRegex);
                if (match) {
                  h = parseInt(match[1], 10);
                  m = parseInt(match[2], 10);
                  const meridiem = match[3]?.toUpperCase();
                  if (meridiem) {
                    if (meridiem === 'PM' && h < 12) h += 12;
                    if (meridiem === 'AM' && h === 12) h = 0;
                    displayTime = `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')} ${meridiem}`;
                  } else {
                    const period = h >= 12 ? 'PM' : 'AM';
                    const h12 = h % 12 || 12;
                    displayTime = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
                  }
                }
              }

              const parts = today.split('-');
              const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]), h, m, 0, 0);
              const targetTimestamp = targetDate.getTime();
              const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
              
              // Only create if we are exactly at or past the 1-hour reminder mark
              if (now >= targetTimestamp - ONE_HOUR_MS) {
                await get().createNotification({
                  userId,
                  title: '🔔 Follow-up Reminder',
                  body: `${lead.name}\nFollow-up is scheduled at ${displayTime} today.\n1 hour remaining.`,
                  type: 'follow_up',
                  leadId: lead.id,
                });
              }
            }
          }
        }
      },
    }),
    {
      name: 'pooraj-notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
