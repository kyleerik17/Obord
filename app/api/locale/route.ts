import { NextResponse } from 'next/server'
import { isLocale } from '@/lib/i18n'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('locale' in body) || typeof body.locale !== 'string' || !isLocale(body.locale)) {
    return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
  }

  const locale = body.locale
  const response = NextResponse.json({ locale })
  response.cookies.set('obord_locale', locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
