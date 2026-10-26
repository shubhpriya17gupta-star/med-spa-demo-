export interface EnquiryValues {
  name: string;
  email: string;
  phone: string;
  treatment: string;
  contactMethod: string;
  message: string;
  consent: boolean;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues, string>>;

// Pragmatic check: one @, no spaces, a dot in the domain, and a 2+ letter TLD.
const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const MAX_MESSAGE = 1000;

export function isValidEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** US-focused but tolerant: 10 digits, optionally with a leading 1 / +1. */
export function isValidPhone(value: string): boolean {
  if (!/^[\d\s()+.-]+$/.test(value.trim())) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

export function validateEnquiry(v: EnquiryValues): EnquiryErrors {
  const errors: EnquiryErrors = {};

  if (v.name.trim().length < 2) errors.name = 'Please enter your name.';

  if (!v.email.trim()) errors.email = 'Please enter your email address.';
  else if (!isValidEmail(v.email)) errors.email = 'Please enter a valid email address, like name@example.com.';

  const phone = v.phone.trim();
  if (v.contactMethod === 'phone' && !phone) {
    errors.phone = 'Please add a phone number, or choose email as your preferred contact method.';
  } else if (phone && !isValidPhone(phone)) {
    errors.phone = 'Please enter a 10-digit US phone number.';
  }

  // Treatment interest and contact method are optional; contact method defaults to email.
  if (v.contactMethod && v.contactMethod !== 'email' && v.contactMethod !== 'phone') {
    errors.contactMethod = 'Please choose email or phone.';
  }
  if (v.message.length > MAX_MESSAGE) {
    errors.message = `Please keep your message under ${MAX_MESSAGE} characters.`;
  }
  if (!v.consent) errors.consent = 'Please confirm you are happy to be contacted about your enquiry.';

  return errors;
}
