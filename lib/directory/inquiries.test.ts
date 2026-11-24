import { describe, expect, it } from 'vitest';
import { LIMITS, validateChamberInquiry } from './inquiries';

const valid = {
  chamberId: 'e259c8f8-018b-41ed-a203-b7a3acd7c51e',
  name: 'Ada Obi',
  email: 'ada@example.com',
  phone: '',
  message: 'I need help with a shareholder agreement.',
};

describe('validateChamberInquiry', () => {
  it('accepts a complete inquiry and trims it', () => {
    const result = validateChamberInquiry({ ...valid, name: '  Ada Obi  ' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Ada Obi');
      expect(result.value.phone).toBeNull();
      expect(result.value.chamberId).toBe(valid.chamberId);
    }
  });

  it('rejects an unknown firm id', () => {
    expect(validateChamberInquiry({ ...valid, chamberId: 'not-a-uuid' }).ok).toBe(false);
  });

  it('rejects a missing or invalid email', () => {
    expect(validateChamberInquiry({ ...valid, email: '' }).ok).toBe(false);
    expect(validateChamberInquiry({ ...valid, email: 'ada@example' }).ok).toBe(false);
  });

  it('requires a real message', () => {
    const result = validateChamberInquiry({ ...valid, message: 'help' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/describe/i);
  });

  it('enforces the length caps', () => {
    expect(validateChamberInquiry({ ...valid, message: 'x'.repeat(LIMITS.message + 1) }).ok).toBe(false);
    expect(validateChamberInquiry({ ...valid, name: 'x'.repeat(LIMITS.name + 1) }).ok).toBe(false);
    expect(validateChamberInquiry({ ...valid, phone: '1'.repeat(LIMITS.phone + 1) }).ok).toBe(false);
  });

  it('drops a honeypot submission without revealing why', () => {
    const result = validateChamberInquiry({ ...valid, company: 'Spam Co' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Message could not be sent.');
  });
});
