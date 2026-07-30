import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url param', { status: 400 })

  // Only allow fetching from trusted domains
  const allowed = ['mynameissanderdekker.com', 'cdn.sanity.io', 'assets.sanity.io']
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }
  if (!allowed.some(d => parsed.hostname.endsWith(d))) {
    return new NextResponse('Domain not allowed', { status: 403 })
  }

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return new NextResponse('Upstream error', { status: res.status })

  const body = await res.arrayBuffer()
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
