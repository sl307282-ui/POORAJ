import { useAppTheme } from '../../../hooks/useAppTheme';
import { AppText } from '../../../components/AppText';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLeadStore } from '../../../store/leadStore';

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

export default function EditLeadScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { leads, updateLead } = useLeadStore();
  const lead = leads.find(l => l.id === id);
  
  const [customerType, setCustomerType] = useState(lead?.customer_type || '');
  const [name, setName] = useState(lead?.name || '');
  const [mobile, setMobile] = useState(lead?.mobile || '');
  const [address, setAddress] = useState(lead?.address || '');
  const [district, setDistrict] = useState(lead?.district || '');
  const [state, setState] = useState(lead?.state || '');
  const [profile, setProfile] = useState(lead?.profile || '');
  const [requirement, setRequirement] = useState(lead?.requirement || '');
  const [budget, setBudget] = useState(lead?.budget || '');
  const [propertyType, setPropertyType] = useState(lead?.property_type || '');
  
  const [sizeOption, setSizeOption] = useState(
    lead?.size ? (SIZES.includes(lead.size) ? lead.size : 'Custom') : ''
  );
  const [customSize, setCustomSize] = useState(
    lead?.size && !SIZES.includes(lead.size) ? lead.size : ''
  );
  
  const [road, setRoad] = useState(lead?.road_size || '');
  const [facing, setFacing] = useState(lead?.facing || '');
  const [location, setLocation] = useState(lead?.location || '');
  const [loan, setLoan] = useState(lead?.loan_requirement || '');

  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !mobile.trim()) {
      alert('Name and Mobile are mandatory fields.');
      return;
    }
    
    const finalSize = sizeOption === 'Custom' ? customSize : sizeOption;

    await updateLead(id as string, {
      customer_type: customerType || 'Fresh Lead',
      name,
      mobile,
      address,
      district,
      state,
      profile: profile || 'Other',
      requirement: requirement || 'Investment',
      budget,
      property_type: propertyType || 'Plot',
      size: finalSize,
      road_size: road,
      facing: facing || 'East',
      location,
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
    // Filter options based on typed text (must start with the typed letters, case-insensitive)
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
                onFocus={() => setExpandedDropdown(label)}
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

  const renderTextInput = (label: string, value: string, onChange: (val: string) => void, placeholder: string, keyboardType: any = 'default', isLast: boolean = false, multiline: boolean = false) => {
    return (
      <View style={[styles.fieldContainer, isLast && { borderBottomWidth: 0 }]}>
        <View style={[styles.fieldRow, multiline && { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
          <AppText style={[styles.fieldLabel, multiline && { marginTop: 10 }]}>{label}</AppText>
          <View style={[styles.inputBoxContainer, multiline && { paddingVertical: 0 }]}>
            <TextInput 
              style={[styles.boxInput, multiline && { minHeight: 64, textAlignVertical: 'top' }]} 
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              value={value}
              onChangeText={onChange}
              keyboardType={keyboardType}
              textAlign="left"
              multiline={multiline}
              numberOfLines={multiline ? 2 : 1}
            />
          </View>
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
            {renderDropdown('Requirement', REQUIREMENTS, requirement, setRequirement)}
            {renderTextInput('Budget', budget, setBudget, 'e.g. 50 Lacs')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
  },
  formContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 12,
  },
  formSection: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
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
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  dropdownTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#0f172a',
    flexShrink: 1,
  },
  dropdownPlaceholder: {
    color: '#cbd5e1',
  },
  dropdownFloatingBody: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    right: 16,
    width: '55%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
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
    color: '#475569',
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
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});
