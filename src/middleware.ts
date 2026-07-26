import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // Allow the login page itself
  if (pathname === '/admin/login') return NextResponse.next()

  // Check session cookie
  const session = req.cookies.get('admin_session')?.value
  if (session === process.env.ADMIN_PASSWORD) return NextResponse.next()

  // Redirect to login
  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
