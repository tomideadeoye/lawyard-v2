// Main-domain entry point for email-confirmation links.
// Same handler as the directory host; kept here so a link that lands on the
// apex/www domain still completes instead of 404ing.

import { handleAuthConfirm } from '@/lib/auth/confirm'

export async function GET(request: Request) {
  return handleAuthConfirm(request)
}
