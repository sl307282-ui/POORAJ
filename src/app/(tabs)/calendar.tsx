import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText } from '../../components/AppText';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { User, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useLeadStore } from '../../store/leadStore';

export default function CalendarScreen() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { leads, followUps } = useLeadStore();
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // We want to mark every date that has a follow-up
    leads.forEach(lead => {
      // Find the latest follow-up
      const leadFollows = followUps.filter(f => f.lead_id === lead.id);
      if (leadFollows.length > 0) {
        // Sort by created_at desc to get latest
        const latest = leadFollows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
        
        if (latest && latest.next_follow_up_date) {
          const date = latest.next_follow_up_date;
          if (!marks[date]) {
            marks[date] = { 
              selected: true, 
              selectedColor: theme.surfaceLight, 
              selectedTextColor: theme.primaryDark,
              marked: true, 
              dotColor: theme.primaryDark 
            };
          }
        }
      }
    });

    // Add selected state
    if (marks[selectedDate]) {
      marks[selectedDate] = { 
        ...marks[selectedDate], 
        selected: true, 
        selectedColor: theme.primaryDark, 
        selectedTextColor: '#ffffff',
        disableTouchEvent: true 
      };
    } else {
      marks[selectedDate] = { 
        selected: true, 
        selectedColor: theme.primaryDark, 
        selectedTextColor: '#ffffff',
        disableTouchEvent: true 
      };
    }
    
    return marks;
  }, [leads, followUps, selectedDate]);

  const selectedDayFollowUps = useMemo(() => {
    const results: any[] = [];
    leads.forEach(lead => {
      const leadFollows = followUps.filter(f => f.lead_id === lead.id);
      if (leadFollows.length > 0) {
        const latest = leadFollows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
        
        if (latest && latest.next_follow_up_date === selectedDate) {
          results.push({ lead, followUp: latest });
        }
      }
    });
    return results;
  }, [leads, followUps, selectedDate]);

  const renderDateHeader = () => {
    const dateObj = new Date(selectedDate);
    const isToday = selectedDate === today;
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    return (
      <View style={styles.dateHeader}>
        <AppText style={styles.dateTitle}>{isToday ? 'Today' : formattedDate}</AppText>
        <AppText style={styles.dateSubtitle}>{selectedDayFollowUps.length} follow-up{selectedDayFollowUps.length !== 1 ? 's' : ''} scheduled</AppText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTextContainer}>
          <AppText style={[styles.headerTitle, { color: theme.text }]}>Calendar</AppText>
          <AppText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage your follow-ups and meetings</AppText>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <Calendar
            key={mode}
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            enableSwipeMonths={true}
            theme={{
              backgroundColor: theme.surface,
              calendarBackground: theme.surface,
              textSectionTitleColor: theme.icon,
              selectedDayBackgroundColor: theme.primaryDark,
              selectedDayTextColor: '#ffffff',
              todayTextColor: theme.primaryDark,
              dayTextColor: theme.text,
              textDisabledColor: mode === 'dark' ? '#334155' : '#cbd5e1',
              dotColor: theme.primaryDark,
              selectedDotColor: '#ffffff',
              arrowColor: theme.primaryDark,
              monthTextColor: theme.text,
              textDayFontWeight: '500',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 15,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>

        {renderDateHeader()}

        <View style={styles.listContainer}>
          {selectedDayFollowUps.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color="#cbd5e1" style={styles.emptyIcon} />
              <AppText style={styles.emptyText}>No follow-ups for this date</AppText>
              <AppText style={styles.emptySubtext}>Select another date or add follow-ups from the leads page.</AppText>
            </View>
          ) : (
            selectedDayFollowUps.map((item) => (
              <TouchableOpacity
                key={item.lead.id}
                style={styles.card}
                onPress={() => router.push(`/lead/${item.lead.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <User size={20} color={theme.primaryDark} />
                  </View>
                  <View style={styles.leadInfo}>
                    <AppText style={styles.leadName}>{item.lead.name}</AppText>
                    <AppText style={styles.leadMobile}>{item.lead.mobile}</AppText>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                <View style={styles.divider} />
                <View style={styles.cardContent}>
                  <AppText style={styles.commentLabel}>Context:</AppText>
                  <AppText style={styles.commentText} numberOfLines={2}>
                    {item.followUp.comment || 'No notes provided'}
                  </AppText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.surfaceLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  calendarContainer: {
    backgroundColor: theme.surface,
    margin: 16,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  dateHeader: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  dateSubtitle: {
    fontSize: 14,
    color: theme.icon,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  leadMobile: {
    fontSize: 14,
    color: theme.icon,
  },
  divider: {
    height: 1,
    backgroundColor: theme.background,
    marginVertical: 12,
  },
  cardContent: {
    paddingLeft: 4,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.icon,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.icon,
    textAlign: 'center',
    lineHeight: 20,
  }
});
}
