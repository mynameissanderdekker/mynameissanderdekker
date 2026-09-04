import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { getSanityWriteClient } from '@/lib/sanityClient'
import { reverseSale } from '@/lib/reverseSale'

export const dynamic = 'force-dynamic'

/**
 * Een verkoop terugdraaien bij annuleren of terugbetalen.
 *
 * Op de server, niet in de Studio: de logica hoort op één plek te staan (zie
 * lib/reverseSale.ts) en het schrijfrecht op werken en contacten hoort niet af
 * te hangen van wat een Studio-gebruiker toevallig mag.
 *
 * Alleen het terugdraaien. De status van de order zet het paneel zelf, zodat
 * die stap in de geschiedenis komt met de naam van wie het deed.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let orderId: string | undefined
  try {
    ({ orderId } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 })
  }
  if (!orderId) return NextResponse.json({ error: 'orderId ontbreekt.' }, { status: 400 })

  try {
    // Concepten hebben een `drafts.`-voorvoegsel; de order zelf niet.
    const result = await reverseSale(getSanityWriteClient(), orderId.replace(/^drafts\./, ''))
    return NextResponse.json(result)
  } catch (err) {
    const msg = (err as Error).message
    if (/bestaat niet/.test(msg)) return NextResponse.json({ error: msg }, { status: 404 })
    console.error('[reverse-sale]', err)
    return NextResponse.json({ error: 'De verkoop kon niet worden teruggedraaid.' }, { status: 500 })
  }
}
