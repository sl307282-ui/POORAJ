import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { User, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useLeadStore } from '../../store/leadStore';

export default function CalendarScreen() {
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
              selectedColor: '#e0f2fe', 
              selectedTextColor: '#0284c7',
              marked: true, 
              dotColor: '#0284c7' 
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
        selectedColor: '#0284c7', 
        selectedTextColor: '#ffffff',
        disableTouchEvent: true 
      };
    } else {
      marks[selectedDate] = { 
        selected: true, 
        selectedColor: '#0284c7', 
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
        <Text style={styles.dateTitle}>{isToday ? 'Today' : formattedDate}</Text>
        <Text style={styles.dateSubtitle}>{selectedDayFollowUps.length} follow-up{selectedDayFollowUps.length !== 1 ? 's' : ''} scheduled</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Follow-up Calendar</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            enableSwipeMonths={true}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#64748b',
              selectedDayBackgroundColor: '#0284c7',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#0284c7',
              dayTextColor: '#334155',
              textDisabledColor: '#cbd5e1',
              dotColor: '#0284c7',
              selectedDotColor: '#ffffff',
              arrowColor: '#0284c7',
              monthTextColor: '#0f172a',
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
              <Text style={styles.emptyText}>No follow-ups for this date</Text>
              <Text style={styles.emptySubtext}>Select another date or add follow-ups from the leads page.</Text>
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
                    <User size={20} color="#0284c7" />
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{item.lead.name}</Text>
                    <Text style={styles.leadMobile}>{item.lead.mobile}</Text>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
                <View style={styles.divider} />
                <View style={styles.cardContent}>
                  <Text style={styles.commentLabel}>Context:</Text>
                  <Text style={styles.commentText} numberOfLines={2}>
                    {item.followUp.comment || 'No notes provided'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
    marginBottom: 4,
  },
  dateSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#f0f9ff',
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
    color: '#0f172a',
    marginBottom: 2,
  },
  leadMobile: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  cardContent: {
    paddingLeft: 4,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  }
});
