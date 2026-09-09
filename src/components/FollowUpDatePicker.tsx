import { useAppTheme } from '../hooks/useAppTheme';
import { AppText } from '../components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform, ScrollView } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import { ChevronDown, Check, Clock } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { Colors } from '../theme/colors';

interface FollowUpDatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dateStr: string, timeStr?: string) => void;
  initialDate?: string | null;
  initialTime?: string | null;
}

export function FollowUpDatePicker({ visible, onClose, onSave, initialDate, initialTime }: FollowUpDatePickerProps) {
  const { mode } = useThemeStore();
  const theme = useAppTheme();

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  
  // Time selection (07:00 AM to 10:00 PM)
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '10:00 AM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const timeListRef = useRef<ScrollView>(null);

  const timeOptions = [
    '07:00 AM', '07:30 AM',
    '08:00 AM', '08:30 AM',
    '09:00 AM', '09:30 AM',
    '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM',
    '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM',
    '08:00 PM', '08:30 PM',
    '09:00 PM', '09:30 PM',
    '10:00 PM',
  ];

  useEffect(() => {
    if (visible) {
      if (initialDate) setSelectedDate(initialDate);
      if (initialTime) setSelectedTime(initialTime);
      setShowTimePicker(false);
    }
  }, [visible, initialDate, initialTime]);

  useEffect(() => {
    if (showTimePicker && timeListRef.current) {
      const selectedIndex = timeOptions.indexOf(selectedTime);
      if (selectedIndex > 0) {
        setTimeout(() => {
          timeListRef.current?.scrollTo({
            y: Math.max(0, (selectedIndex - 1) * 44),
            animated: true,
          });
        }, 50);
      }
    }
  }, [showTimePicker]);

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
        <Pressable 
          style={[styles.sheet, { backgroundColor: theme.surface }]} 
          onPress={() => {
            if (showTimePicker) setShowTimePicker(false);
          }}
        >
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
          <View style={{ height: 295 }}>
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

          {/* Time Picker Dropdown */}
          <View style={styles.timeSection}>
            <View style={styles.timeLabelContainer}>
              <Clock size={18} color={theme.primaryDark} />
              <AppText style={[styles.timeLabel, { color: theme.text }]}>Time</AppText>
            </View>
            <TouchableOpacity 
              style={[
                styles.timeSelector, 
                { 
                  backgroundColor: theme.surfaceLight, 
                  borderColor: showTimePicker ? theme.primaryDark : theme.divider 
                }
              ]} 
              onPress={() => setShowTimePicker(!showTimePicker)}
              activeOpacity={0.7}
            >
              <AppText style={[styles.timeText, { color: theme.text }]}>{selectedTime}</AppText>
              <ChevronDown 
                size={16} 
                color={showTimePicker ? theme.primaryDark : theme.icon} 
                style={{ transform: [{ rotate: showTimePicker ? '180deg' : '0deg' }] }} 
              />
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <View style={[styles.timeDropdownCard, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
              <ScrollView 
                ref={timeListRef}
                style={styles.timeDropdownScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {timeOptions.map((t, idx) => {
                  const isSelected = selectedTime === t;
                  const isLast = idx === timeOptions.length - 1;
                  return (
                    <TouchableOpacity 
                      key={idx} 
                      style={[
                        styles.timeDropdownOption,
                        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.divider },
                        isSelected && { backgroundColor: `${theme.primaryDark}15` }
                      ]}
                      onPress={() => {
                        setSelectedTime(t);
                        setShowTimePicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <AppText 
                        style={[
                          styles.timeDropdownOptionText, 
                          { color: theme.textSecondary },
                          isSelected && [styles.timeDropdownOptionTextSelected, { color: theme.primaryDark }]
                        ]}
                      >
                        {t}
                      </AppText>
                      {isSelected && <Check size={16} color={theme.primaryDark} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
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
    paddingVertical: 12,
  },
  timeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeDropdownCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 180,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeDropdownScroll: {
    maxHeight: 180,
  },
  timeDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timeDropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeDropdownOptionTextSelected: {
    fontWeight: '700',
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
