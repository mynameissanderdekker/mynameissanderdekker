import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  ;(await draftMode()).disable()
  const redirectTo = searchParams.get('redirect') ?? '/'
  redirect(redirectTo)
}
