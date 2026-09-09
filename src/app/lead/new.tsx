import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText } from '../../components/AppText';
import { useThemeStore } from '../../store/themeStore';
import { Colors } from '../../theme/colors';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, ChevronDown, Check, Calendar as CalendarIcon, BookUser, Phone, ShieldCheck } from 'lucide-react-native';
import * as Contacts from 'expo-contacts';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, interpolateColor } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface DeviceContactItem {
  id?: string;
  name: string;
  phone: string;
  sanitizedPhone: string;
}

const sanitizePhoneNumber = (raw?: string | null): string => {
  if (!raw || typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
};

export default function NewLeadScreen() {
  const { mode } = useThemeStore();
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const router = useRouter();
  const { leads, addLead, addFollowUp } = useLeadStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customerType, setCustomerType] = useState('');
  const [source, setSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [visitedLocation, setVisitedLocation] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [profile, setProfile] = useState('');
  const [customProfile, setCustomProfile] = useState('');
  const [requirement, setRequirement] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetUnit, setBudgetUnit] = useState('Lacs');
  const [propertyType, setPropertyType] = useState('');
  const [customPropertyType, setCustomPropertyType] = useState('');
  
  const [sizeOption, setSizeOption] = useState('');
  const [customSize, setCustomSize] = useState('');
  
  const [roadSizes, setRoadSizes] = useState<string[]>([]);
  const [facings, setFacings] = useState<string[]>([]);
  const [station, setStation] = useState('');
  const [customStation, setCustomStation] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [loan, setLoan] = useState('');
  
  const [note, setNote] = useState('');
  const [nextVisit, setNextVisit] = useState('');
  const [nextVisitTime, setNextVisitTime] = useState('10:00 AM');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  
  const [activeField, setActiveField] = useState<string>('');
  const inputRefs = React.useRef<{ [key: string]: TextInput | null }>({});

  const HAS_PROMPTED_CONTACTS_KEY = '@contacts_permission_prompted_v2';

  // Contact Auto-Suggestion State (Safe, Privacy-First, 100% on-device)
  const [deviceContacts, setDeviceContacts] = useState<DeviceContactItem[]>([]);
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState<string>('not_asked');
  const [showRationaleModal, setShowRationaleModal] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState<DeviceContactItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const hasDismissedRationale = React.useRef(false);
  const hasLoadedContacts = React.useRef(false);

  // Load contacts strictly locally on the device (never uploaded or sent anywhere)
  const loadDeviceContacts = async (): Promise<DeviceContactItem[]> => {
    if (hasLoadedContacts.current && deviceContacts.length > 0) {
      return deviceContacts;
    }
    try {
      setIsLoadingContacts(true);
      let loaded: DeviceContactItem[] = [];

      // 1. Try expo-contacts/legacy getContactsAsync (most reliable across Android versions)
      try {
        const legacy = await import('expo-contacts/legacy');
        if (legacy && typeof legacy.getContactsAsync === 'function') {
          const res = await legacy.getContactsAsync({
            fields: [legacy.Fields.PhoneNumbers],
            sort: legacy.SortTypes.FirstName,
          });
          if (res?.data && Array.isArray(res.data)) {
            loaded = res.data
              .filter((c: any) => c && typeof c === 'object')
              .map((c: any) => {
                const fullName = (c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || '').trim();
                const primaryPhone = (c.phoneNumbers && Array.isArray(c.phoneNumbers) && c.phoneNumbers[0]?.number)
                  ? String(c.phoneNumbers[0].number || '')
                  : '';
                return {
                  id: c.id ? String(c.id) : undefined,
                  name: fullName,
                  phone: primaryPhone,
                  sanitizedPhone: sanitizePhoneNumber(primaryPhone),
                };
              })
              .filter((c: DeviceContactItem) => Boolean(c && c.name && c.name.length > 0));
          }
        }
      } catch (legacyErr) {
        console.log('Legacy getContactsAsync fallback notice:', legacyErr);
      }

      // 2. Fallback to modern Contact.getAllDetails if legacy yielded 0 contacts
      if (loaded.length === 0) {
        try {
          if (Contacts.Contact && typeof (Contacts.Contact as any).getAllDetails === 'function') {
            const details = await (Contacts.Contact as any).getAllDetails(
              [Contacts.ContactField.FULL_NAME, Contacts.ContactField.PHONES],
              { sortOrder: Contacts.ContactsSortOrder.GivenName }
            );
            if (Array.isArray(details)) {
              loaded = details
                .filter((c: any) => c && typeof c === 'object')
                .map((c: any) => {
                  const fullName = (c.fullName || [c.givenName, c.familyName].filter(Boolean).join(' ') || '').trim();
                  const primaryPhone = (c.phones && Array.isArray(c.phones) && c.phones[0]?.number)
                    ? String(c.phones[0].number || '')
                    : '';
                  return {
                    id: c.id ? String(c.id) : undefined,
                    name: fullName,
                    phone: primaryPhone,
                    sanitizedPhone: sanitizePhoneNumber(primaryPhone),
                  };
                })
                .filter((c: DeviceContactItem) => Boolean(c && c.name && c.name.length > 0));
            }
          }
        } catch (modernErr) {
          console.log('Contact.getAllDetails fallback notice:', modernErr);
        }
      }

      // Deduplicate contacts by name + phone
      const seen = new Set<string>();
      const uniqueContacts: DeviceContactItem[] = [];
      for (const c of loaded) {
        if (!c || !c.name) continue;
        const key = `${c.name.toLowerCase().trim()}|${c.sanitizedPhone || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueContacts.push(c);
        }
      }

      setDeviceContacts(uniqueContacts);
      hasLoadedContacts.current = true;
      return uniqueContacts;
    } catch (err) {
      console.warn('Error reading device contacts:', err);
      return [];
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Build unified contacts pool (device contacts + CRM leads)
  const getAllContactsPool = (contactsList: DeviceContactItem[] = deviceContacts): DeviceContactItem[] => {
    const pool: DeviceContactItem[] = [];
    const seen = new Set<string>();

    const safeList = Array.isArray(contactsList) ? contactsList : [];
    // 1. Device Contacts
    for (const c of safeList) {
      if (!c || !c.name || typeof c.name !== 'string' || !c.name.trim()) continue;
      const cleanName = c.name.trim();
      const sanitized = sanitizePhoneNumber(c.phone || c.sanitizedPhone || '');
      const key = `${cleanName.toLowerCase()}|${sanitized}`;
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({
          id: c.id ? String(c.id) : undefined,
          name: cleanName,
          phone: c.phone ? String(c.phone) : '',
          sanitizedPhone: sanitized,
        });
      }
    }

    const safeLeads = Array.isArray(leads) ? leads : [];
    // 2. Saved CRM Leads
    for (const l of safeLeads) {
      if (!l || !l.name || typeof l.name !== 'string' || !l.name.trim()) continue;
      const cleanName = l.name.trim();
      const sanitized = sanitizePhoneNumber(l.mobile || '');
      const key = `${cleanName.toLowerCase()}|${sanitized}`;
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({
          id: l.id ? String(l.id) : undefined,
          name: cleanName,
          phone: l.mobile ? String(l.mobile) : '',
          sanitizedPhone: sanitized,
        });
      }
    }

    return pool;
  };

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const checkInitialPermission = async () => {
      try {
        const { status } = await Contacts.getPermissionsAsync();
        if (status === 'granted') {
          setContactsPermissionStatus('granted');
          loadDeviceContacts();
        } else {
          const hasPrompted = await AsyncStorage.getItem(HAS_PROMPTED_CONTACTS_KEY);
          if (!hasPrompted) {
            setContactsPermissionStatus('not_asked');
            // Request permission when user first opens New Entry
            timer = setTimeout(() => {
              setShowRationaleModal(true);
            }, 600);
          } else {
            setContactsPermissionStatus('denied');
          }
        }
      } catch (err) {
        console.log('Initial contacts permission check error:', err);
      }
    };
    checkInitialPermission();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const filterContactSuggestions = (queryText?: string | null, currentDeviceContacts?: DeviceContactItem[]) => {
    if (!queryText || typeof queryText !== 'string') {
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = queryText.trim().toLowerCase();
    if (!query) {
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const pool = getAllContactsPool(currentDeviceContacts || deviceContacts);
    if (!pool || pool.length === 0) {
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const startsWithMatches: DeviceContactItem[] = [];
    const wordMatches: DeviceContactItem[] = [];
    const otherMatches: DeviceContactItem[] = [];

    for (const c of pool) {
      if (!c || !c.name) continue;
      const nameLower = (c.name || '').toLowerCase();
      if (nameLower.startsWith(query)) {
        startsWithMatches.push(c);
      } else {
        const words = nameLower.split(/\s+/).filter(Boolean);
        if (words.some((w: string) => w.startsWith(query))) {
          wordMatches.push(c);
        } else if (nameLower.includes(query)) {
          otherMatches.push(c);
        }
      }
      if (startsWithMatches.length + wordMatches.length + otherMatches.length >= 40) {
        break;
      }
    }

    // Sort alphabetically within each category for clean and smooth search experience
    const sortAlphabetical = (a: DeviceContactItem, b: DeviceContactItem) => (a.name || '').localeCompare(b.name || '');
    startsWithMatches.sort(sortAlphabetical);
    wordMatches.sort(sortAlphabetical);
    otherMatches.sort(sortAlphabetical);

    const results = [...startsWithMatches, ...wordMatches, ...otherMatches].slice(0, 15);
    setContactSuggestions(results);
    setShowSuggestions(results.length > 0);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    filterContactSuggestions(val);
  };

  const handleNameFocus = () => {
    setActiveField('Customer Name *');
    setExpandedDropdown(null);

    // Request permission when user first taps Name field if not yet asked
    if (contactsPermissionStatus === 'not_asked' && !hasDismissedRationale.current) {
      setShowRationaleModal(true);
    } else if (name.trim().length > 0) {
      filterContactSuggestions(name);
    }
  };

  const handleSelectContact = (contact: DeviceContactItem) => {
    if (!contact) {
      setShowSuggestions(false);
      return;
    }
    setName(contact.name || '');
    if (contact.sanitizedPhone && contact.sanitizedPhone.trim().length > 0) {
      setMobile(contact.sanitizedPhone);
      if (contact.sanitizedPhone.length === 10) {
        setMobileError('');
      } else {
        setMobileError('Mobile number must be exactly 10 digits');
      }
    }
    setShowSuggestions(false);
  };

  const handleConfirmPermission = async () => {
    setShowRationaleModal(false);
    try {
      await AsyncStorage.setItem(HAS_PROMPTED_CONTACTS_KEY, 'true');
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermissionStatus(status);
      if (status === 'granted') {
        const loaded = await loadDeviceContacts();
        if (name.trim().length > 0) {
          filterContactSuggestions(name, loaded);
        }
      }
    } catch (err) {
      console.warn('Contacts request error:', err);
    }
  };

  const handleDismissRationale = async () => {
    setShowRationaleModal(false);
    hasDismissedRationale.current = true;
    setContactsPermissionStatus('denied');
    try {
      await AsyncStorage.setItem(HAS_PROMPTED_CONTACTS_KEY, 'true');
    } catch (err) {
      // Ignore
    }
  };

  const handleTryAgainPermission = async () => {
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      setContactsPermissionStatus(status);
      if (status === 'granted') {
        const loaded = await loadDeviceContacts();
        if (name.trim().length > 0) {
          filterContactSuggestions(name, loaded);
        }
      } else if (!canAskAgain) {
        Linking.openSettings();
      }
    } catch (err) {
      Linking.openSettings();
    }
  };

  React.useEffect(() => {
    // Start with the first data-entry field at the top
    const timer = setTimeout(() => {
      setExpandedDropdown('Customer Type');
      setActiveField('Customer Type');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 10);
    setMobile(cleaned);
    if (cleaned.length > 0 && cleaned.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
    } else {
      setMobileError('');
    }
  };

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

  const handleNext = (currentField: string, selectedValue?: string) => {
    let nextField = '';
    switch (currentField) {
      case 'Customer Type': 
        if (selectedValue === 'Fresh Lead') {
          nextField = 'Lead Source';
        } else if (selectedValue === 'Visited Customer') {
          nextField = '📍 Location';
        } else {
          nextField = 'Customer Name *';
        }
        break;
      case 'Lead Source': 
        nextField = (selectedValue === 'Other sources') ? 'Specify Source' : 'Customer Name *'; 
        break;
      case 'Specify Source': nextField = 'Customer Name *'; break;
      case '📍 Location': nextField = '🏠 Property Name'; break;
      case '🏠 Property Name': nextField = 'Customer Name *'; break;
      case 'Customer Name *': nextField = 'Mobile Number *'; break;
      case 'Mobile Number *': 
        if (mobile.trim().length !== 10) {
          setMobileError('Mobile number must be exactly 10 digits');
          Alert.alert('Invalid Mobile Number', 'Mobile number must be exactly 10 digits (never more or less).');
          return;
        }
        setMobileError('');
        nextField = 'Address'; 
        break;
      case 'Address': nextField = 'District'; break;
      case 'District': nextField = 'State'; break;
      case 'State': nextField = 'Profile'; break;
      case 'Profile': 
        nextField = (selectedValue === 'Other') ? 'Specify Profile' : 'Requirement'; 
        break;
      case 'Specify Profile': nextField = 'Requirement'; break;
      case 'Requirement': nextField = 'Budget'; break;
      case 'Budget': nextField = 'Property Type'; break;
      case 'Property Type': 
        nextField = (selectedValue === 'Other') ? 'Specify Property Type' : 'Size (sq yd)'; 
        break;
      case 'Specify Property Type': nextField = 'Size (sq yd)'; break;
      case 'Size (sq yd)': 
        nextField = (selectedValue === 'Custom') ? 'Custom Size' : 'Station'; 
        break;
      case 'Custom Size': nextField = 'Station'; break;
      case 'Station': 
        if (selectedValue === 'Other') {
          nextField = 'Specify Station';
        } else if (selectedValue === 'Jaipur') {
          nextField = 'Location';
        } else {
          nextField = 'Location';
        }
        break;
      case 'Specify Station': nextField = 'Location'; break;
      case 'Location': 
        if (station === 'Jaipur' && selectedValue === 'Other') {
          nextField = 'Specify Location';
        } else {
          nextField = 'Bank Loan';
        }
        break;
      case 'Specify Location': nextField = 'Bank Loan'; break;
      case 'Bank Loan': nextField = 'Notes / Comments'; break;
      case 'Notes / Comments': nextField = 'Next Follow-up'; break;
    }

    if (nextField) {
      setActiveField(nextField);
      
      const isDropdownField = [
        'Customer Type', 
        'Lead Source', 
        'State', 
        'Profile', 
        'Requirement', 
        'Property Type', 
        'Size (sq yd)', 
        'Station', 
        (station === 'Jaipur' || (nextField === 'Location' && selectedValue === 'Jaipur') ? 'Location' : ''), 
        'Bank Loan'
      ].includes(nextField);

      if (isDropdownField) {
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
    if (isSubmitting) return;

    if (!name.trim()) {
      Alert.alert('Validation Error', 'Customer Name is a mandatory field.');
      return;
    }

    const cleanMobile = mobile.trim();
    if (cleanMobile.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      Alert.alert('Invalid Mobile Number', 'Mobile number must be exactly 10 digits (never more or less).');
      return;
    }

    // Instant Duplicate Check: Avoid duplicate entries if mobile number already exists
    const normalizedMobile = cleanMobile.replace(/\D/g, '').slice(-10);
    const duplicateLead = leads.find((l) => {
      const existingClean = (l.mobile || '').trim().replace(/\D/g, '').slice(-10);
      return existingClean.length === 10 && existingClean === normalizedMobile;
    });

    if (duplicateLead) {
      Alert.alert(
        'Mobile Number Already Exists',
        `This mobile number (${cleanMobile}) is already registered for:\n\nCustomer: ${duplicateLead.name || 'Unnamed'}\nStatus: ${duplicateLead.status || 'Fresh'}\n\nDuplicate entry cannot be saved.`
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      const finalSize = sizeOption === 'Custom' ? customSize : sizeOption;
      const finalSource = customerType === 'Fresh Lead' 
        ? (source === 'Other sources' && customSource.trim() ? customSource.trim() : source) 
        : '';
      const finalVisitedLocation = customerType === 'Visited Customer' ? visitedLocation.trim() : '';
      const finalPropertyName = customerType === 'Visited Customer' ? propertyName.trim() : '';
      const finalStation = station === 'Other' && customStation.trim() ? customStation.trim() : station;
      const finalLocation = (station === 'Jaipur' && location === 'Other' && customLocation.trim()) 
        ? customLocation.trim() 
        : location;

      const createdLead = await addLead({
        customer_type: customerType || 'Fresh Lead',
        source: finalSource || '',
        visited_location: finalVisitedLocation || '',
        property_name: finalPropertyName || '',
        name: name.trim(),
        mobile: cleanMobile,
        address: address.trim(),
        district: district.trim(),
        state: state.trim(),
        profile: profile === 'Other' && customProfile.trim() ? customProfile.trim() : (profile || 'Other'),
        requirement: requirement || 'Investment',
        budget: budget ? `${budget} ${budgetUnit}` : '',
        property_type: propertyType === 'Other' && customPropertyType.trim() ? customPropertyType.trim() : (propertyType || 'Residential Plot'),
        size: finalSize || '',
        road_size: roadSizes.join(', '),
        facing: facings.join(', '),
        station: finalStation || '',
        location: finalLocation || '',
        loan_requirement: loan || 'No',
        status: 'Fresh',
      } as any);

      if (!createdLead) {
        Alert.alert('Error', 'Failed to save lead. Please check your network connection and try again.');
        return;
      }

      if (note.trim() || nextVisit) {
        const followUpComment = note.trim() 
          ? `${note.trim()}${nextVisitTime ? ` (Time: ${nextVisitTime})` : ''}` 
          : (nextVisitTime ? `Follow-up scheduled at ${nextVisitTime}` : 'Lead created');

        await addFollowUp({
          lead_id: createdLead.id,
          comment: followUpComment,
          visit_date: new Date().toISOString().split('T')[0],
          next_follow_up_date: nextVisit || null,
          reminder_sent: false,
        }, true); // isInitial = true
      }

      Alert.alert('Success', 'Lead has been saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }
        }
      ]);

      setCustomerType('');
      setSource('');
      setCustomSource('');
      setVisitedLocation('');
      setPropertyName('');
      setName('');
      setMobile('');
      setMobileError('');
      setAddress('');
      setDistrict('');
      setState('');
      setProfile('');
      setCustomProfile('');
      setRequirement('');
      setBudget('');
      setBudgetUnit('Lacs');
      setPropertyType('');
      setCustomPropertyType('');
      setSizeOption('');
      setCustomSize('');
      setRoadSizes([]);
      setFacings([]);
      setStation('');
      setCustomStation('');
      setLocation('');
      setCustomLocation('');
      setLoan('');
      setNote('');
      setNextVisit('');
      setNextVisitTime('10:00 AM');
    } catch (err: any) {
      console.error('handleSave error:', err);
      Alert.alert('Unable to Save', err?.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
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

  const renderTextInput = (
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    placeholder: string, 
    keyboardType: any = 'default', 
    isLast: boolean = false, 
    multiline: boolean = false, 
    suffix?: any,
    maxLength?: number,
    errorMessage?: string
  ) => {
    const isActive = activeField === label;
    return (
      <FieldHighlight isActive={isActive} isExpanded={false} isLast={isLast} theme={theme}>
        <View style={[styles.fieldRow, multiline && { minHeight: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
          <AppText style={[styles.fieldLabel, multiline && { marginTop: 10 }]}>{label}</AppText>
          <View style={[styles.inputBoxContainer, multiline && { paddingVertical: 0 }]}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                ref={(el) => { inputRefs.current[label] = el; }}
                style={[
                  styles.boxInput, 
                  { flex: 1 }, 
                  multiline && { minHeight: 64, textAlignVertical: 'top' }, 
                  isActive && styles.activeDropdownTriggerBox,
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
                onFocus={() => {
                  setActiveField(label);
                  setExpandedDropdown(null);
                  setShowSuggestions(false);
                }}
                onSubmitEditing={() => {
                  if (!multiline) {
                    handleNext(label);
                  }
                }}
                returnKeyType={label === 'Notes / Comments' ? 'default' : 'next'}
              />
              {suffix && (
                <View style={{ marginLeft: 8 }}>
                  {typeof suffix === 'string' ? (
                    <AppText style={{ color: theme.text, fontWeight: '600', paddingRight: 8 }}>{suffix}</AppText>
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
      </FieldHighlight>
    );
  };

  const renderCustomerNameField = () => {
    const label = 'Customer Name *';
    const isActive = activeField === label;
    const isExpanded = showSuggestions && contactSuggestions.length > 0;

    return (
      <FieldHighlight isActive={isActive} isExpanded={isExpanded} isLast={false} theme={theme}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>{label}</AppText>
          <View style={styles.inputBoxContainer}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                ref={(el) => { inputRefs.current[label] = el; }}
                style={[
                  styles.boxInput, 
                  { flex: 1, paddingRight: 36 }, 
                  isActive && styles.activeDropdownTriggerBox,
                ]} 
                placeholder="Enter customer name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={handleNameChange}
                onFocus={handleNameFocus}
                onSubmitEditing={() => handleNext(label)}
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.contactIconTrigger}
                onPress={async () => {
                  if (contactsPermissionStatus === 'not_asked') {
                    setShowRationaleModal(true);
                  } else if (contactsPermissionStatus === 'denied') {
                    handleTryAgainPermission();
                  } else if (contactsPermissionStatus === 'granted') {
                    if (showSuggestions) {
                      setShowSuggestions(false);
                    } else {
                      const pool = getAllContactsPool();
                      if (name.trim().length > 0) {
                        filterContactSuggestions(name);
                      } else if (pool.length > 0) {
                        setContactSuggestions(pool.slice(0, 15));
                        setShowSuggestions(true);
                      } else {
                        const loaded = await loadDeviceContacts();
                        if (loaded && loaded.length > 0) {
                          setContactSuggestions(loaded.slice(0, 15));
                          setShowSuggestions(true);
                        }
                      }
                    }
                  }
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <BookUser 
                  size={18} 
                  color={
                    contactsPermissionStatus === 'granted' 
                      ? theme.primaryDark 
                      : theme.textSecondary
                  } 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Real-Time Contact Suggestions Floating Dropdown */}
        {isExpanded && (
          <View style={styles.contactSuggestionsFloatingBox}>
            <View style={styles.contactSuggestionsHeader}>
              <AppText style={styles.contactSuggestionsHeaderText}>
                Suggested Contacts ({contactSuggestions.length})
              </AppText>
              <TouchableOpacity 
                onPress={() => setShowSuggestions(false)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <AppText style={styles.contactSuggestionsCloseText}>✕</AppText>
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={{ maxHeight: 220 }} 
              nestedScrollEnabled={true} 
              keyboardShouldPersistTaps="handled"
            >
              {contactSuggestions.map((item, idx) => {
                if (!item || !item.name) return null;
                const initialChar = ((item.name || '').trim()[0] || 'C').toUpperCase();
                const displayPhone = item.phone ? String(item.phone) : '';
                return (
                  <TouchableOpacity 
                    key={`${item.name}-${displayPhone}-${idx}`}
                    style={styles.contactSuggestionItem}
                    onPress={() => handleSelectContact(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: theme.isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(2, 132, 199, 0.1)' }]}>
                      <AppText style={[styles.contactAvatarText, { color: theme.primaryDark }]}>
                        {initialChar}
                      </AppText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <AppText style={styles.contactSuggestionName} numberOfLines={1}>
                        {item.name}
                      </AppText>
                      {displayPhone ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Phone size={11} color="#64748b" style={{ marginRight: 4 }} />
                          <AppText style={styles.contactSuggestionPhone} numberOfLines={1}>
                            {displayPhone}
                          </AppText>
                        </View>
                      ) : (
                        <AppText style={[styles.contactSuggestionPhone, { fontStyle: 'italic', opacity: 0.7 }]}>
                          No phone number
                        </AppText>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </FieldHighlight>
    );
  };

  const renderBudgetField = () => {
    const label = 'Budget';
    const isActive = activeField === label;
    const isDropdownOpen = expandedDropdown === 'Budget Unit';

    return (
      <FieldHighlight isActive={isActive} isExpanded={isDropdownOpen} isLast={false} theme={theme}>
        <View style={styles.fieldRow}>
          <AppText style={styles.fieldLabel}>{label}</AppText>
          <View style={styles.inputBoxContainer}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                ref={(el) => { inputRefs.current[label] = el; }}
                style={[
                  styles.boxInput, 
                  { flex: 1 }, 
                  isActive && styles.activeDropdownTriggerBox,
                ]} 
                placeholder="e.g. 50"
                placeholderTextColor="#94a3b8"
                value={budget}
                onChangeText={(val) => setBudget(val.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                onFocus={() => {
                  setActiveField(label);
                  setExpandedDropdown(null);
                  setShowSuggestions(false);
                }}
                onSubmitEditing={() => handleNext(label)}
                returnKeyType="next"
              />
              <TouchableOpacity
                style={[
                  styles.budgetDropdownTrigger, 
                  isDropdownOpen && styles.activeDropdownTriggerBox
                ]}
                onPress={() => {
                  setExpandedDropdown(isDropdownOpen ? null : 'Budget Unit');
                  setActiveField(label);
                }}
                activeOpacity={0.7}
              >
                <AppText style={styles.budgetDropdownTriggerText}>{budgetUnit}</AppText>
                <ChevronDown 
                  size={15} 
                  color="#64748b" 
                  style={{ 
                    marginLeft: 5, 
                    transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] 
                  }} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Floating Unit Dropdown Menu */}
        {isDropdownOpen && (
          <View style={styles.budgetDropdownFloatingMenu}>
            {['Lacs', 'Cr'].map((unit) => (
              <TouchableOpacity
                key={unit}
                style={[
                  styles.budgetDropdownOption,
                  budgetUnit === unit && { backgroundColor: theme.isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(2, 132, 199, 0.08)' }
                ]}
                onPress={() => {
                  setBudgetUnit(unit);
                  setExpandedDropdown(null);
                }}
                activeOpacity={0.7}
              >
                <AppText style={[
                  styles.budgetDropdownOptionText,
                  budgetUnit === unit && styles.budgetDropdownOptionTextSelected
                ]}>
                  {unit}
                </AppText>
                {budgetUnit === unit && <Check size={14} color={theme.primaryDark} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </FieldHighlight>
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
        <AppText style={styles.headerTitle}>New Lead</AppText>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.formContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={[styles.formSection, (expandedDropdown === 'Customer Type' || expandedDropdown === 'Lead Source' || expandedDropdown === 'State' || showSuggestions) && { zIndex: 1000 }]}>
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
            {renderCustomerNameField()}
            {renderTextInput('Mobile Number *', mobile, handleMobileChange, 'Enter 10-digit mobile number', 'phone-pad', false, false, undefined, 10, mobileError)}
            {renderTextInput('Address', address, setAddress, 'Enter address', 'default', false)}
            {renderTextInput('District', district, setDistrict, 'Enter district')}
            {renderSearchableDropdown('State', INDIA_STATES, state, setState, true)}
          </View>

          <AppText style={styles.sectionTitle}>Lead Preferences</AppText>
          <View style={[styles.formSection, (expandedDropdown === 'Profile' || expandedDropdown === 'Requirement' || expandedDropdown === 'Budget Unit' || expandedDropdown === 'Property Type' || expandedDropdown === 'Size (sq yd)') && { zIndex: 1000 }]}>
            {renderDropdown('Profile', PROFILES, profile, setProfile)}
            {profile === 'Other' && renderTextInput('Specify Profile', customProfile, setCustomProfile, 'Enter profile details')}
            {renderDropdown('Requirement', REQUIREMENTS, requirement, setRequirement)}
            {renderBudgetField()}
            {renderDropdown('Property Type', PROPERTY_TYPES, propertyType, setPropertyType)}
            {propertyType === 'Other' && renderTextInput('Specify Property Type', customPropertyType, setCustomPropertyType, 'Enter property type details')}
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
                      {nextVisit ? `📅 ${new Date(nextVisit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}${nextVisitTime ? ` 🕒 ${nextVisitTime}` : ''}` : 'Select Date & Time'}
                    </AppText>
                    <CalendarIcon size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>
            </FieldHighlight>
          </View>

          <TouchableOpacity 
            style={[styles.saveButtonContainer, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSave} 
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.saveButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <Save size={20} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <AppText style={styles.saveButtonText}>
                {isSubmitting ? 'Saving Lead...' : 'Save Lead'}
              </AppText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <FollowUpDatePicker
        visible={showDatePicker}
        initialDate={nextVisit}
        initialTime={nextVisitTime}
        onClose={() => setShowDatePicker(false)}
        onSave={(date, time) => {
          setNextVisit(date);
          if (time) setNextVisitTime(time);
          setShowDatePicker(false);
          setActiveField(''); // Clear active field when done
        }}
      />

      {/* Safe & Privacy-First Contact Permission Rationale Dialog */}
      <Modal
        visible={showRationaleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismissRationale}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rationaleCard}>
            <View style={[styles.rationaleIconCircle, { backgroundColor: theme.isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(2, 132, 199, 0.1)' }]}>
              <BookUser size={28} color={theme.primaryDark} />
            </View>
            <AppText style={styles.rationaleTitle}>Auto-Suggest Contacts</AppText>
            <AppText style={styles.rationaleMessage}>
              Allow Contacts access to quickly find and select saved contacts. Your contacts will be searched locally on this device.
            </AppText>
            <View style={[styles.privacyBadge, { backgroundColor: theme.isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' }]}>
              <ShieldCheck size={14} color="#16a34a" style={{ marginRight: 6 }} />
              <AppText style={styles.privacyBadgeText}>
                100% On-Device & Private (Never Uploaded)
              </AppText>
            </View>
            <View style={styles.rationaleButtonsRow}>
              <TouchableOpacity
                style={[styles.rationaleCancelBtn, { borderColor: theme.border }]}
                onPress={handleDismissRationale}
                activeOpacity={0.7}
              >
                <AppText style={[styles.rationaleCancelText, { color: theme.textSecondary }]}>Not Now</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rationaleConfirmBtn, { backgroundColor: theme.primaryDark }]}
                onPress={handleConfirmPermission}
                activeOpacity={0.7}
              >
                <AppText style={styles.rationaleConfirmText}>Allow Contacts</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  budgetDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceLight,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 8,
    minWidth: 76,
  },
  budgetDropdownTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  budgetDropdownFloatingMenu: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 4,
    marginBottom: 8,
    width: 105,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
    overflow: 'hidden',
  },
  budgetDropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  budgetDropdownOptionText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  budgetDropdownOptionTextSelected: {
    color: theme.primaryDark,
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
  // Contact Auto-Suggestion Styles
  contactIconTrigger: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  contactSuggestionsFloatingBox: {
    marginTop: 6,
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
    overflow: 'hidden',
  },
  contactSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.surfaceLight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  contactSuggestionsHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactSuggestionsCloseText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  contactSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.isDark ? '#334155' : '#f1f5f9',
  },
  contactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  contactSuggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  contactSuggestionPhone: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  rationaleCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  rationaleIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rationaleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  rationaleMessage: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 20,
  },
  privacyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  rationaleButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  rationaleCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rationaleCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rationaleConfirmBtn: {
    flex: 1.3,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rationaleConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
