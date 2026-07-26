'use client'
import { useState } from 'react'

// ── Filter field definitions ──────────────────────────────────────────────────
const FIELDS = [
  {
    value: 'type',
    label: 'Contact type',
    operators: [{ value: '==', label: 'is' }, { value: '!=', label: 'is niet' }],
    values: [
      { value: 'collector',  label: 'Collector' },
      { value: 'gallery',    label: 'Galerie' },
      { value: 'journalist', label: 'Journalist' },
      { value: 'artist',     label: 'Kunstenaar' },
      { value: 'newsletter', label: 'Nieuwsbrief' },
      { value: 'other',      label: 'Anders' },
    ],
  },
  {
    value: 'subscribed',
    label: 'Nieuwsbrief',
    operators: [{ value: '==', label: 'is' }],
    values: [
      { value: 'true',  label: 'Ingeschreven' },
      { value: 'false', label: 'Uitgeschreven' },
    ],
  },
  {
    value: 'country',
    label: 'Land',
    operators: [{ value: '==', label: 'is' }, { value: '!=', label: 'is niet' }],
    values: [
      { value: 'NL', label: 'Nederland' },
      { value: 'BE', label: 'België' },
      { value: 'DE', label: 'Duitsland' },
      { value: 'FR', label: 'Frankrijk' },
      { value: 'GB', label: 'Verenigd Koninkrijk' },
      { value: 'US', label: 'Verenigde Staten' },
      { value: 'DK', label: 'Denemarken' },
      { value: 'AT', label: 'Oostenrijk' },
      { value: 'CH', label: 'Zwitserland' },
    ],
  },
  {
    value: 'hasPurchases',
    label: 'Heeft gekocht',
    operators: [{ value: '==', label: 'is' }],
    values: [
      { value: 'true',  label: 'Ja' },
      { value: 'false', label: 'Nee' },
    ],
  },
]

interface Condition {
  field: string
  operator: string
  value: string
}

interface Props {
  onSave: (name: string, conditions: Condition[]) => Promise<void>
  onClose: () => void
}

export default function SegmentBuilder({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [conditions, setConditions] = useState<Condition[]>([
    { field: 'type', operator: '==', value: 'collector' },
  ])
  const [saving, setSaving] = useState(false)

  function addCondition() {
    setConditions(prev => [...prev, { field: 'type', operator: '==', value: 'collector' }])
  }

  function removeCondition(i: number) {
    setConditions(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateCondition(i: number, patch: Partial<Condition>) {
    setConditions(prev => prev.map((c, idx) => {
      if (idx !== i) return c
      const updated = { ...c, ...patch }
      // Reset value when field changes
      if (patch.field && patch.field !== c.field) {
        const fieldDef = FIELDS.find(f => f.value === patch.field)
        updated.operator = fieldDef?.operators[0].value ?? '=='
        updated.value = fieldDef?.values[0].value ?? ''
      }
      return updated
    }))
  }

  async function handleSave() {
    if (!name.trim() || conditions.length === 0) return
    setSaving(true)
    await onSave(name.trim(), conditions)
    setSaving(false)
  }

  const selectStyle: React.CSSProperties = {
    padding: '7px 10px', border: '1px solid #ddd', fontSize: 13,
    background: '#fff', outline: 'none', cursor: 'pointer',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#fff', width: 520, padding: '32px',
        zIndex: 101, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
      }}>
        <p style={{ margin: '0 0 24px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#aaa' }}>
          Nieuw segment
        </p>

        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Naam van het segment…"
          autoFocus
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid #ddd',
            fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 24,
          }}
        />

        {/* Conditions */}
        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#888' }}>Filters — alle condities moeten kloppen</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {conditions.map((cond, i) => {
            const fieldDef = FIELDS.find(f => f.value === cond.field) ?? FIELDS[0]
            return (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {/* Field */}
                <select value={cond.field} onChange={e => updateCondition(i, { field: e.target.value })} style={selectStyle}>
                  {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>

                {/* Operator */}
                <select value={cond.operator} onChange={e => updateCondition(i, { operator: e.target.value })} style={selectStyle}>
                  {fieldDef.operators.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>

                {/* Value */}
                <select value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })} style={{ ...selectStyle, flex: 1 }}>
                  {fieldDef.values.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  disabled={conditions.length === 1}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#aaa', fontSize: 16, padding: '0 4px',
                    opacity: conditions.length === 1 ? 0.3 : 1,
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addCondition}
          style={{
            background: 'none', border: '1px dashed #ccc', padding: '7px 14px',
            fontSize: 12, cursor: 'pointer', color: '#888', marginBottom: 28,
          }}
        >
          + Filter toevoegen
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            style={{
              flex: 1, padding: '12px', background: name.trim() ? '#111' : '#ccc',
              color: '#fff', border: 'none', fontSize: 12, letterSpacing: 1,
              textTransform: 'uppercase', cursor: name.trim() ? 'pointer' : 'default',
            }}
          >
            {saving ? 'Opslaan…' : 'Segment opslaan'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 20px', background: '#fff', border: '1px solid #ddd',
              fontSize: 12, cursor: 'pointer', color: '#666',
            }}
          >
            Annuleer
          </button>
        </div>
      </div>
    </>
  )
}

// ── Helper: conditions → GROQ filter string ───────────────────────────────────
export function conditionsToGroq(conditions: Condition[]): string {
  return conditions.map(c => {
    if (c.field === 'hasPurchases') {
      return c.value === 'true'
        ? `count(purchases) > 0`
        : `(!defined(purchases) || count(purchases) == 0)`
    }
    const val = c.value === 'true' ? 'true' : c.value === 'false' ? 'false' : `"${c.value}"`
    return `${c.field} ${c.operator} ${val}`
  }).join(' && ')
}
