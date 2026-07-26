'use client'

import { useEffect, useState, useCallback } from 'react'
import { useClient } from 'sanity'
import type { ObjectInputProps } from 'sanity'
import { set } from 'sanity'

interface SectionConfig {
  category: string // '__all__' = alle ongegroepeerde werken
  visible: boolean
  max: number
}

interface WorksPageValue {
  sections?: SectionConfig[]
}

const ALL_KEY = '__all__'

/**
 * Custom input voor worksPage
 *
 * Toont:
 *  - "Alle werken" (altijd bovenaan, niet verplaatsbaar) — standaard aan
 *  - Per categorie uit artworks: checkbox + max-input + ↑↓
 *
 * Opgeslagen in `sections` array op het worksPage document.
 */
export function SectionOrderInput(props: ObjectInputProps<WorksPageValue>) {
  const { value, onChange } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [artworkCats, setArtworkCats] = useState<string[]>([])

  // Haal unieke categorieën op uit gepubliceerde artworks
  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`
      )
      .then((cats) => setArtworkCats((cats ?? []).filter(Boolean)))
  }, [client])

  // Merge opgeslagen volgorde/instellingen met huidig gevonden categorieën
  const storedSections: SectionConfig[] = value?.sections ?? []

  // Zorg dat __all__ altijd bovenaan staat
  const allEntry: SectionConfig = storedSections.find(s => s.category === ALL_KEY) ?? {
    category: ALL_KEY,
    visible: true,
    max: 999,
  }

  // Categorieën (excl. __all__), in opgeslagen volgorde, plus nieuwe onderaan
  const storedCats = storedSections.filter(s => s.category !== ALL_KEY)
  const storedCatKeys = storedCats.map(s => s.category)
  const newCats: SectionConfig[] = artworkCats
    .filter(c => !storedCatKeys.includes(c))
    .map(c => ({ category: c, visible: true, max: 6 }))

  const catSections: SectionConfig[] = [
    ...storedCats.filter(s => artworkCats.includes(s.category)), // bewaarde volgorde, niet-bestaande weggooien
    ...newCats, // nieuwe onderaan
  ]

  // Sla op: altijd __all__ als eerste, dan de categorieën
  const save = useCallback((nextCats: SectionConfig[], nextAll: SectionConfig) => {
    const next: SectionConfig[] = [nextAll, ...nextCats]
    onChange(set(next, ['sections']))
  }, [onChange])

  function updateAll(patch: Partial<SectionConfig>) {
    save(catSections, { ...allEntry, ...patch })
  }

  function updateCat(i: number, patch: Partial<SectionConfig>) {
    const next = catSections.map((s, idx) => idx === i ? { ...s, ...patch } : s)
    save(next, allEntry)
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...catSections]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    save(next, allEntry)
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 5,
    fontSize: 14,
  }

  const maxInputStyle: React.CSSProperties = {
    width: 52,
    padding: '4px 6px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 13,
    textAlign: 'center',
  }

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    opacity: disabled ? 0.2 : 1,
    cursor: disabled ? 'default' : 'pointer',
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 3,
    width: 26,
    height: 26,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>
        Zichtbaar op de webshop. Standaard: alle werken.
      </p>

      {/* ── Alle werken (altijd bovenaan) ── */}
      <div style={{ ...rowStyle, background: '#f0f0f0', border: '1px solid #ddd' }}>
        <input
          type="checkbox"
          checked={allEntry.visible}
          onChange={(e) => updateAll({ visible: e.target.checked })}
          style={{ width: 16, height: 16, flexShrink: 0 }}
        />
        <span style={{ flex: 1, fontWeight: 600 }}>Alle werken</span>
        <span style={{ fontSize: 12, color: '#999' }}>standaard</span>
      </div>

      {/* ── Categorieën ── */}
      {artworkCats.length === 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#aaa' }}>
          Nog geen categorieën aangemaakt. Voeg een categorie toe aan een artwork.
        </p>
      )}

      {catSections.map((s, i) => (
        <div key={s.category} style={{ ...rowStyle, background: s.visible ? '#fff' : '#fafafa', border: '1px solid #e5e5e5' }}>
          <input
            type="checkbox"
            checked={s.visible}
            onChange={(e) => updateCat(i, { visible: e.target.checked })}
            style={{ width: 16, height: 16, flexShrink: 0 }}
          />
          <span style={{ flex: 1, fontWeight: s.visible ? 500 : 400, color: s.visible ? '#111' : '#999' }}>
            {s.category}
          </span>
          <label style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
            max
            <input
              type="number"
              min={1}
              max={99}
              value={s.max}
              onChange={(e) => updateCat(i, { max: Math.max(1, parseInt(e.target.value) || 6) })}
              style={maxInputStyle}
            />
          </label>
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={btnStyle(i === 0)}>↑</button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === catSections.length - 1} style={btnStyle(i === catSections.length - 1)}>↓</button>
        </div>
      ))}
    </div>
  )
}
