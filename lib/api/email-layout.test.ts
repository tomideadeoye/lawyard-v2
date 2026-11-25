import { describe, expect, it } from 'vitest';
import { threadNotice } from './email-layout';

const threadUrl = 'https://directory.lawyard.org/inquiry/' + 'a'.repeat(64);

describe('threadNotice', () => {
  it('tells the firm there is a new inquiry without naming the client', () => {
    const html = threadNotice({
      audience: 'provider',
      kind: 'new',
      providerName: 'Bloomfield Law Practice',
      threadUrl,
    });

    expect(html).toContain('Bloomfield Law Practice');
    expect(html).toContain(threadUrl);
    expect(html).not.toMatch(/@example\.com/);
  });

  it('never carries the conversation in the email', () => {
    const html = threadNotice({
      audience: 'provider',
      kind: 'reply',
      providerName: 'Firm',
      threadUrl,
    });

    expect(html).toMatch(/open the thread on lawyard/i);
    expect(html).not.toContain('I need help with a shareholder agreement');
  });

  it('gives the client a way back without exposing the firm’s address', () => {
    const html = threadNotice({
      audience: 'client',
      kind: 'first',
      providerName: 'Bloomfield Law Practice',
      threadUrl,
    });

    expect(html).toContain(threadUrl);
    expect(html).toMatch(/keep this link/i);
    expect(html).not.toContain('mailto:');
  });

  it('says so when the listing is unclaimed', () => {
    const html = threadNotice({
      audience: 'provider',
      kind: 'new',
      providerName: 'Firm',
      threadUrl,
      unclaimed: true,
    });

    expect(html).toMatch(/has not claimed/i);
  });
});
