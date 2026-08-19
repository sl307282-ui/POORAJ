import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText } from '../../components/AppText';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, Check, Calendar as CalendarIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, interpolateColor } from 'react-native-reanimated';
import { useLeadStore } from '../../store/leadStore';
import { FollowUpDatePicker } from '../../components/FollowUpDatePicker';

const FieldHighlight = ({ isActive, isExpanded, children, isLast, theme }: any) => {
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    if (isActive) {
      progress.value = withSequence(
        withTiming(1, { duration: 250 }),
        withTiming(0.2, { duration: 250 }),
        withTiming(1, { duration: 250 })
      );
    } else {
      progress.value = withTiming(0, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['transparent', 'rgba(2, 132, 199, 0.12)']
      )
    };
  });

  return (
    <Animated.View style={[{ 
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, 
      borderBottomColor: '#e2e8f0',
      zIndex: isExpanded ? 1000 : 1
    }, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const CUSTOMER_TYPES = ['Fresh Lead', 'Visited Customer', 'Existing Customer'];
const PROFILES = ['Govt Job', 'Private Job', 'Business', 'Other'];
const REQUIREMENTS = ['Investment', 'Self Use', 'Mix'];
const PROPERTY_TYPES = ['Plot', 'Villa', 'Shop', 'Farmhouse', 'Commercial'];
const SIZES = ['100', '200', '300', '400', '500', '800', '1000', 'Custom'];
const ROADS = ['30ft', '40ft', '60ft', '80ft', '100ft', '200ft'];
const FACINGS = ['East', 'West', 'North', 'South', 'Corner', 'Any'];
const LOAN_OPTIONS = ['No', 'Minimum', 'Max'];
const INDIA_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function NewLeadScreen() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { addLead, addFollowUp } = useLeadStore();
  
  const [customerType, setCustomerType] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [profile, setProfile] = useState('');
  const [customProfile, setCustomProfile] = useState('');
  const [requirement, setRequirement] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetUnit, setBudgetUnit] = useState('Lacs');
  const [propertyType, setPropertyType] = useState('');
  
  const [sizeOption, setSizeOption] = useState('');
  const [customSize, setCustomSize] = useState('');
  
  const [road, setRoad] = useState('');
  const [facing, setFacing] = useState('');
  const [location, setLocation] = useState('');
  const [loan, setLoan] = useState('');
  
  const [note, setNote] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  
  const [activeField, setActiveField] = useState<string>('');
  const inputRefs = React.useRef<{ [key: string]: TextInput | null }>({});

  React.useEffect(() => {
    // Start with the first data-entry field at the top
    const timer = setTimeout(() => {
      setExpandedDropdown('Customer Type');
      setActiveField('Customer Type');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = (currentField: string, selectedValue?: string) => {
    let nextField = '';
    switch (currentField) {
      case 'Customer Type': nextField = 'Customer Name *'; break;
      case 'Customer Name *': nextField = 'Mobile Number *'; break;
      case 'Mobile Number *': nextField = 'Address'; break;
      case 'Address': nextField = 'District'; break;
      case 'District': nextField = 'State'; break;
      case 'State': nextField = 'Profile'; break;
      case 'Profile': 
        nextField = (selectedValue === 'Other') ? 'Specify Profile' : 'Requirement'; 
        break;
      case 'Specify Profile': nextField = 'Requirement'; break;
      case 'Requirement': nextField = 'Budget'; break;
      case 'Budget': nextField = 'Property Type'; break;
      case 'Property Type': nextField = 'Size (sq yd)'; break;
      case 'Size (sq yd)': 
        nextField = (selectedValue === 'Custom') ? 'Custom Size' : 'Road Size'; 
        break;
      case 'Custom Size': nextField = 'Road Size'; break;
      case 'Road Size': nextField = 'Facing'; break;
      case 'Facing': nextField = 'Location'; break;
      case 'Location': nextField = 'Bank Loan'; break;
      case 'Bank Loan': nextField = 'Notes / Comments'; break;
      case 'Notes / Comments': nextField = 'Next Follow-up'; break;
    }

    if (nextField) {
      setActiveField(nextField);
      
      if (['Customer Type', 'State', 'Profile', 'Requirement', 'Property Type', 'Size (sq yd)', 'Road Size', 'Facing', 'Bank Loan'].includes(nextField)) {
        setTimeout(() => setExpandedDropdown(nextField), 350); 
      } else if (nextField === 'Next Follow-up') {
        setTimeout(() => setShowDatePicker(true), 350);
      } else {
        setTimeout(() => {
          if (inputRefs.current[nextField]) {
            inputRefs.current[nextField]?.focus();
          }
        }, 350);
      }
    } else {
      setActiveField('');
      setExpandedDropdown(null);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !mobile.trim()) {
      alert('Name and Mobile are mandatory fields.');
      return;
    }
    
    const finalSize = sizeOption === 'Custom' ? customSize : sizeOption;

    const createdLead = await addLead({
      customer_type: customerType || 'Fresh Lead',
      name,
      mobile,
      address,
      district,
      state,
      profile: profile === 'Other' && customProfile.trim() ? customProfile.trim() : (profile || 'Other'),
      requirement: requirement || 'Investment',
      budget: budget ? `${budget} ${budgetUnit}` : '',
      property_type: propertyType || 'Plot',
      size: finalSize,
      road_size: road,
      facing: facing || 'East',
      location,
      loan_requirement: loan || 'No',
      status: 'Fresh',
    } as any);

    if (createdLead && (note.trim() || nextVisit)) {
      await addFollowUp({
        lead_id: createdLead.id,
        comment: note.trim() || 'Lead created',
        visit_date: new Date().toISOString().split('T')[0],
        next_follow_up_date: nextVisit || null,
        reminder_sent: false,
      });
    }

    Alert.alert('Success', 'Lead has been saved successfully!');

    setCustomerType('');
    setName('');
    setMobile('');
    setAddress('');
    setDistrict('');
    setState('');
    setProfile('');
    setCustomProfile('');
    setRequirement('');
    setBudget('');
    setBudgetUnit('Lacs');
    setPropertyType('');
    setSizeOption('');
    setCustomSize('');
    setRoad('');
    setFacing('');
    setLocation('');
    setLoan('');
    setNote('');
    setNextVisit('');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderDropdown = (label: string, options: string[], selected: string, onSelect: (val: string) => void, isLast: boolean = false) => {
    const isExpanded = expandedDropdown === label;
    const displayValue = selected || 'Select option';
    const isPlaceholder = !selected;
    const isActive = activeField === label;
    
    return (
      <FieldHighlight isActive={isActive} isExpanded={isExpanded} isLast={isLast} theme={theme}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>{label}</AppText>
          <View style={styles.inputBoxContainer}>
            <TouchableOpacity 
              style={[styles.dropdownTriggerBox, isActive && styles.activeDropdownTriggerBox]} 
              onPress={() => {
                setExpandedDropdown(isExpanded ? null : label);
                setActiveField(label);
              }}
              activeOpacity={0.7}
            >
              <AppText style={[styles.dropdownTriggerText, isPlaceholder && styles.dropdownPlaceholder]} numberOfLines={1}>{displayValue}</AppText>
              <ChevronDown size={18} color="#94a3b8" style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.dropdownFloatingBody}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {options.map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={styles.dropdownFloatingOption}
                  onPress={() => {
                    onSelect(opt);
                    setExpandedDropdown(null);
                    handleNext(label, opt);
                  }}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.dropdownFloatingOptionText, selected === opt && styles.dropdownFloatingOptionTextSelected]}>
                    {opt}
                  </AppText>
                  {selected === opt && <Check size={16} color={theme.primaryDark} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </FieldHighlight>
    );
  };

  const renderSearchableDropdown = (label: string, options: string[], selected: string, onSelect: (val: string) => void, isLast: boolean = false) => {
    const isExpanded = expandedDropdown === label;
    const isActive = activeField === label;
    // Filter options based on typed text (must start with the typed letters, case-insensitive)
    const filteredOptions = options.filter(opt => opt.toLowerCase().startsWith(selected.toLowerCase()));
    
    return (
      <FieldHighlight isActive={isActive} isExpanded={isExpanded} isLast={isLast} theme={theme}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>{label}</AppText>
          <View style={styles.inputBoxContainer}>
            <View style={[styles.dropdownTriggerBox, { paddingVertical: 0 }, isActive && styles.activeDropdownTriggerBox]}>
              <TextInput
                ref={(el) => { inputRefs.current[label] = el; }}
                style={[styles.dropdownTriggerText, { flex: 1, paddingVertical: 10, outlineStyle: 'none' } as any]}
                value={selected}
                onChangeText={(val) => {
                  onSelect(val);
                  if (val.length > 0) setExpandedDropdown(label);
                }}
                onFocus={() => {
                  setExpandedDropdown(label);
                  setActiveField(label);
                }}
                placeholder="Type or select..."
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => {
                setExpandedDropdown(isExpanded ? null : label);
                setActiveField(label);
              }} style={{ padding: 10, marginRight: -10 }}>
                <ChevronDown size={18} color="#94a3b8" style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {isExpanded && filteredOptions.length > 0 && (
          <View style={styles.dropdownFloatingBody}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              {filteredOptions.map((opt) => (
                <TouchableOpacity 
                  key={opt} 
                  style={styles.dropdownFloatingOption}
                  onPress={() => {
                    onSelect(opt);
                    setExpandedDropdown(null);
                    handleNext(label, opt);
                  }}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.dropdownFloatingOptionText, selected === opt && styles.dropdownFloatingOptionTextSelected]}>
                    {opt}
                  </AppText>
                  {selected === opt && <Check size={16} color={theme.primaryDark} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </FieldHighlight>
    );
  };

  const renderTextInput = (label: string, value: string, onChange: (val: string) => void, placeholder: string, keyboardType: any = 'default', isLast: boolean = false, multiline: boolean = false, suffix?: any) => {
    const isActive = activeField === label;
    return (
      <FieldHighlight isActive={isActive} isExpanded={false} isLast={isLast} theme={theme}>
        <View style={[styles.fieldRow, multiline && { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
          <AppText style={[styles.fieldLabel, multiline && { marginTop: 10 }]}>{label}</AppText>
          <View style={[styles.inputBoxContainer, multiline && { paddingVertical: 0 }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                ref={(el) => { inputRefs.current[label] = el; }}
                style={[styles.boxInput, { flex: 1 }, multiline && { minHeight: 64, textAlignVertical: 'top' }, isActive && styles.activeDropdownTriggerBox]} 
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType}
                textAlign="left"
                multiline={multiline}
                numberOfLines={multiline ? 2 : 1}
                onFocus={() => {
                  setActiveField(label);
                  setExpandedDropdown(null);
                }}
                onSubmitEditing={() => {
                  if (!multiline) {
                    handleNext(label);
                  }
                }}
                returnKeyType={label === 'Notes / Comments' ? 'default' : 'next'}
              />
              {suffix && (
                typeof suffix === 'string' ? (
                  <AppText style={{ color: theme.text, fontWeight: '600', paddingRight: 15 }}>{suffix}</AppText>
                ) : suffix
              )}
            </View>
          </View>
        </View>
      </FieldHighlight>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>New Lead</AppText>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
          
          <View style={[styles.formSection, (expandedDropdown === 'Customer Type' || expandedDropdown === 'State') && { zIndex: 1000 }]}>
            {renderDropdown('Customer Type', CUSTOMER_TYPES, customerType, setCustomerType)}
            {renderTextInput('Customer Name *', name, setName, 'Enter customer name')}
            {renderTextInput('Mobile Number *', mobile, setMobile, 'Enter mobile number', 'phone-pad')}
            {renderTextInput('Address', address, setAddress, 'Enter address', 'default', false)}
            {renderTextInput('District', district, setDistrict, 'Enter district')}
            {renderSearchableDropdown('State', INDIA_STATES, state, setState, true)}
          </View>

          <AppText style={styles.sectionTitle}>Lead Preferences</AppText>
          <View style={[styles.formSection, (expandedDropdown === 'Profile' || expandedDropdown === 'Requirement' || expandedDropdown === 'Property Type' || expandedDropdown === 'Size (sq yd)') && { zIndex: 1000 }]}>
            {renderDropdown('Profile', PROFILES, profile, setProfile)}
            {profile === 'Other' && renderTextInput('Specify Profile', customProfile, setCustomProfile, 'Enter profile details')}
            {renderDropdown('Requirement', REQUIREMENTS, requirement, setRequirement)}
            {renderTextInput('Budget', budget, (val) => setBudget(val.replace(/[^0-9.]/g, '')), 'e.g. 50', 'numeric', false, false, 
              <View style={{ zIndex: expandedDropdown === 'BudgetUnit' ? 2000 : 1 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 15 }} 
                  onPress={() => setExpandedDropdown(expandedDropdown === 'BudgetUnit' ? null : 'BudgetUnit')}
                >
                  <AppText style={{ color: theme.text, fontWeight: '600' }}>{budgetUnit}</AppText>
                  <ChevronDown size={14} color="#0f172a" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                {expandedDropdown === 'BudgetUnit' && (
                  <View style={{ position: 'absolute', top: 30, right: 10, backgroundColor: theme.surface, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, elevation: 10, zIndex: 2000, width: 80 }}>
                    {['Lacs', 'Cr'].map((u, i) => (
                      <TouchableOpacity 
                        key={u} 
                        style={{ padding: 12, borderBottomWidth: i === 0 ? 1 : 0, borderBottomColor: '#f1f5f9' }}
                        onPress={() => { setBudgetUnit(u); setExpandedDropdown(null); }}
                      >
                        <AppText style={{ textAlign: 'center', fontWeight: budgetUnit === u ? '700' : '500', color: budgetUnit === u ? theme.primaryDark : theme.textSecondary }}>{u}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            {renderDropdown('Property Type', PROPERTY_TYPES, propertyType, setPropertyType)}
            {renderDropdown('Size (sq yd)', SIZES, sizeOption, setSizeOption, sizeOption !== 'Custom')}
            
            {sizeOption === 'Custom' && (
              renderTextInput('Custom Size', customSize, setCustomSize, 'e.g. 1500', 'default', true)
            )}
          </View>

          <AppText style={styles.sectionTitle}>Property Details</AppText>
          <View style={[styles.formSection, (expandedDropdown === 'Road Size' || expandedDropdown === 'Facing' || expandedDropdown === 'Bank Loan') && { zIndex: 1000 }]}>
            {renderDropdown('Road Size', ROADS, road, setRoad)}
            {renderDropdown('Facing', FACINGS, facing, setFacing)}
            {renderTextInput('Location', location, setLocation, 'e.g. Sector 62')}
            {renderDropdown('Bank Loan', LOAN_OPTIONS, loan, setLoan, true)}
          </View>


          <AppText style={styles.sectionTitle}>Initial Follow-up (Optional)</AppText>
          <View style={[styles.formSection, { zIndex: 100 }]}>
            {renderTextInput('Notes / Comments', note, setNote, 'Add any initial remarks about this lead', 'default', false, true)}
            <FieldHighlight isActive={activeField === 'Next Follow-up'} isExpanded={false} isLast={true} theme={theme}>
              <View style={styles.fieldRow}>
                <AppText style={styles.fieldLabel}>Next Follow-up</AppText>
                <View style={styles.inputBoxContainer}>
                  <TouchableOpacity 
                    style={[styles.dropdownTriggerBox, !nextVisit && { backgroundColor: theme.surfaceLight }, activeField === 'Next Follow-up' && styles.activeDropdownTriggerBox]} 
                    onPress={() => {
                      setActiveField('Next Follow-up');
                      setShowDatePicker(true);
                    }}
                  >
                    <AppText style={[styles.dropdownTriggerText, !nextVisit && { color: theme.icon }]}>
                      {nextVisit ? `📅 ${new Date(nextVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Select Date'}
                    </AppText>
                    <CalendarIcon size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>
            </FieldHighlight>
          </View>

          <TouchableOpacity style={styles.saveButtonContainer} onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Save size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <AppText style={styles.saveButtonText}>Save Lead</AppText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <FollowUpDatePicker
        visible={showDatePicker}
        initialDate={nextVisit}
        onClose={() => setShowDatePicker(false)}
        onSave={(date, time) => {
          setNextVisit(date);
          setShowDatePicker(false);
          setActiveField(''); // Clear active field when done
        }}
      />
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.icon,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 12,
  },
  formSection: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 1,
  },
  fieldContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    backgroundColor: theme.surface,
  },
  activeDropdownTriggerBox: {
    borderColor: '#0ea5e9', // Brighter blue for the input border focus
    borderWidth: 1.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.text,
    flex: 0.45,
    paddingRight: 8,
  },
  inputBoxContainer: {
    flex: 0.55,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  boxInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.surfaceLight,
  },
  dropdownTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.surfaceLight,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: theme.text,
    flexShrink: 1,
  },
  dropdownPlaceholder: {
    color: theme.divider,
  },
  dropdownFloatingBody: {
    marginTop: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
    width: '55%',
    marginRight: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.icon,
    borderRadius: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 9999,
  },
  dropdownFloatingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  dropdownFloatingOptionText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  dropdownFloatingOptionTextSelected: {
    color: '#0284c7',
    fontWeight: '600',
  },
  saveButtonContainer: {
    marginTop: 40,
    marginHorizontal: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    zIndex: -1,
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonText: {
    color: theme.surface,
    fontSize: 17,
    fontWeight: '700',
  },
});
}
