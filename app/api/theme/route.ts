import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || !('theme' in body) || !['light', 'dark'].includes(String(body.theme))) {
    return NextResponse.json({ error: 'invalid_theme' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('obord-theme', String(body.theme), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
