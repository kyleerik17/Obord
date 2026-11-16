import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(request: NextRequest) {
  const requestedPath = request.nextUrl.searchParams.get('next')
  if (!requestedPath || !requestedPath.startsWith('/') || requestedPath.startsWith('//')) {
    return '/'
  }

  const destination = new URL(requestedPath, request.nextUrl.origin)
  return destination.origin === request.nextUrl.origin ? `${destination.pathname}${destination.search}${destination.hash}` : '/'
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const allowedTypes = ['email', 'signup', 'invite', 'magiclink', 'recovery', 'email_change'] as const
  const otpType = allowedTypes.find((value) => value === type)
  if (!code && (!tokenHash || !otpType)) return NextResponse.redirect(new URL('/login?auth=failed', request.nextUrl.origin))

  try {
    const supabase = await createClient()
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: otpType! })
    if (error) return NextResponse.redirect(new URL('/login?auth=failed', request.nextUrl.origin))

    return NextResponse.redirect(new URL(getSafeNextPath(request), request.nextUrl.origin))
  } catch {
    return NextResponse.redirect(new URL('/login?auth=failed', request.nextUrl.origin))
  }
}
