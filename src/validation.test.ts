import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidPhone, validateEnquiry, type EnquiryValues } from './validation';

const valid: EnquiryValues = {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  phone: '',
  treatment: 'botox',
  contactMethod: 'email',
  message: '',
  consent: true,
};

describe('isValidEmail', () => {
  it.each(['a@b.co', 'first.last+tag@sub.example.org'])('accepts %s', (e) => expect(isValidEmail(e)).toBe(true));
  it.each(['', 'plain', 'a@b', 'a @b.com', 'a@b.c', '@example.com'])('rejects "%s"', (e) =>
    expect(isValidEmail(e)).toBe(false),
  );
});

describe('isValidPhone', () => {
  it.each(['(512) 555-0100', '512.555.0100', '+1 512 555 0100', '15125550100'])('accepts %s', (p) =>
    expect(isValidPhone(p)).toBe(true),
  );
  it.each(['555-0100', '512-555-0100 ext', '25125550100', 'abc'])('rejects %s', (p) =>
    expect(isValidPhone(p)).toBe(false),
  );
});

describe('validateEnquiry', () => {
  it('passes a complete enquiry', () => {
    expect(validateEnquiry(valid)).toEqual({});
  });

  it('flags every required field when empty', () => {
    const errors = validateEnquiry({ ...valid, name: '', email: '', consent: false });
    expect(Object.keys(errors).sort()).toEqual(['consent', 'email', 'name']);
  });

  it('treats treatment interest and contact method as optional', () => {
    expect(validateEnquiry({ ...valid, treatment: '', contactMethod: '' })).toEqual({});
  });

  it('rejects an unknown contact method', () => {
    expect(validateEnquiry({ ...valid, contactMethod: 'fax' }).contactMethod).toBeDefined();
  });

  it('requires a phone number only when phone contact is preferred', () => {
    expect(validateEnquiry({ ...valid, contactMethod: 'phone' }).phone).toMatch(/phone number/);
    expect(validateEnquiry({ ...valid, contactMethod: 'phone', phone: '512-555-0100' })).toEqual({});
  });

  it('validates an optional phone number if one is given', () => {
    expect(validateEnquiry({ ...valid, phone: '123' }).phone).toBeDefined();
  });

  it('limits message length', () => {
    expect(validateEnquiry({ ...valid, message: 'x'.repeat(1001) }).message).toBeDefined();
  });
});
