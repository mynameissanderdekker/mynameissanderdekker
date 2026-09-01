'use client'
import { useEffect } from 'react'
import { useRouter } from 'sanity/router'

/**
 * Opent meteen een leeg, nog niet opgeslagen document van het gevraagde type.
 *
 * Waarom een component en niet `.documentId(<vast id>)`: een vast id zou bij
 * elke klik hetzelfde document heropenen. Hier wordt per keer een nieuwe UUID
 * gemaakt, dus "Add new …" levert altijd een leeg formulier op.
 *
 * Dit verving vier verschillende aanpakken. Alleen bij artwork opende de knop
 * echt een nieuw document; bij exhibition, art fair en publication opende hij
 * de lijst — het label beloofde iets anders dan er gebeurde.
 */
export function makeNewDocumentRedirect(type: string, label = 'document') {
  return function NewDocumentRedirect() {
    const router = useRouter()

    useEffect(() => {
      const id = crypto.randomUUID()
      router.navigateUrl({ path: `/studio/intent/edit/id=${id};type=${type}` })
    }, [router])

    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#9ca3af', fontSize: 13,
        }}
      >
        Opening new {label}…
      </div>
    )
  }
}
