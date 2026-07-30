import React from 'react'
import type { FieldProps } from 'sanity'

const CHANNEL: Record<string, string> = {
  webshop: 'Webshop',
  direct:  'Direct',
  gallery: 'Gallery',
  artfair: 'Art Fair',
  other:   'Anders',
}

interface Buyer {
  firstName: string
  lastName: string
  email: string
  purchases: Array<{ copyNumber?: string; soldVia?: string; editionNumber?: string; price?: number }>
}

interface State {
  artworkId: string | null
  buyers: Buyer[]
  editionTotal: number | null
  editionAP: number | null
  loading: boolean
  error: string | null
}

// Class component to avoid useEffect / useEffectEvent polyfill conflict in Sanity Studio
export class ArtworkBuyers extends React.Component<FieldProps, State> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanityClient: any = null

  constructor(props: FieldProps) {
    super(props)
    this.state = { artworkId: null, buyers: [], editionTotal: null, editionAP: null, loading: true, error: null }
  }

  componentDidMount() {
    // The Studio URL is nested, e.g. /studio/structure/artwork;artwork-list;artwork-all;[id]
    // The document _id is always the last semicolon-separated segment
    const segments = window.location.pathname.split(';')
    const last = segments[segments.length - 1] ?? ''
    // Only treat it as a valid Sanity document ID (alphanum + hyphens/dots)
    const artworkId = /^[A-Za-z0-9._-]{5,}$/.test(last) ? last : null
    if (!artworkId) { this.setState({ loading: false }); return }
    this.setState({ artworkId }, () => this.fetchBuyers(artworkId))
  }

  private async fetchBuyers(artworkId: string) {
    try {
      if (!this.sanityClient) {
        const { createClient } = await import('@sanity/client')
        this.sanityClient = createClient({
          projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '',
          dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? '',
          apiVersion: '2026-07-25',
          useCdn: false,
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.sanityClient.fetch as any)(
        `{
          "artwork": *[_type == "artwork" && _id == $id][0]{ editionTotal, editionAP },
          "buyers": *[_type == "contact" && $id in purchases[].artwork._ref]{
            firstName, lastName, email,
            "purchases": purchases[artwork._ref == $id]{ copyNumber, soldVia, editionNumber, price }
          } | order(lastName asc)
        }`,
        { id: artworkId },
      )
      this.setState({
        buyers: result?.buyers ?? [],
        editionTotal: result?.artwork?.editionTotal ?? null,
        editionAP: result?.artwork?.editionAP ?? null,
        loading: false,
      })
    } catch (err) {
      this.setState({ error: (err as Error)?.message ?? 'Fout', loading: false })
    }
  }

  render() {
    const { buyers, editionTotal, editionAP, loading, error, artworkId } = this.state

    // Count total purchases (one purchase = one sold copy)
    const soldCount = buyers.reduce((sum, b) => sum + b.purchases.length, 0)
    const available = editionTotal != null ? Math.max(0, editionTotal - soldCount) : null

    return (
      <div style={{ padding: '4px 0' }}>

        {!artworkId && !loading && (
          <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>Artwork ID niet beschikbaar.</p>
        )}
        {loading && <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Laden…</p>}
        {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>Fout: {error}</p>}

        {!loading && !error && editionTotal != null && (
          <div style={{
            background: '#f4f4f4',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 13,
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '4px 16px',
            alignItems: 'center',
          }}>
            <span style={{ fontWeight: 700, color: available! > 0 ? '#2e7d32' : '#888' }}>
              {available}/{editionTotal} beschikbaar
            </span>
            {soldCount > 0 && <span style={{ color: '#c62828' }}>● {soldCount} verkocht</span>}
            {editionAP != null && editionAP > 0 && (
              <span style={{ color: '#888' }}>+ {editionAP} AP</span>
            )}
          </div>
        )}

        {!loading && !error && buyers.length === 0 && artworkId && (
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 8px' }}>Geen kopers gevonden.</p>
        )}

        {buyers.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', textAlign: 'left' }}>
                <th style={{ padding: '4px 8px 6px 0', fontWeight: 600, color: '#555' }}>Naam</th>
                <th style={{ padding: '4px 8px 6px', fontWeight: 600, color: '#555' }}>Exemplaar</th>
                <th style={{ padding: '4px 8px 6px', fontWeight: 600, color: '#555' }}>Via</th>
                <th style={{ padding: '4px 0 6px 8px', fontWeight: 600, color: '#555', textAlign: 'right' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b, i) =>
                b.purchases.map((p, j) => (
                  <tr key={`${i}-${j}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '5px 8px 5px 0', color: '#222' }}>
                      {[b.firstName, b.lastName].filter(Boolean).join(' ') || b.email}
                    </td>
                    <td style={{ padding: '5px 8px', color: '#555' }}>{p.copyNumber ?? '—'}</td>
                    <td style={{ padding: '5px 8px', color: '#777', fontSize: 12 }}>
                      {p.soldVia ? (CHANNEL[p.soldVia] ?? p.soldVia) : '—'}
                    </td>
                    <td style={{ padding: '5px 0 5px 8px', color: '#444', textAlign: 'right' }}>
                      {p.price != null ? `€${p.price.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ padding: '6px 0 0', fontSize: 12, color: '#888' }}>
                  {buyers.length} koper{buyers.length !== 1 ? 's' : ''}
                </td>
              </tr>
            </tfoot>
          </table>
        )}

        <a
          href="/studio/intent/create/template=contact/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            fontSize: 13,
            color: '#0066cc',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nieuw contact toevoegen
        </a>
      </div>
    )
  }
}
