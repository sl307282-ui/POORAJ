import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCheck,
  CalendarClock,
  UserCheck,
  MapPin,
  Award,
  Users,
  Bell,
  BellOff,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import { useNotificationStore } from '../store/notificationStore';
import { useSettingsStore } from '../store/settingsStore';
import { AppNotification, NotificationType } from '../models/types';

const TYPE_CONFIG: Record<
  NotificationType,
  {
    label: string;
    color: string;
    icon: React.ComponentType<any>;
  }
> = {
  follow_up: {
    label: 'Follow-up',
    color: '#f59e0b',
    icon: CalendarClock,
  },
  lead_update: {
    label: 'Lead Update',
    color: '#0284c7',
    icon: UserCheck,
  },
  site_visit: {
    label: 'Site Visit',
    color: '#8b5cf6',
    icon: MapPin,
  },
  deal_closed: {
    label: 'Deal Closed',
    color: '#10b981',
    icon: Award,
  },
  team_update: {
    label: 'Team',
    color: '#0d9488',
    icon: Users,
  },
};

function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();
  const { setDashboardMode } = useSettingsStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('unread');

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const handleNotificationPress = async (item: AppNotification) => {
    // Automatically mark as read
    if (!item.read) {
      await markAsRead(item.id);
    }

    // Deep link to related record
    if (item.leadId) {
      router.push(`/lead/${item.leadId}`);
    } else if (item.teamId) {
      setDashboardMode('team');
      router.push('/(tabs)');
    }
  };

  const handleConfirmClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to remove all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.lead_update;
    const IconComponent = config.icon;
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isUnread
              ? `${config.color}0a`
              : theme.surface,
            borderColor: isUnread ? `${config.color}40` : theme.border,
            borderLeftColor: isUnread ? config.color : theme.border,
            borderLeftWidth: isUnread ? 4 : 1,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Left Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${config.color}18` },
          ]}
        >
          <IconComponent size={20} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Header row: Tag + Timestamp + Unread Dot */}
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${config.color}20` },
              ]}
            >
              <AppText style={[styles.typeBadgeText, { color: config.color }]}>
                {config.label}
              </AppText>
            </View>

            <View style={styles.timeRow}>
              <AppText style={[styles.timeText, { color: theme.textSecondary }]}>
                {formatRelativeTime(item.createdAt)}
              </AppText>
              {isUnread && (
                <View
                  style={[styles.unreadDot, { backgroundColor: config.color }]}
                />
              )}
            </View>
          </View>

          {/* Title */}
          <AppText
            style={[
              styles.cardTitle,
              {
                color: theme.text,
                fontWeight: isUnread ? '700' : '500',
              },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </AppText>

          {/* Body */}
          <AppText
            style={[styles.cardBody, { color: theme.textSecondary }]}
            numberOfLines={3}
          >
            {item.body}
          </AppText>

          {/* Action indicator / Footer */}
          <View style={styles.cardFooter}>
            {item.leadId ? (
              <View style={styles.linkIndicator}>
                <AppText style={[styles.linkText, { color: config.color }]}>
                  View Lead
                </AppText>
                <ChevronRight size={14} color={config.color} />
              </View>
            ) : item.teamId ? (
              <View style={styles.linkIndicator}>
                <AppText style={[styles.linkText, { color: config.color }]}>
                  View Team
                </AppText>
                <ChevronRight size={14} color={config.color} />
              </View>
            ) : (
              <View />
            )}

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteNotification(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color={theme.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <View>
            <AppText style={[styles.headerTitle, { color: theme.text }]}>
              Notifications
            </AppText>
            <AppText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </AppText>
          </View>
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: `${theme.primaryDark}15` }]}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <CheckCheck size={16} color={theme.primaryDark} />
              <AppText style={[styles.markAllText, { color: theme.primaryDark }]}>
                Mark all read
              </AppText>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && unreadCount === 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: theme.surfaceLight }]}
              onPress={handleConfirmClearAll}
              activeOpacity={0.7}
            >
              <AppText style={[styles.clearBtnText, { color: theme.textSecondary }]}>
                Clear
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeFilter === 'unread' && [
              styles.tabButtonActive,
              { backgroundColor: theme.primaryDark },
            ],
          ]}
          onPress={() => setActiveFilter('unread')}
        >
          <AppText
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              activeFilter === 'unread' && styles.tabTextActive,
            ]}
          >
            Unread ({unreadCount})
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeFilter === 'all' && [
              styles.tabButtonActive,
              { backgroundColor: theme.primaryDark },
            ],
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <AppText
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              activeFilter === 'all' && styles.tabTextActive,
            ]}
          >
            All ({notifications.length})
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}}
            tintColor={theme.primaryDark}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: `${theme.primaryDark}15` },
              ]}
            >
              <BellOff size={44} color={theme.primaryDark} />
            </View>
            <AppText style={[styles.emptyTitle, { color: theme.text }]}>
              {activeFilter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </AppText>
            <AppText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {activeFilter === 'unread'
                ? "You've read all your notifications! Check the 'All' tab to review previous updates."
                : 'Follow-up reminders, lead status changes, site visits, and team updates will appear here in real time.'}
            </AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
