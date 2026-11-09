// Directory host: /auth/confirm is rewritten here by middleware.
// Handler lives in lib/auth/confirm.ts and is shared with the main-domain route.

import { handleAuthConfirm } from '@/lib/auth/confirm'

export async function GET(request: Request) {
  return handleAuthConfirm(request)
}
