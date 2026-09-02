import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, adminCookieValue } from '@/lib/adminAuth'

/** Wachtwoord → cookie. Zie lib/adminAuth.ts. */
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const expected = adminCookieValue()

  // Fail closed: geen wachtwoord ingesteld = niemand erin.
  if (!expected || !password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
