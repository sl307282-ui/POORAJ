import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FollowUp, Lead } from '../models/types';

export const FOLLOW_UP_CHANNEL_ID = 'follow-up-reminders';
export const FOLLOW_UP_NOTIFICATION_PREFIX = 'followup-';

/**
 * Extracts and parses a follow-up Date and Time into a local Date object.
 * Supports:
 * - dateStr: "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", ISO strings
 * - comment: "(Time: 10:00 AM)", "(Time: 02:30 PM)"
 * - explicitTime: "10:00 AM", "14:30"
 * Defaults to 10:00 AM if no time is detected.
 */
export function parseFollowUpDateTime(
  dateStr: string | null | undefined,
  comment?: string | null,
  explicitTime?: string | null
): { targetDate: Date; timeDisplay: string; dateDisplay: string } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmedDate = dateStr.trim();
  if (!trimmedDate) return null;

  // 1. Extract Time
  let timeStr = explicitTime?.trim() || null;
  if (!timeStr && comment) {
    const timeMatch = comment.match(/\(Time:\s*([0-9]{1,2}:[0-9]{2}\s*(?:AM|PM)?)\)/i);
    if (timeMatch && timeMatch[1]) {
      timeStr = timeMatch[1].trim();
    }
  }

  let hours = 10;
  let minutes = 0;
  let displayTime = '10:00 AM';

  if (timeStr) {
    const timeRegex = /([0-9]{1,2}):([0-9]{2})\s*(AM|PM)?/i;
    const match = timeStr.match(timeRegex);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();

      if (meridiem) {
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        displayTime = `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')} ${meridiem}`;
      } else {
        // 24-hour format
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        displayTime = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      }
      hours = h;
      minutes = m;
    }
  }

  // 2. Parse Date
  let year: number;
  let month: number; // 0-indexed
  let day: number;

  if (trimmedDate.includes('-')) {
    const parts = trimmedDate.split('T')[0].split('-');
    if (parts.length >= 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      return null;
    }
  } else if (trimmedDate.includes('/')) {
    const parts = trimmedDate.split('/');
    if (parts.length >= 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      const p2 = parseInt(parts[2], 10);

      // Distinguish DD/MM/YYYY vs MM/DD/YYYY
      // In India and UK, DD/MM/YYYY is standard (e.g. 07/09/2026 = 7th September 2026)
      if (p0 <= 31 && p1 <= 12) {
        day = p0;
        month = p1 - 1;
        year = p2 < 100 ? 2000 + p2 : p2;
      } else {
        month = p0 - 1;
        day = p1;
        year = p2 < 100 ? 2000 + p2 : p2;
      }
    } else {
      return null;
    }
  } else {
    const parsed = new Date(trimmedDate);
    if (isNaN(parsed.getTime())) return null;
    year = parsed.getFullYear();
    month = parsed.getMonth();
    day = parsed.getDate();
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const targetDate = new Date(year, month, day, hours, minutes, 0, 0);
  if (isNaN(targetDate.getTime())) return null;

  const dateDisplay = targetDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return { targetDate, timeDisplay: displayTime, dateDisplay };
}

/**
 * Schedules a notification 1 hour before the follow-up time.
 * If scheduled within the next 1 hour, schedules an immediate reminder (in 5s).
 * If the follow-up is already in the past, no notification is scheduled.
 */
export async function scheduleFollowUpReminder(
  followUp: FollowUp,
  leadName?: string
): Promise<string | null> {
  try {
    if (!followUp || !followUp.id || !followUp.next_follow_up_date) {
      return null;
    }

    const parsed = parseFollowUpDateTime(
      followUp.next_follow_up_date,
      followUp.comment,
      followUp.follow_up_time
    );

    if (!parsed) {
      return null;
    }

    const { targetDate, timeDisplay, dateDisplay } = parsed;
    const now = Date.now();
    const targetTimestamp = targetDate.getTime();

    // Already in the past
    if (targetTimestamp <= now) {
      return null;
    }

    // Exactly 1 hour before
    const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
    const reminderTimestamp = targetTimestamp - ONE_HOUR_MS;

    let triggerDate: Date;
    let isUrgent = false;

    if (reminderTimestamp > now) {
      triggerDate = new Date(reminderTimestamp);
    } else {
      // Follow-up is within the next 1 hour; schedule 5 seconds from now
      triggerDate = new Date(now + 5000);
      isUrgent = true;
    }

    const notificationId = `${FOLLOW_UP_NOTIFICATION_PREFIX}${followUp.id}`;
    const displayName = leadName?.trim() || 'Customer';

    const title = '🔔 Follow-up Reminder';
    const body = `${displayName}\nFollow-up is scheduled at ${timeDisplay} today.\n1 hour remaining.`;

    // Expo Notifications automatically overwrites any scheduled notification with the same identifier
    const scheduledId = await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title,
        body,
        sound: 'reminder.wav',
        data: {
          type: 'follow_up',
          leadId: followUp.lead_id,
          followUpId: followUp.id,
        },
        categoryIdentifier: 'followup',
        color: '#0ea5e9',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: FOLLOW_UP_CHANNEL_ID,
      },
    });

    console.log(
      `[FollowUpReminder] Successfully scheduled reminder '${notificationId}' for ${triggerDate.toISOString()} (Follow-up at ${targetDate.toISOString()})`
    );

    return scheduledId;
  } catch (error) {
    console.error('[FollowUpReminder] Error scheduling follow-up reminder:', error);
    return null;
  }
}

/**
 * Cancels the scheduled reminder for a specific follow-up.
 */
export async function cancelFollowUpReminder(followUpId: string): Promise<void> {
  try {
    if (!followUpId) return;
    const notificationId = `${FOLLOW_UP_NOTIFICATION_PREFIX}${followUpId}`;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`[FollowUpReminder] Cancelled reminder '${notificationId}'`);
  } catch (error) {
    console.error(`[FollowUpReminder] Error cancelling reminder for follow-up ${followUpId}:`, error);
  }
}

/**
 * Cancels all scheduled reminders for all follow-ups of a given lead.
 */
export async function cancelLeadFollowUpReminders(
  followUps: FollowUp[],
  leadId: string
): Promise<void> {
  try {
    if (!leadId || !followUps?.length) return;
    const leadFollowUps = followUps.filter((f) => f.lead_id === leadId);
    await Promise.all(
      leadFollowUps.map((f) => cancelFollowUpReminder(f.id))
    );
  } catch (error) {
    console.error(`[FollowUpReminder] Error cancelling reminders for lead ${leadId}:`, error);
  }
}

/**
 * Synchronizes scheduled reminders for all active leads and their future follow-ups.
 * Safe to call on app startup.
 */
export async function syncAllFollowUpReminders(
  leads: Lead[],
  followUps: FollowUp[]
): Promise<void> {
  try {
    if (!leads?.length || !followUps?.length) return;

    // Filter out inactive/closed leads
    const activeLeadIds = new Set(
      leads
        .filter((l) => l.status !== 'Deal Closed' && l.status !== 'Lost')
        .map((l) => l.id)
    );

    const leadNameMap = new Map<string, string>();
    leads.forEach((l) => leadNameMap.set(l.id, l.name));

    const now = Date.now();

    for (const f of followUps) {
      if (!activeLeadIds.has(f.lead_id)) continue;
      if (!f.next_follow_up_date) continue;

      const parsed = parseFollowUpDateTime(
        f.next_follow_up_date,
        f.comment,
        f.follow_up_time
      );

      // Only schedule future follow-ups
      if (parsed && parsed.targetDate.getTime() > now) {
        const leadName = leadNameMap.get(f.lead_id);
        await scheduleFollowUpReminder(f, leadName);
      }
    }
  } catch (error) {
    console.error('[FollowUpReminder] Error syncing all follow-up reminders:', error);
  }
}
