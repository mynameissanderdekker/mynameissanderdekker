'use client'

import { useEffect, useState, useCallback } from 'react'
import { useClient } from 'sanity'
import type { ObjectInputProps } from 'sanity'
import { set } from 'sanity'

interface SectionConfig {
  category: string
  visible: boolean
  columns: number // 2 or 3
  max: number
  description?: string
  showViewAll?: boolean
}

interface WorksPageValue {
  sections?: SectionConfig[]
}

/**
 * Custom input voor worksPage
 *
 * Per categorie: zichtbaar, kolommen (2 of 3), max preset
 * Volgorde aanpasbaar met ↑↓
 */
export function SectionOrderInput(props: ObjectInputProps<WorksPageValue>) {
  const { value, onChange } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [artworkCats, setArtworkCats] = useState<string[]>([])

  useEffect(() => {
    client
      .fetch<string[]>(
        `array::unique(*[_type == "artwork" && defined(category) && category != ""].category) | order(@)`
      )
      .then((cats) => setArtworkCats((cats ?? []).filter(Boolean)))
  }, [client])

  const storedSections: SectionConfig[] = value?.sections ?? []
  const storedCatKeys = storedSections.map(s => s.category)
  const newCats: SectionConfig[] = artworkCats
    .filter(c => !storedCatKeys.includes(c))
    .map(c => ({ category: c, visible: true, columns: 3, max: 6 }))

  const sections: SectionConfig[] = [
    ...storedSections.filter(s => artworkCats.includes(s.category)),
    ...newCats,
  ]

  const save = useCallback((next: SectionConfig[]) => {
    onChange(set(next, ['sections']))
  }, [onChange])

  function updateSection(i: number, patch: Partial<SectionConfig>) {
    const next = sections.map((s, idx) => idx === i ? { ...s, ...patch } : s)
    save(next)
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...sections]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    save(next)
  }

  // Preset max options based on columns (1, 2, or 3 rows)
  function maxPresets(cols: number): number[] {
    return [cols, cols * 2, cols * 3]
  }

  // When columns change, find nearest row count and keep it
  function changeColumns(i: number, newCols: number) {
    const s = sections[i]
    const oldCols = s.columns ?? 3
    const rowCount = Math.round(s.max / oldCols) || 1
    const clampedRows = Math.min(rowCount, 3)
    const newMax = newCols * clampedRows
    updateSection(i, { columns: newCols, max: newMax })
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '12px 14px',
    borderRadius: 6,
    border: '1px solid #e5e5e5',
    background: '#fff',
    fontSize: 14,
  }

  const cardDisabled: React.CSSProperties = {
    ...card,
    background: '#fafafa',
    borderColor: '#efefef',
  }

  const row: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }

  function pillBtn(active: boolean): React.CSSProperties {
    return {
      padding: '3px 10px',
      borderRadius: 20,
      border: active ? '1.5px solid #333' : '1px solid #ccc',
      background: active ? '#333' : '#fff',
      color: active ? '#fff' : '#555',
      fontSize: 12,
      fontWeight: active ? 600 : 400,
      cursor: 'pointer',
      lineHeight: 1.6,
    }
  }

  function moveBtn(disabled: boolean): React.CSSProperties {
    return {
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
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>
        Configure which categories are visible, in how many columns, and how many items to show.
      </p>

      {artworkCats.length === 0 && (
        <p style={{ margin: '8px 0', fontSize: 12, color: '#aaa' }}>
          No categories found yet. Add a category to an artwork first.
        </p>
      )}

      {sections.map((s, i) => {
        const cols = s.columns ?? 3
        const presets = maxPresets(cols)
        const isLast = i === sections.length - 1

        return (
          <div key={s.category} style={s.visible ? card : cardDisabled}>
            {/* ── Row 1: checkbox + category + move buttons ── */}
            <div style={row}>
              <input
                type="checkbox"
                checked={s.visible}
                onChange={(e) => updateSection(i, { visible: e.target.checked })}
                style={{ width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ flex: 1, fontWeight: s.visible ? 600 : 400, color: s.visible ? '#111' : '#aaa' }}>
                {s.category}
              </span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} style={moveBtn(i === 0)}>↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={isLast} style={moveBtn(isLast)}>↓</button>
            </div>

            {/* ── Row 2: columns + max + showViewAll (only when visible) ── */}
            {s.visible && (
              <>
                <div style={{ ...row, paddingLeft: 26, gap: 16 }}>
                  {/* Columns */}
                  <div style={{ ...row, gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#888', marginRight: 4 }}>Kolommen</span>
                    {[2, 3].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => changeColumns(i, n)}
                        style={pillBtn(cols === n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Max presets */}
                  <div style={{ ...row, gap: 4 }}>
                    <span style={{ fontSize: 12, color: '#888', marginRight: 4 }}>Max</span>
                    {presets.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateSection(i, { max: p })}
                        style={pillBtn(s.max === p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Show all toggle */}
                  <label style={{ ...row, gap: 6, fontSize: 12, color: '#888', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={s.showViewAll ?? false}
                      onChange={(e) => updateSection(i, { showViewAll: e.target.checked })}
                      style={{ width: 14, height: 14 }}
                    />
                    Show all link
                  </label>
                </div>

                {/* Description textarea */}
                <div style={{ paddingLeft: 26 }}>
                  <textarea
                    placeholder="Optionele tekst onder de sectietitel…"
                    value={s.description ?? ''}
                    onChange={(e) => updateSection(i, { description: e.target.value })}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 13,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      color: '#333',
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
