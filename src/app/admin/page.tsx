import { cookies } from 'next/headers'
import { isValidAdminCookie } from '@/lib/adminAuth'
import { redirect } from 'next/navigation'

const tools = [
  {
    href: '/admin/new-sale',
    title: 'Register a sale',
    description: 'Manual sale — client, artwork, invoice. No Stripe.',
  },
  {
    href: '/admin/campaigns',
    title: 'Email campaigns',
    description: 'Send a newsletter or announcement.',
  },
  {
    href: '/studio',
    title: 'Sanity Studio',
    description: 'Edit content, artworks, contacts, press.',
    external: true,
  },
]

export default async function AdminPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  if (!isValidAdminCookie(session)) redirect('/admin/login')

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: 'Georgia, serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px' }}>
        <h1 style={{ fontWeight: 400, fontSize: 26, marginBottom: 6 }}>Admin</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 40, marginTop: 0 }}>mynameissanderdekker.com</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tools.map(tool => (
            <a
              key={tool.href}
              href={tool.href}
              target={tool.external ? '_blank' : undefined}
              rel={tool.external ? 'noopener noreferrer' : undefined}
              style={{
                display: 'block', padding: '18px 22px',
                border: '1px solid #e0e0e0', borderRadius: 5,
                background: '#fff', textDecoration: 'none', color: 'inherit',
              }}
            >
              <div style={{ fontSize: 15, color: '#111', marginBottom: 3 }}>
                {tool.title}
                {tool.external && <span style={{ fontSize: 11, color: '#bbb', marginLeft: 6 }}>↗</span>}
              </div>
              <div style={{ fontSize: 13, color: '#888' }}>{tool.description}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
