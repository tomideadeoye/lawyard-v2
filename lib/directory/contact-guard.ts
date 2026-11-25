import { createServiceRoleClient } from '@/lib/supabase/server';
import { contactBlockMessage, findContactDetails } from './contact-filter';

// The boundary check for every message that can reach the other side. Called
// from the server actions, never the browser, so a client cannot skip it.

export interface ContactGuardContext {
  surface: 'chamber' | 'lawyer';
  direction: 'client' | 'provider';
  inquiryId?: string | null;
}

export async function guardContactDetails(text: string, context: ContactGuardContext) {
  const findings = findContactDetails(text);
  if (findings.length === 0) return;

  // Record first: the message is rejected either way, and the record is what
  // shows whether a listing is systematically pushing people off-platform.
  try {
    await createServiceRoleClient()
      .from('contact_flags')
      .insert({
        surface: context.surface,
        inquiry_id: context.inquiryId ?? null,
        direction: context.direction,
        kinds: [...new Set(findings.map((finding) => finding.kind))],
      });
  } catch (error) {
    console.error('Could not record contact flag:', error);
  }

  throw new Error(contactBlockMessage(findings));
}
