import { Linking, Platform } from 'react-native';

export const callNumber = (phone: string) => {
  let phoneNumber = phone;
  if (Platform.OS !== 'android') {
    phoneNumber = `telprompt:${phone}`;
  } else {
    phoneNumber = `tel:${phone}`;
  }
  Linking.openURL(phoneNumber).catch(err => console.log('Error opening dialer:', err));
};

export const openWhatsApp = (phone: string, text: string = '') => {
  if (!phone || typeof phone !== 'string') {
    console.log('Error: Phone number is invalid or missing');
    return;
  }
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
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
    .catch(err => {
      console.log('WhatsApp scheme not allowed (likely Expo Go). Using fallback:', err.message || err);
      Linking.openURL(`https://wa.me/${cleanPhone}${urlParams}`);
    });
};
