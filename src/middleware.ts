import { NextRequest, NextResponse } from 'next/server'

/**
 * Alles onder /admin achter de login. Zie lib/adminAuth.ts voor waarom.
 *
 * De middleware draait op de Edge en kan geen node:crypto importeren; daarom
 * staat de HMAC hier met de Web Crypto API. Zelfde afleiding als in
 * lib/adminAuth.ts — wijzig je de ene, wijzig dan ook de andere.
 */
async function expectedCookie(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('admin-session-v1'))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()

  const expected = await expectedCookie()
  // Fail closed: zonder ingesteld wachtwoord komt niemand binnen. Beter een
  // dichte deur met een duidelijke melding dan een open deur zonder.
  if (!expected) {
    return new NextResponse('Admin is niet ingesteld: zet ADMIN_PASSWORD in de omgeving.', { status: 503 })
  }

  const cookie = req.cookies.get('admin_session')?.value
  if (cookie === expected) return NextResponse.next()

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
