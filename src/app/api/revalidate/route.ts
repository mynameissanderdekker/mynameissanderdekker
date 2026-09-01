import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

// Secret set in Sanity Dashboard → API → Webhooks → Secret
const WEBHOOK_SECRET = process.env.SANITY_REVALIDATE_SECRET

export async function POST(req: NextRequest) {
  // Verify secret
  const secret = req.headers.get('x-webhook-secret')
  if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const docType: string = body?._type ?? ''

    const slug: string = body?.slug?.current ?? ''

    // Revalidate based on document type
    switch (docType) {
      case 'project':
        revalidatePath('/projects', 'page')
        if (slug) revalidatePath(`/projects/${slug}`, 'page')
        break
      case 'artwork':
        revalidatePath('/works', 'page')
        if (slug) revalidatePath(`/works/${slug}`, 'page')
        break
      case 'exhibition':
        revalidatePath('/works', 'page')
        revalidatePath('/about', 'page')
        if (slug) revalidatePath(`/exhibitions/${slug}`, 'page')
        break
      case 'artFair':
        revalidatePath('/works', 'page')
        revalidatePath('/about', 'page')
        if (slug) revalidatePath(`/art-fairs/${slug}`, 'page')
        break
      case 'press':
      case 'pressRelease':
        revalidatePath('/about', 'page')
        break
      case 'cvPage':
      case 'aboutPage':
        revalidatePath('/about', 'page')
        break
      case 'siteSettings':
        revalidatePath('/', 'layout')
        break
      case 'publication':
        revalidatePath('/projects', 'page')
        if (slug) revalidatePath(`/projects/${slug}`, 'page')
        break
      case 'projectSeries':
        revalidatePath('/projects', 'page')
        break
      default:
        // Unknown type — revalidate everything to be safe
        revalidatePath('/', 'layout')
    }

    return NextResponse.json({ revalidated: true, type: docType })
  } catch {
    return NextResponse.json({ message: 'Error processing webhook' }, { status: 500 })
  }
}
