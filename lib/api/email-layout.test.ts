import { describe, expect, it } from 'vitest';
import { chamberInquiryNotification } from './email-layout';

describe('chamberInquiryNotification', () => {
  it('renders the firm, the client and the message', () => {
    const html = chamberInquiryNotification({
      firmName: 'Bloomfield Law Practice',
      clientName: 'Ada Obi',
      clientEmail: 'ada@example.com',
      clientPhone: '+234 800 000 0000',
      message: 'I need help with a shareholder agreement.',
    });

    expect(html).toContain('Bloomfield Law Practice');
    expect(html).toContain('Ada Obi');
    expect(html).toContain('ada@example.com');
    expect(html).toContain('shareholder agreement');
  });

  it('escapes anything a client types', () => {
    const html = chamberInquiryNotification({
      firmName: 'Firm',
      clientName: '<script>alert(1)</script>',
      clientEmail: 'x@example.com',
      message: '<img src=x onerror=alert(1)>',
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('tells the reader when the firm has not claimed the listing', () => {
    const html = chamberInquiryNotification({
      firmName: 'Firm',
      clientName: 'Ada',
      clientEmail: 'ada@example.com',
      message: 'Hello there, I need advice.',
      viaLawyard: true,
    });

    expect(html).toMatch(/not claimed/i);
  });
});
