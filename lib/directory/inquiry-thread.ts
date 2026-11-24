import { randomBytes } from 'node:crypto';

// A guest has no account, so the emailed link is the credential. The token is
// unguessable (256 bits); see the migration for why it is stored as issued
// rather than hashed — the firm's reply must be able to re-send the same link.

export const THREAD_BODY_LIMIT = 4000;

export function createThreadToken(): string {
  return randomBytes(32).toString('hex');
}

export function isThreadToken(value: string): boolean {
  return /^[a-f0-9]{64}$/.test(value);
}

export type ThreadBodyResult = { ok: true; body: string } | { ok: false; error: string };

export function validateThreadBody(input: string): ThreadBodyResult {
  const body = input.trim();
  if (body.length < 2) return { ok: false, error: 'Write a message first.' };
  if (body.length > THREAD_BODY_LIMIT) {
    return { ok: false, error: `Keep it under ${THREAD_BODY_LIMIT} characters.` };
  }
  return { ok: true, body };
}
