@AGENTS.md

# mynameissanderdekker — artist template

Referentie-implementatie van de **artist template** van GingerBeard.Works.
`ia-kahkonen` draait hierop; wat hier landt erft die.

Gedeelde afspraken (ordermodel, GROQ-valkuilen, het paneelpatroon, Studio-regels)
staan in de kennisbasis van het Claude-project. Hier staat alleen wat voor deze
repo geldt.

---

## Twee types die op elkaar lijken: `project` en `projectSeries`

Op een expositie kun je op twee plekken iets kiezen dat "project" heet:

| Veld | Type | Wat het doet |
|---|---|---|
| `cvProject` (tab CV) | `project` | Groepeert exposities op de CV-pagina |
| `artworkSeries[]` (tab Artworks) | `projectSeries` | Haalt de wérken op |

Zes van de negen projecten bestaan onder **dezelfde naam** in beide types —
#Fun, Innate Curiosity, It Is Us, The Social Landscape, The Social Media Project,
The Zine Project. Dat is geen bug, maar wel een bron van verwarring, en de namen
lopen al uiteen ("Innate Curiosity " met een spatie tegenover "Innate Curiosity").

`project` verwijst zelf al naar `artworkSeries[]`, dus de brug bestaat. Een
mogelijke opruiming: alleen `cvProject` laten kiezen en de werken afleiden via
`cvProject->artworkSeries[]`. Bewust geparkeerd — dit hoort bij een bredere
herziening waarin het model losgetrokken wordt van één specifieke kunstenaar.

---

## Exposities zijn historie, geen programma

Bij een galerie is een expositie iets dat nú loopt en dat je samenstelt. Hier is
het een feit uit je loopbaan: waar je werk heeft gehangen.

Gevolg: **geen enkele van de 42 exposities heeft een `endDate`.** Elke filter in
de trant van "loopt nu" (`startDate <= today && endDate >= today`) levert daarom
alle 42 op. Daarom bestaat "Current exhibition" hier niet, en staat
`showOnHomepage` standaard **uit** — je wijst zelf aan wat er aangekondigd wordt.

De koppeling werk↔expositie loopt hier vanaf het werk (`artwork.exhibitions[]`),
niet vanaf de expositie. Dat is de omgekeerde richting van de exhibition-first
flip in de gallery-template, en dat is met opzet.

---

## Locatie van een expositie

`venueSpace` bewaart een string met voorvoegsel:

- `own:<_key>` — een eigen adres uit `siteSettings.addresses[]` (studio)
- `contact:<_id>` — een galerie uit de contacten

De lijst toont alleen contacten met `type == "gallery" && worksWithMe == true`.
Dat vinkje bestaat omdat `type == "gallery"` te grof is: in de nieuwsbrieflijst
staan tientallen galeries waar nooit mee gewerkt wordt.

Voor een eenmalige plek (museum, project space, beursstand) zet je
`venueElsewhere` aan en vul je het `venue`-object in.

`gallery` en `location` zijn de oude tekstvelden. Ze staan alleen-lezen en
verborgen zolang ze leeg zijn — oudere exposities bewaren daar hun plaatsnaam.

---

## Press: één richting

Je koppelt een persbericht aan een expositie **vanuit het persbericht**
(`press.exhibitions[]`), nooit andersom. Er stond eerder een `press[]` op de
expositie mét de instructie "keep both in sync" — twee lijsten die je met de hand
gelijk moet houden lopen altijd uit elkaar. In de praktijk was die array overigens
nooit gevuld.

---

## Bekende losse eindjes

- **Printables ontbreken.** De gallery-template heeft `/admin/print/[slug]/`
  met labels, pricelist en catalog (samen ~856 regels). Hier bestaan die routes
  niet, dus de knop is bewust niet overgenomen — dode links zijn erger dan geen
  knop.
- **`invoiceSettings` is leeg.** Geen KVK, IBAN, BTW-nummer of adres, terwijl de
  factuurcode die velden wel leest. Facturen die hier uitgaan missen dus wettelijk
  verplichte gegevens. Invullen onder Site Settings → Invoice & business.
- **`npx tsc` is niet schoon.** Bestaande fouten in `works/page.tsx`
  (`salePriceExclVAT`, `variantImages`, `onSale` bestaan niet op het varianttype)
  en in de checkout-webhook. Daardoor is lastig te zien of een nieuwe wijziging
  iets breekt.
- **Git laat lockbestanden achter** wanneer een sandbox in deze map commit.
  Committen gebeurt daarom lokaal; blijft er een `.git/HEAD.lock` staan, dan
  verwijder je die met de hand.
- `src/sanity/components/ExhibitionPrint.tsx` is een leeg bestand dat weg mag.

---

## Mobiele app

Bestaat hier nog niet. De gallery-template heeft `/app` met pincode-toegang,
prijslijsten, verkoop registreren, contact toevoegen en werk reserveren. Voor een
kunstenaar is het equivalent een open studio of een eigen presentatie; de
tegenhanger van "work submissions" is hier `loan` — werk dat je uitleent aan
galeries.
