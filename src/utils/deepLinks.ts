import { Linking, Platform } from 'react-native';

export const callNumber = (phone: string) => {
  let phoneNumber = phone;
  if (Platform.OS !== 'android') {
    phoneNumber = `telprompt:${phone}`;
  } else {
    phoneNumber = `tel:${phone}`;
  }
  Linking.canOpenURL(phoneNumber)
    .then(supported => {
      if (!supported) {
        console.log('Phone number is not available');
      } else {
        return Linking.openURL(phoneNumber);
      }
    })
    .catch(err => console.log(err));
};

export const openWhatsApp = (phone: string, text: string = '') => {
  const cleanPhone = phone.replace(/\D/g, '');
  const urlParams = `?text=${encodeURIComponent(text)}`;

  if (Platform.OS === 'web') {
    window.open(`https://wa.me/${cleanPhone}${urlParams}`, '_blank');
    return;
  }

  let url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        // Fallback to web WhatsApp if app is not installed
        Linking.openURL(`https://wa.me/${cleanPhone}${urlParams}`);
      } else {
        return Linking.openURL(url);
      }
    })
    .catch(err => console.log(err));
};
