import type { NextRequest } from 'next/server'
import { updateSessionAndHeaders } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSessionAndHeaders(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
