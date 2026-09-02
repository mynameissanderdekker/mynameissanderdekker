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

---

## Webshop: de server bepaalt prijs, voorraad en korting

`src/lib/checkoutPricing.ts` — `priceCart()` en `applyCoupon()`. De browser
stuurt alleen `id` (eventueel `<id>::<sku of label>` voor een uitvoering) en
`quantity`; prijs, tarief, voorraad en de kortingscode bepaalt de server, tegen
het servertotaal. `create-session` zet netto, tarief, variant en `artworkId` in
de Stripe-metadata; de webhook schrijft ze op de orderregel, mét `item`-verwijzing.

Waarom: `priceIncl` uit de winkelwagen ging rechtstreeks naar Stripe, en de
kortingscode kwam als kant-en-klaar bedrag binnen — een verzonnen coupon van
100% werd gewoon toegepast. `scripts/testrun-webshop.mts` probeert beide.

**De korting hoort óók op de order.** Stripe trok hem van het betaalbedrag af,
maar het orderdocument bewaarde alleen de code: de regels telden op tot méér dan
er betaald was, zonder dat ergens stond waarom. `create-session` zet nu soort,
waarde en bedrag in de metadata; de webhook schrijft `discountPercent` (bij een
percentage) en `discount`. Let op: **`discount` is exclusief BTW** — de coupon
rekent op het bedrag inclusief, dus de webhook rekent evenredig terug. De
factuurpagina trekt `discount` van het nettobedrag af, dus alleen zo komt de
factuur uit op wat Stripe heeft afgeschreven.

**`totalExcl` staat naast `totalAmount`**, met dezelfde betekenis als in de
verkooptool: netto, ná korting, zonder verzending.

**Een bestaand contact wordt aangevuld, niet overschreven.** Het bezorgadres van
één bestelling ging over het adres in het CRM heen — ook bij een cadeau naar
iemand anders. De webhook vult nu alleen lege velden, inclusief `clientLocation`
en `invoiceLanguage` (`'nl'`, want de webshop rekent inclusief BTW af).

---

## Admin-toegang en ordertotalen

Zelfde `adminAuth.ts` als de gallery-template, gedeeld via `sync-shared.mjs`:
fail closed zonder `ADMIN_PASSWORD`, HMAC in de cookie in plaats van het
wachtwoord. Alle routes die `admin_session` lazen gebruiken nu
`isValidAdminCookie()` of `isAdminRequest()`.

`src/middleware.ts` doet hetzelfde als de gallery-template, maar staat **niet**
in `sync-shared.mjs`: daar is de admin-auth samengevoegd met site-eigen dingen
in `proxy.ts` (Next.js 16 staat geen aparte `middleware.ts` ernaast toe). Een
wijziging aan de admin-logica daar komt hier dus niet vanzelf aan — met de hand
overnemen.

`manual-sale` rekent `totalAmount` met het tarief van de **klant**
(`vatTreatment(clientLocation)`), schrijft `totalExcl`, en zet per regel
`item`, `priceExcl` en `vatRate`.

Nog niet gelijkgetrokken met de gallery-template, bewust: `purchases[]` heet
hier `soldVia`/`price`/`editionNumber` tegenover `channel`/`priceExVat` daar.
Dat is echte data en dus een migratie.

