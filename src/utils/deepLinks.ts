import { Linking } from 'react-native';

export const callNumber = (phone: string) => {
  const phoneNumber = `tel:${phone}`;
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
  let url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  Linking.canOpenURL(url)
    .then(supported => {
      if (!supported) {
        Linking.openURL(`https://wa.me/${cleanPhone}${urlParams}`);
      } else {
        return Linking.openURL(url);
      }
    })
    .catch(err => {
      console.log('WhatsApp scheme not allowed. Using fallback:', err.message || err);
      Linking.openURL(`https://wa.me/${cleanPhone}${urlParams}`);
    });
};
