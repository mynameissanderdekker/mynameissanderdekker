import React from 'react'
import type { FieldProps } from 'sanity'

interface EditionRecord {
  status?: string
}

// Class component — avoids useEffectEvent polyfill conflict in Sanity Studio
export class EditionSummary extends React.Component<FieldProps> {
  render() {
    const records = (this.props.value as EditionRecord[] | undefined) ?? []

    if (records.length === 0) {
      return this.props.renderDefault(this.props)
    }

    const available  = records.filter(r => r.status === 'available').length
    const reserved   = records.filter(r => r.status === 'reserved').length
    const sold       = records.filter(r => r.status === 'sold').length
    const artistHold = records.filter(r => r.status === 'artist_hold').length
    const total      = records.length

    return (
      <div>
        <div style={{
          background: '#f4f4f4',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 13,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 20px',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color: available > 0 ? '#2e7d32' : '#888' }}>
            {available}/{total} beschikbaar
          </span>
          {sold > 0 && (
            <span style={{ color: '#c62828' }}>● {sold} verkocht</span>
          )}
          {reserved > 0 && (
            <span style={{ color: '#e65100' }}>● {reserved} gereserveerd</span>
          )}
          {artistHold > 0 && (
            <span style={{ color: '#555' }}>● {artistHold} artist hold</span>
          )}
        </div>
        {this.props.renderDefault(this.props)}
      </div>
    )
  }
}
