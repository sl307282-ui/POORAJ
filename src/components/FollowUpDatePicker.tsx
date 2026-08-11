import { useAppTheme } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform, ScrollView } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../theme/colors';

interface FollowUpDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dateStr: string, timeStr?: string) => void;
  initialDate?: string | null;
}

export function FollowUpDatePicker({ visible, onClose, onSave, initialDate }: FollowUpDatePickerProps) {
  const { mode } = useThemeStore();
  const theme = useAppTheme();

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  
  // Basic time selection (optional step)
  const [selectedTime, setSelectedTime] = useState<string>('10:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const timeOptions = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleQuickSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.dragHandle, { backgroundColor: theme.divider }]} />
          
          {/* Header */}
          <View style={styles.header}>
            <AppText style={[styles.title, { color: theme.text }]}>Follow-up Date</AppText>
            <AppText style={[styles.selectedDateText, { color: theme.primaryDark }]}>
              📅 {formatDateLabel(selectedDate)}  {selectedTime ? `🕒 ${selectedTime}` : ''}
            </AppText>
          </View>

          {/* Quick Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
            <TouchableOpacity 
              style={[styles.chip, { backgroundColor: theme.surfaceLight }, selectedDate === todayStr && [styles.chipActive, { borderColor: theme.primaryDark, backgroundColor: `${theme.primaryDark}15` }]]} 
              onPress={() => handleQuickSelect(todayStr)}
            >
              <AppText style={[styles.chipText, { color: theme.textSecondary }, selectedDate === todayStr && { color: theme.primaryDark }]}>Today</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.chip, { backgroundColor: theme.surfaceLight }, selectedDate === tomorrowStr && [styles.chipActive, { borderColor: theme.primaryDark, backgroundColor: `${theme.primaryDark}15` }]]} 
              onPress={() => handleQuickSelect(tomorrowStr)}
            >
              <AppText style={[styles.chipText, { color: theme.textSecondary }, selectedDate === tomorrowStr && { color: theme.primaryDark }]}>Tomorrow</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.chip, { backgroundColor: theme.surfaceLight }, selectedDate === nextWeekStr && [styles.chipActive, { borderColor: theme.primaryDark, backgroundColor: `${theme.primaryDark}15` }]]} 
              onPress={() => handleQuickSelect(nextWeekStr)}
            >
              <AppText style={[styles.chipText, { color: theme.textSecondary }, selectedDate === nextWeekStr && { color: theme.primaryDark }]}>Next Week</AppText>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Calendar (Smooth vertical scrolling) */}
          <View style={{ height: 350 }}>
            <CalendarList
              key={mode}
              horizontal={false}
              pagingEnabled={false}
              pastScrollRange={0}
              futureScrollRange={24}
              current={selectedDate}
              minDate={todayStr}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markingType={'custom'}
              markedDates={{
                [todayStr]: {
                  customStyles: {
                    container: { borderWidth: 1, borderColor: theme.primaryDark, borderRadius: 20 },
                    text: { color: theme.primaryDark, fontWeight: 'bold' }
                  }
                },
                [selectedDate]: {
                  customStyles: {
                    container: { backgroundColor: theme.primaryDark, borderRadius: 20 },
                    text: { color: 'white', fontWeight: 'bold' }
                  }
                }
              }}
              theme={{
                calendarBackground: theme.surface,
                textSectionTitleColor: theme.textSecondary,
                dayTextColor: theme.text,
                todayTextColor: theme.primaryDark,
                selectedDayTextColor: '#ffffff',
                monthTextColor: theme.text,
                selectedDayBackgroundColor: theme.primaryDark,
                arrowColor: theme.primaryDark,
                textDisabledColor: mode === 'dark' ? '#334155' : '#cbd5e1',
                textDayFontSize: 15,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
              }}
              style={styles.calendar}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.divider }]} />

          {/* Time Picker Toggle */}
          <View style={styles.timeSection}>
            <AppText style={[styles.timeLabel, { color: theme.text }]}>Time</AppText>
            <TouchableOpacity 
              style={[styles.timeSelector, { backgroundColor: theme.surfaceLight }]} 
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <AppText style={[styles.timeText, { color: theme.text }]}>{selectedTime}</AppText>
              <AppText style={[styles.timeArrow, { color: theme.icon }]}>▼</AppText>
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeOptionsContainer}>
              {timeOptions.map((t, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.timeOption, { backgroundColor: theme.surfaceLight }, selectedTime === t && { backgroundColor: theme.primaryDark }]}
                  onPress={() => {
                    setSelectedTime(t);
                    setShowTimePicker(false);
                  }}
                >
                  <AppText style={[styles.timeOptionText, { color: theme.textSecondary }, selectedTime === t && styles.timeOptionTextActive]}>{t}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.surfaceLight }]} onPress={onClose}>
              <AppText style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.primaryDark }]} 
              onPress={() => onSave(selectedDate, selectedTime)}
            >
              <AppText style={styles.saveBtnText}>Save Follow-up</AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chipsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  chipActive: {
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  calendar: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  timeArrow: {
    fontSize: 12,
  },
  timeOptionsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  timeOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  timeOptionText: {
    fontWeight: '600',
  },
  timeOptionTextActive: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
