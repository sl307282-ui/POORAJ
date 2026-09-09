import { useAppTheme } from '../../../hooks/useAppTheme';
import { AppText } from '../../../components/AppText';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLeadStore } from '../../../store/leadStore';

const CUSTOMER_TYPES = ['Fresh Lead', 'Visited Customer', 'Existing Customer'];
const SOURCES = ['YouTube', 'Facebook', 'Paid Advertisement', 'Reference', 'Calling', 'Other sources'];
const PROFILES = ['Govt Job', 'Private Job', 'Business', 'Other'];
const REQUIREMENTS = ['Investment', 'Self Use', 'Mix', 'Rental'];
const PROPERTY_TYPES = [
  'Residential Plot',
  'Commercial Plot',
  'Industrial Plot',
  'Farmhouse',
  'Villa',
  'Shop',
  'Commercial Property',
  'Other'
];
const SIZES = ['100', '200', '300', '400', '500', '800', '1000', 'Custom'];
const ROAD_SIZES = ['30 ft', '40 ft', '50 ft', '80 ft', '100 ft', '200 ft'];
const FACINGS = ['East', 'West', 'North', 'South', 'Corner'];
const STATIONS = ['Jaipur', 'Ajmer', 'Bhiwadi', 'Mumbai', 'Other'];
const JAIPUR_LOCATIONS = [
  'Ajmer Road',
  'Sikar Road',
  'Sirsi Road',
  'Kalwad Road',
  'Mahindra SEZ',
  'Vatika',
  'Tonk Road',
  'Goner Road',
  'Agra Road',
  'Jagatpura',
  'Chaksu',
  'Mahla/Bagru',
  'Other'
];
const LOAN_OPTIONS = ['No', 'Minimum', 'Max'];
const INDIA_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function EditLeadScreen() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { leads, updateLead } = useLeadStore();
  const lead = leads.find(l => l.id === id);
  
  const parseInitialBudget = (rawBudget?: string) => {
    if (!rawBudget) return { val: '', unit: 'Lacs' };
    if (rawBudget.toLowerCase().includes('cr')) {
      return { val: rawBudget.replace(/[^0-9.]/g, ''), unit: 'Cr' };
    }
    return { val: rawBudget.replace(/[^0-9.]/g, ''), unit: 'Lacs' };
  };

  const parseInitialArray = (val?: string | string[]) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  const initialBudget = parseInitialBudget(lead?.budget);

  const [customerType, setCustomerType] = useState(lead?.customer_type || '');
  const [source, setSource] = useState(
    lead?.source ? (SOURCES.includes(lead.source) ? lead.source : 'Other sources') : ''
  );
  const [customSource, setCustomSource] = useState(
    lead?.source && !SOURCES.includes(lead.source) ? lead.source : ''
  );
  const [visitedLocation, setVisitedLocation] = useState(lead?.visited_location || '');
  const [propertyName, setPropertyName] = useState(lead?.property_name || '');
  const [name, setName] = useState(lead?.name || '');
  const [mobile, setMobile] = useState(lead?.mobile || '');
  const [mobileError, setMobileError] = useState('');
  const [address, setAddress] = useState(lead?.address || '');
  const [district, setDistrict] = useState(lead?.district || '');
  const [state, setState] = useState(lead?.state || '');
  const [profile, setProfile] = useState(lead?.profile || '');
  const [requirement, setRequirement] = useState(lead?.requirement || '');
  const [budget, setBudget] = useState(initialBudget.val);
  const [budgetUnit, setBudgetUnit] = useState(initialBudget.unit);
  const [propertyType, setPropertyType] = useState(
    lead?.property_type ? (PROPERTY_TYPES.includes(lead.property_type) ? lead.property_type : 'Other') : ''
  );
  const [customPropertyType, setCustomPropertyType] = useState(
    lead?.property_type && !PROPERTY_TYPES.includes(lead.property_type) ? lead.property_type : ''
  );
  
  const [sizeOption, setSizeOption] = useState(
    lead?.size ? (SIZES.includes(lead.size) ? lead.size : 'Custom') : ''
  );
  const [customSize, setCustomSize] = useState(
    lead?.size && !SIZES.includes(lead.size) ? lead.size : ''
  );
  
  const [roadSizes, setRoadSizes] = useState<string[]>(parseInitialArray(lead?.road_size));
  const [facings, setFacings] = useState<string[]>(parseInitialArray(lead?.facing));
  const [station, setStation] = useState(
    lead?.station ? (STATIONS.includes(lead.station) ? lead.station : 'Other') : ''
  );
  const [customStation, setCustomStation] = useState(
    lead?.station && !STATIONS.includes(lead.station) ? lead.station : ''
  );
  const [location, setLocation] = useState(
    lead?.station === 'Jaipur' 
      ? (lead?.location ? (JAIPUR_LOCATIONS.includes(lead.location) ? lead.location : 'Other') : '')
      : (lead?.location || '')
  );
  const [customLocation, setCustomLocation] = useState(
    lead?.station === 'Jaipur' && lead?.location && !JAIPUR_LOCATIONS.includes(lead.location) 
      ? lead.location 
      : ''
  );
  const [loan, setLoan] = useState(lead?.loan_requirement || '');

  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  const toggleRoadSize = (item: string) => {
    setRoadSizes(prev => 
      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
    );
  };

  const toggleFacing = (item: string) => {
    setFacings(prev => 
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
    setMobile(cleaned);
    if (cleaned.length > 0 && cleaned.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
    } else {
      setMobileError('');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Customer Name is a mandatory field.');
      return;
    }

    if (mobile.trim().length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      Alert.alert('Invalid Mobile Number', 'Mobile number must be exactly 10 digits (never more or less).');
      return;
    }
    
    const finalSize = sizeOption === 'Custom' ? customSize : sizeOption;
    const finalSource = customerType === 'Fresh Lead' 
      ? (source === 'Other sources' && customSource.trim() ? customSource.trim() : source) 
      : undefined;
    const finalVisitedLocation = customerType === 'Visited Customer' ? visitedLocation?.trim() : undefined;
    const finalPropertyName = customerType === 'Existing Customer' ? propertyName?.trim() : undefined;
    const finalStation = station === 'Other' && customStation.trim() ? customStation.trim() : station;
    const finalLocation = (station === 'Jaipur' && location === 'Other' && customLocation.trim()) 
      ? customLocation.trim() 
      : location;

    await updateLead(id as string, {
      customer_type: customerType || 'Fresh Lead',
      source: finalSource,
      visited_location: finalVisitedLocation,
      property_name: finalPropertyName,
      name,
      mobile,
      address,
      district,
      state,
      profile: profile || 'Other',
      requirement: requirement || 'Investment',
      budget: budget ? `${budget} ${budgetUnit}` : '',
      property_type: propertyType === 'Other' && customPropertyType.trim() ? customPropertyType.trim() : (propertyType || 'Residential Plot'),
      size: finalSize,
      road_size: roadSizes.join(', '),
      facing: facings.join(', '),
      station: finalStation,
      location: finalLocation,
      loan_requirement: loan || 'No',
    } as any);

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
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
    
    return (
      <View style={[styles.fieldContainer, isLast && { borderBottomWidth: 0 }, isExpanded && { zIndex: 1000 }]}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>{label}</AppText>
          <View style={styles.inputBoxContainer}>
            <TouchableOpacity 
              style={styles.dropdownTriggerBox} 
              onPress={() => setExpandedDropdown(isExpanded ? null : label)}
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
      </View>
    );
  };

  const renderSearchableDropdown = (label: string, options: string[], selected: string, onSelect: (val: string) => void, isLast: boolean = false) => {
    const isExpanded = expandedDropdown === label;
    const filteredOptions = options.filter(opt => opt.toLowerCase().startsWith(selected.toLowerCase()));
    
    return (
      <View style={[styles.fieldContainer, isLast && { borderBottomWidth: 0 }, isExpanded && { zIndex: 1000 }]}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>{label}</AppText>
          <View style={styles.inputBoxContainer}>
            <View style={[styles.dropdownTriggerBox, { paddingVertical: 0 }]}>
              <TextInput
                style={[styles.dropdownTriggerText, { flex: 1, paddingVertical: 10, outlineStyle: 'none' } as any]}
                value={selected}
                onChangeText={(val) => {
                  onSelect(val);
                  if (val.length > 0) setExpandedDropdown(label);
                }}
                onFocus={() => {
                  setExpandedDropdown(label);
                }}
                placeholder="Type or select..."
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setExpandedDropdown(isExpanded ? null : label)} style={{ padding: 10, marginRight: -10 }}>
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
      </View>
    );
  };

  const renderTextInput = (label: string, value: string, onChange: (val: string) => void, placeholder: string, keyboardType: any = 'default', isLast: boolean = false, multiline: boolean = false, suffix?: any, maxLength?: number, errorMessage?: string) => {
    return (
      <View style={[styles.fieldContainer, isLast && { borderBottomWidth: 0 }]}>
        <View style={[styles.fieldRow, multiline && { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
          <AppText style={[styles.fieldLabel, multiline && { marginTop: 10 }]}>{label}</AppText>
          <View style={[styles.inputBoxContainer, multiline && { paddingVertical: 0 }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                style={[
                  styles.boxInput, 
                  { flex: 1 },
                  multiline && { minHeight: 64, textAlignVertical: 'top' },
                  Boolean(errorMessage) && { borderColor: '#ef4444', borderWidth: 1 }
                ]} 
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                value={value}
                onChangeText={onChange}
                keyboardType={keyboardType}
                maxLength={maxLength}
                textAlign="left"
                multiline={multiline}
                numberOfLines={multiline ? 2 : 1}
              />
              {suffix && (
                <View style={{ marginLeft: 8 }}>
                  {typeof suffix === 'string' ? (
                    <AppText style={{ color: '#1e293b', fontWeight: '600', paddingRight: 8 }}>{suffix}</AppText>
                  ) : suffix}
                </View>
              )}
            </View>
            {errorMessage ? (
              <AppText style={{ color: '#ef4444', fontSize: 11, marginTop: 4, fontWeight: '500' }}>
                {errorMessage}
              </AppText>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const renderMultiSelect = (
    label: string, 
    options: string[], 
    selectedItems: string[], 
    onToggle: (item: string) => void,
    isLast: boolean = false
  ) => {
    return (
      <View style={[styles.fieldContainer, isLast && { borderBottomWidth: 0 }, { paddingVertical: 12, paddingHorizontal: 16 }]}>
        <View style={styles.multiSelectHeader}>
          <AppText style={styles.multiSelectLabel}>{label}</AppText>
          {selectedItems.length > 0 && (
            <View style={[styles.badgeContainer, { backgroundColor: theme.isDark ? 'rgba(14,165,233,0.2)' : 'rgba(2,132,199,0.1)' }]}>
              <AppText style={[styles.badgeText, { color: theme.primaryDark }]}>
                {selectedItems.length} selected
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.chipsRow}>
          {options.map((opt) => {
            const isSelected = selectedItems.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.multiSelectChip,
                  isSelected && [
                    styles.multiSelectChipActive,
                    { 
                      borderColor: theme.primaryDark,
                      backgroundColor: theme.isDark ? 'rgba(14, 165, 233, 0.22)' : 'rgba(2, 132, 199, 0.09)' 
                    }
                  ]
                ]}
                onPress={() => onToggle(opt)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.chipCheckbox,
                  isSelected && [styles.chipCheckboxActive, { backgroundColor: theme.primaryDark, borderColor: theme.primaryDark }]
                ]}>
                  {isSelected && <Check size={10} color="#ffffff" strokeWidth={3.5} />}
                </View>
                <AppText style={[
                  styles.multiSelectChipText,
                  isSelected && [styles.multiSelectChipTextActive, { color: theme.primaryDark }]
                ]}>
                  {opt}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Edit Lead</AppText>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
          
          <View style={[styles.formSection, (expandedDropdown === 'Customer Type' || expandedDropdown === 'Lead Source' || expandedDropdown === 'State') && { zIndex: 1000 }]}>
            {renderDropdown('Customer Type', CUSTOMER_TYPES, customerType, (val) => {
              setCustomerType(val);
              if (val !== 'Fresh Lead') {
                setSource('');
                setCustomSource('');
              }
              if (val !== 'Visited Customer') {
                setVisitedLocation('');
                setPropertyName('');
              }
            })}
            {customerType === 'Fresh Lead' && (
              <>
                {renderDropdown('Lead Source', SOURCES, source, setSource)}
                {source === 'Other sources' && (
                  renderTextInput('Specify Source', customSource, setCustomSource, 'Enter source details')
                )}
              </>
            )}
            {customerType === 'Visited Customer' && (
              <>
                {renderTextInput('📍 Location', visitedLocation, setVisitedLocation, 'Enter location')}
                {renderTextInput('🏠 Property Name', propertyName, setPropertyName, 'Enter property name')}
              </>
            )}
            {renderTextInput('Customer Name *', name, setName, 'Enter customer name')}
            {renderTextInput('Mobile Number *', mobile, handleMobileChange, 'Enter 10-digit mobile number', 'phone-pad', false, false, undefined, 10, mobileError)}
            {renderTextInput('Address', address, setAddress, 'Enter address', 'default', false)}
            {renderTextInput('District', district, setDistrict, 'Enter district')}
            {renderSearchableDropdown('State', INDIA_STATES, state, setState, true)}
          </View>

          <AppText style={styles.sectionTitle}>Lead Preferences</AppText>
          <View style={[styles.formSection, (expandedDropdown === 'Profile' || expandedDropdown === 'Requirement' || expandedDropdown === 'Property Type' || expandedDropdown === 'Size (sq yd)') && { zIndex: 1000 }]}>
            {renderDropdown('Profile', PROFILES, profile, setProfile)}
            {renderDropdown('Requirement', REQUIREMENTS, requirement, setRequirement)}
            {renderTextInput(
              'Budget', 
              budget, 
              (val) => setBudget(val.replace(/[^0-9.]/g, '')), 
              'e.g. 50', 
              'numeric', 
              false, 
              false, 
              <View style={styles.budgetUnitToggle}>
                <TouchableOpacity 
                  style={[styles.unitToggleBtn, budgetUnit === 'Lacs' && styles.unitToggleBtnActive]}
                  onPress={() => setBudgetUnit('Lacs')}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.unitToggleText, budgetUnit === 'Lacs' && styles.unitToggleTextActive]}>
                    Lacs
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.unitToggleBtn, budgetUnit === 'Cr' && styles.unitToggleBtnActive]}
                  onPress={() => setBudgetUnit('Cr')}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.unitToggleText, budgetUnit === 'Cr' && styles.unitToggleTextActive]}>
                    Cr
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
            {renderDropdown('Property Type', PROPERTY_TYPES, propertyType, setPropertyType)}
            {propertyType === 'Other' && (
              renderTextInput('Specify Property Type', customPropertyType, setCustomPropertyType, 'Enter property type details')
            )}
            {renderDropdown('Size (sq yd)', SIZES, sizeOption, setSizeOption, sizeOption !== 'Custom')}
            
            {sizeOption === 'Custom' && (
              renderTextInput('Custom Size', customSize, setCustomSize, 'e.g. 1500', 'default', true)
            )}
          </View>

          <AppText style={styles.sectionTitle}>Property Details</AppText>
          <View style={[styles.formSection, (expandedDropdown === 'Station' || expandedDropdown === 'Location' || expandedDropdown === 'Bank Loan') && { zIndex: 1000 }]}>
            {renderMultiSelect('Road Size', ROAD_SIZES, roadSizes, toggleRoadSize)}
            {renderMultiSelect('Property Facing', FACINGS, facings, toggleFacing)}
            {renderDropdown('Station', STATIONS, station, (val) => {
              setStation(val);
              if (val !== 'Other') setCustomStation('');
              setLocation('');
              setCustomLocation('');
            })}
            {station === 'Other' && (
              renderTextInput('Specify Station', customStation, setCustomStation, 'Enter station name')
            )}
            {station === 'Jaipur' ? (
              <>
                {renderDropdown('Location', JAIPUR_LOCATIONS, location, (val) => {
                  setLocation(val);
                  if (val !== 'Other') setCustomLocation('');
                })}
                {location === 'Other' && (
                  renderTextInput('Specify Location', customLocation, setCustomLocation, 'Enter custom location')
                )}
              </>
            ) : station ? (
              renderTextInput('Location', location, setLocation, 'Enter location')
            ) : null}
            {renderDropdown('Bank Loan', LOAN_OPTIONS, loan, setLoan, true)}
          </View>

          <TouchableOpacity style={styles.saveButtonContainer} onPress={handleSave} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Save size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <AppText style={styles.saveButtonText}>Save Changes</AppText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomColor: theme.border,
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
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
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
  budgetUnitToggle: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceLight,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  unitToggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitToggleBtnActive: {
    backgroundColor: theme.primaryDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  unitToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  unitToggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  multiSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  multiSelectLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.text,
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
  },
  multiSelectChipActive: {
    borderWidth: 1.5,
  },
  chipCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chipCheckboxActive: {},
  multiSelectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  multiSelectChipTextActive: {
    fontWeight: '700',
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
    borderBottomColor: theme.border,
  },
  dropdownFloatingOptionText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  dropdownFloatingOptionTextSelected: {
    color: theme.primaryDark,
    fontWeight: '600',
  },
  saveButtonContainer: {
    marginTop: 40,
    marginHorizontal: 16,
    shadowColor: theme.primaryDark,
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
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});}
