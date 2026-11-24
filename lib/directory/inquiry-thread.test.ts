import { describe, expect, it } from 'vitest';
import {
  createThreadToken,
  isThreadToken,
  THREAD_BODY_LIMIT,
  validateThreadBody,
} from './inquiry-thread';

describe('thread tokens', () => {
  it('generates a 64-character hex token', () => {
    expect(createThreadToken()).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates a fresh token every time', () => {
    expect(createThreadToken()).not.toBe(createThreadToken());
  });

  it('rejects malformed tokens before hitting the database', () => {
    expect(isThreadToken('abc')).toBe(false);
    expect(isThreadToken('z'.repeat(64))).toBe(false);
    expect(isThreadToken(createThreadToken())).toBe(true);
  });
});

describe('validateThreadBody', () => {
  it('trims and accepts a normal message', () => {
    const result = validateThreadBody('  Thanks, that helps.  ');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.body).toBe('Thanks, that helps.');
  });

  it('rejects an empty or one-character message', () => {
    expect(validateThreadBody('   ').ok).toBe(false);
    expect(validateThreadBody('a').ok).toBe(false);
  });

  it('enforces the length limit', () => {
    expect(validateThreadBody('x'.repeat(THREAD_BODY_LIMIT + 1)).ok).toBe(false);
    expect(validateThreadBody('x'.repeat(THREAD_BODY_LIMIT)).ok).toBe(true);
  });
});
