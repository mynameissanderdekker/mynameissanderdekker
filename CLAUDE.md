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

## Eén werk, één verkoop

Zelfde gat als in de gallery-template, zelfde oplossing (`src/lib/createOrder.ts`,
gedeeld via `sync-shared.mjs`): `manual-sale` keek niet of het werk nog te koop
was, en het nummer uit de verkooptool ging ongecontroleerd de order in — twee
open tools hadden allebei hetzelfde "volgende" nummer.

Nu: statuscontrole vooraf (409 bij "al verkocht"), order en werk in één
transactie met revisiecontrole, en het nummer uit de tool is een **voorkeur**:
is het intussen bezet, dan krijgt de order het volgende vrije nummer en de
tool het werkelijke nummer terug (`invoiceNumber` in het antwoord). De
webhook van de webshop gebruikt dezelfde weg. `scripts/testrun-double-sale.mts`
meet alle drie de gevallen.

Ook opgeruimd: acht contacten met een aankoop die naar `drafts.<id>` verwees
(historische import) — hun Collectie-tab toonde een leeg vak
(`scripts/fix-purchase-draft-refs.mjs`). Nog open: twee dubbele contacten
(Shirien van Maurik, Frans Oomen — één echt, één uit de import).

---

## Botbeveiliging: `src/lib/verifyTurnstile.ts`

Gedeeld met de gallery-template (staat in `sync-shared.mjs`). De uitleg staat
daar; hier alleen wat voor deze repo geldt.

Drie publieke formulieren lopen erlangs: nieuwsbrief in de footer
(`action: 'newsletter'`), contact (`action: 'contact'`) en het werk-aanvraagpaneel
(`action: 'enquire'`). Dat laatste stond volledig open — geen widget, geen
controle, en het stuurt rechtstreeks mail naar de studio.

De aanleiding was een melding van Cloudflare: siteverify werd niet aangeroepen
voor de nieuwsbrief. De code léék te kloppen, maar zat achter
`if (secretKey)` — zonder sleutel in de omgeving gebeurde er niets. Staat
`TURNSTILE_SECRET_KEY` niet op Vercel, dan is dat precies wat je ziet.

`scripts/testrun-turnstile.mts` draait alle drie de routes na.

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

---

## De verkooptool viel terug op een willekeurig factuurnummer

`RegisterSaleTool` haalde het volgnummer op met een kale
`fetch('/api/admin/generate-number?type=invoice')` — **zonder het Sanity-token**
van de ingelogde Studio-gebruiker. Die route wil een admin-cookie óf een token;
in de Studio heb je die cookie meestal niet, dus kwam er een 401 en viel de tool
terug op `SD-202609-473`: een willekeurig getal buiten de doorlopende reeks.

Of je factuurnummer in de reeks zat hing dus af van de vraag of je toevallig in
dezelfde browser bij `/admin` was ingelogd. Voor een factuurreeks is dat niet
goed genoeg — die hoort doorlopend te zijn.

Nu via `haalVolgnummer(client)`, die het token meestuurt zoals
`ProposalCompletion` al deed. De terugval blijft bestaan voor het geval de route
echt onbereikbaar is; `manual-sale` behandelt het meegestuurde nummer sowieso
als een **voorkeur** en pakt het volgende vrije nummer als het bezet is.

De gallery-template heeft dit niet: daar vraagt de verkooptool geen nummer op
maar krijgt het terug van de server.

---

## Wat de rondgang verder opleverde

`scripts/walkthrough.mts` (overgenomen uit de gallery-template) opent elke
pagina en elke leesbare API. Twee dingen om te onthouden bij het lezen van de
uitslag:

- **Negen van de pagina's zijn client-componenten** en zijn buiten Next niet te
  renderen — JSX draait hier zonder Next-runtime niet. Die worden overgeslagen
  met een `·`, niet als fout geteld.
- **Een expositie krijgt alleen een pagina als `hasPage` aanstaat.** De CV-lijst
  en de projectpagina linken er ook alleen dán naartoe, dus een 404 op een
  expositie zonder dat vinkje is geen dode link. De rondgang filtert erop.

**Nooit backticks in commentaar binnen een template-literal.** Een GROQ-query
staat in een template-literal; een `// noot met `backticks`` erin breekt de
string en geeft een onbegrijpelijke esbuild-fout. Twee keer op ingelopen.

---

## Twee gaten die uit de gallery-template kwamen

**Het wachtwoord op een prijslijst stelde niets voor.** `page.tsx` haalde het
wachtwoord én alle werken met prijzen op en gaf ze mee aan de client, die in de
browser vergeleek. Wie de link had kon de prijslijst uit de paginabron lezen
zonder iets in te tikken. De werken komen nu via `POST /api/private-sale/[token]`,
ná controle op de server. `scripts/testrun-private-sale.mts` toetst het.

**De Mailchimp-webhook controleerde niets zonder sleutel.**
`src/app/api/webhooks/sanity-contact/route.ts` had `if (secret) { …verify… }`:
ontbreekt `SANITY_WEBHOOK_SECRET` in de omgeving, dan kon iedereen een
contactpayload sturen die doorschrijft naar Mailchimp. Nu 503 zonder sleutel —
dezelfde regel als bij `ADMIN_PASSWORD` en `TURNSTILE_SECRET_KEY`. Ook opgelost:
`timingSafeEqual` gooide een fout bij een verminkte handtekening, dus je kreeg
een 500 in plaats van een 401.

`audit-data` en `audit-studio-lists` stonden hard op `dataset: 'production'` en
lezen die nu uit de omgeving.

---

## Expositie- en beurspagina: drie dingen die niet pasten

- **De datum brak middenin af.** "17 September 2026 – 20 September 2026" in een
  kolom van 20% gaf "20 [enter] September 2026". Nu twee regels met een eigen
  label: *Start* en *End*, met de korte maandnaam (`month: 'short'` → "17 Sept
  2026"). Is er maar één datum, dan staat er *Date*.
- **De beschrijving liep van het scherm.** `gridTemplateColumns: '20% 80%'` met
  `gap: 48px` telt op tot méér dan de volle breedte, dus stak de rechterkolom
  eruit. Nu `minmax(140px, 200px) minmax(0, 1fr)` — die `minmax(0, …)` is de
  kern: een grid-kolom krimpt standaard niet onder de inhoud, waardoor lange
  tekst de kolom oprekt in plaats van af te breken.
- **De terugknop wees altijd naar `/works`.** Kwam je uit de CV, uit een project
  of uit de aankondiging op de homepage, dan zette hij je ergens anders neer.
  `src/components/BackLink.tsx` gaat terug in de geschiedenis — maar alleen als
  je van deze site komt (`document.referrer` op dezelfde origin én
  `history.length > 1`). Zonder die controle stuurt een gedeelde link de
  bezoeker terug naar Google. Anders de opgegeven pagina, standaard `/works`.

**Zet geen `//`-commentaar tussen JSX-attributen.** Ik deed dat bij het
`style`-attribuut van de banner; dat is geen commentaar maar onzin in de
opening tag. Commentaar hoort vóór het element, in `{/* … */}`.

---

## De banner-afbeelding werd nergens uitgelezen

`image` ("Banner Image") staat op zowel `exhibition` als `artFair`, maar géén
van de twee publieke pagina's las het veld op. Je kon hem uploaden en er
gebeurde niets — niet op de pagina, niet in de social preview, niet in de
aankondiging op de homepage. Alleen `images[]` (de standfoto's) werd getoond, en
die vul je pas ná afloop.

Nu leest elk van de drie plekken hem: de beurspagina, de expositiepagina en
`generateMetadata` (die nam de eerste standfoto, ook als er een banner was).
Boven de titel, volle breedte, `maxHeight: 420`.

**De aankondiging valt terug tot er beeld ís:** banner → standfoto → het eerste
werk dat aan het evenement hangt, los gekoppeld of via `artworkSeries`. Zonder
die terugval stond er een kale witte doos op de homepage zodra iemand vergat een
banner te kiezen — en dat gebeurde meteen bij de eerste beurs.

Let op bij het formaat: de banner is liggend, de terugval is een **werk** en dat
is vaak staand. Daarom geen `h=560&fit=crop` meer maar volle breedte met een
begrensde hoogte, anders sneed de crop de helft van het werk weg.

**Het kopje hangt van de datum af.** Er stond vast "At the fair", ook als de
beurs nog moest beginnen — precies het geval waarvoor je een aankondiging
gebruikt. Nu: *Upcoming art fair* / *At the fair* en *Upcoming exhibition* /
*Now on view*. De stand staat er ook bij; op een beurs is dat het enige waarmee
een bezoeker je terugvindt.

---

## Annuleren draait de verkoop terug

Overgenomen uit de gallery-template (`src/lib/reverseSale.ts`, gedeeld via
`sync-shared.mjs`). `cancelled` en `refunded` waren alleen een status: het werk
bleef op `sold`, de voorraad bleef afgeboekt en de aankoop bleef in het CRM
staan. De knoppen staan onderaan `OrderCompletion` en roepen
`/api/admin/reverse-sale` aan; die route staat hier apart omdat MNSDK
`getSanityWriteClient()` gebruikt waar de gallery-template `writeClient` heeft.

`scripts/testrun-reverse.mts` draait in beide repo's — het bestand zoekt zelf
uit of er een `src/`-map is, en accepteert zowel `SANITY_WRITE_TOKEN` als
`SANITY_API_WRITE_TOKEN`. Zonder die twee aanpassingen viel hij hier om op een
lege `artist`-verwijzing (deze site heeft geen `artist`-documenten) en op
ontbrekende schrijfrechten.

---

## Webshop en eigen verkoop staan nu los van elkaar

Zelfde scheiding als in de gallery-template, en om dezelfde reden: een
bestelling uit de winkel is klein spul dat vanzelf binnenkomt, een verkoop is
een werk dat je zelf sluit en invoert. `WEBSHOP_ORDER_FILTER` /
`GALLERY_ORDER_FILTER` staan in `src/lib/orderStatus.ts` (gedeeld, dus via
`sync-shared.mjs`).

SALES → Orders en Archive tonen alleen wat je zelf hebt ingevoerd; WEBSHOP →
Webshop orders heeft nu drie sublijsten (Nog te doen / Afgehandeld / Alle
bestellingen). Dat "nog te doen" is er bewust: zonder die lijst zou een
betaalde bestelling die nog verstuurd moet worden nergens meer opvallen.

**Het bolletje op Webshop orders telde alleen `awaiting-payment`** en dus niet
de bestellingen die betaald zijn maar nog de deur uit moeten. Het staat nu op
`OPEN_ORDER_FILTER`, net als in de gallery-template.

De lijstweergave toont het kanaal (`TEST-WEB · Webshopklant` / `Webshop · 3
Sept 2026 · €100.00 · Paid`). Heeft een order geen `channel` én geen betaal-id,
dan blijft het label weg in plaats van iets te gokken. `pickup` staat hier
bewust niet in de preview: afhalen is alleen in de gallery-template gebouwd.

Sales Overview telt beide kanalen op — dat is het overzicht, niet de werklijst.

---

## De zoekfout op contacten stond hier nog wél

`lib/contactSearch.ts` bestond in de gallery-template maar was hier nooit
overgenomen, terwijl drie plekken hun eigen zoekregel hadden:
`/api/admin/search-contacts`, `RegisterSaleTool` en `ArtworkReservation`. Typ je
"Tessa Testklant" — het meest voor de hand liggende — dan vond je niets: geen
enkel veld bevat de volledige naam. Alle drie gebruiken nu dezelfde functie, en
het bestand staat in `sync-shared.mjs`.

`ArtworkReservation.tsx` was hier bovendien de oudere versie: de overdracht naar
de verkooptool (werk én klant mee) ontbrak.

---

## De sync bestond, maar niets riep hem aan

`scripts/sync-shared.mjs` houdt de gedeelde bestanden tussen de twee templates
woord voor woord gelijk — en dat werkte alleen als iemand eraan dácht. Gevolg:
een fix in de ene repo werd in de andere pas opgemerkt als er iets stuk was.

`ship.sh` draait nu `sync-shared.mjs --check` vóór elke push, in **beide**
repo's. Loopt een gedeeld bestand uiteen, dan gaat er niets live en zegt het
script welk bestand het is. Staat de andere repo niet naast deze (exitcode 2),
dan wordt de controle overgeslagen in plaats van geblokkeerd — dat is een andere
werkplek, geen fout.

Wat níet gedeeld is en dus met de hand moet: `structure.ts` (de Studio-secties
verschillen echt per template) en de order-preview in `src/sanity/schemas/order.ts`.

---

## Uitrollen: `./scripts/ship.sh`

Schrijven en testen gebeurt in de sessie; committen, pushen en Vercel hebben
sleutels nodig die alleen op Sanders machine staan. Dat laatste is één commando:

```bash
./scripts/ship.sh "wat je hebt gedaan"   # controle, add (alleen gewijzigde bestanden), commit, push
./scripts/ship.sh --env                  # ook de Turnstile-sleutels naar Vercel
./scripts/ship.sh --dry                  # eerst laten zien wat er zou gebeuren
./scripts/ship.sh --full                 # ook de schrijvende testruns (minuten)
./scripts/ship.sh --force                # pushen ook al is de controle rood
```

**Vóór elke push draait een controle**: TypeScript, `audit-studio-lists`,
`audit-data`, `testrun-print` en `testrun-turnstile` — alles wat alleen leest.
Is er iets rood, dan gaat er niets live. Dat is de afspraak die maakt dat wat
vandaag klopt ook morgen nog klopt: een fout die een test vindt, kan niet meer
gedeployed worden zonder `--force`, en dan is het een bewuste keuze.

De push naar `main` start de productiebuild — `vercel --prod` is alleen nodig
als je buiten git om iets wilt uitrollen, of nadat je een env-variabele hebt
gewijzigd.

Het script doet bewust **geen** `git add -A`: nieuwe bestanden worden getoond en
apart bevestigd. Staat je tak niet op `main`, dan stopt hij en zegt hoe je
samenvoegt. `--env` weigert een sleutelpaar dat niet van hetzelfde widget komt
of dat Cloudflare zelf afkeurt.
