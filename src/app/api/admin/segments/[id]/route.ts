/**
 * DELETE /api/admin/segments/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanityClient'

function auth(req: NextRequest) {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sanity = getSanityWriteClient()
  await sanity.delete(id)
  return NextResponse.json({ ok: true })
}
