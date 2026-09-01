# Openstaand — artist template

Wat er klaarligt maar nog aandacht vraagt. Afgeronde besluiten staan in
`CLAUDE.md`; dit is de werklijst.

---

## 1. Aankondiging op de homepage — afmaken

**Status:** gebouwd, niet in een browser gezien.
`src/components/ExhibitionAnnouncement.tsx` + de query in `src/app/(site)/layout.tsx`.

Verschijnt na ~1 seconde als **pop-up** over de pagina: bannerafbeelding,
"Now on view", titel, plek, data, en een knop naar de expositiepagina als
`hasPage` aanstaat. Wegklikken wordt per expositie onthouden in `localStorage`.

**Eerst dit, in deze volgorde:**

1. **Kijken of hij past.** Zet één expositie op *Announce on the homepage* met
   een bannerafbeelding en open de site. De homepage is vast vormgegeven, dus de
   kans bestaat dat het venster ertegenin werkt.
2. **Kiezen tussen venster en strook.** Een strook onderaan het scherm is
   minder opdringerig en dekt de vormgeving niet af. Dat is een kleine wijziging
   in hetzelfde component — alleen de buitenste `div` en de positionering.
3. ~~Beslissen wat er gebeurt zonder einddatum.~~ **Opgelost:** de pop-up heeft
   nu een eigen periode — *Pop-up from* en *Pop-up until*, zichtbaar zodra het
   vinkje aanstaat. Los van de expositiedatums, want je kondigt meestal eerder
   aan dan de opening en haalt hem eerder weg dan de expositie voorbij is. Beide
   mogen leeg: dan begint hij meteen, of blijft hij tot je het vinkje uitzet.

**Nog niet gedaan:**

- Geen `prefers-reduced-motion`-respect — er zit nu een vertraging van 900 ms,
  geen animatie, dus dit speelt pas als er een fade bij komt.
- Toetsenbord: Escape sluit hem nog niet, en de focus springt niet naar het
  venster. Voor een aankondiging die je met de muis wegklikt is dat te doen,
  maar het hoort er wel bij.
- Nooit getest op mobiel. Bij een liggende bannerafbeelding op een smal scherm
  kan de knop onder de vouw vallen.

**Bewust niet gedaan:** meerdere aankondigingen tegelijk. De query pakt de meest
recente met het vinkje aan. Twee vensters over elkaar is nooit de bedoeling.

---

## 2. Printables

De gallery-template heeft `/admin/print/[slug]/` met **labels**, **pricelist** en
**catalog** — samen zo'n 856 regels. Hier bestaan die routes niet, dus de
knoppen zijn bewust niet overgenomen: dode links zijn erger dan geen knop.

Overnemen betekent de drie printpagina's bouwen én `ExhibitionPrint.tsx`
terugzetten. Zinvol zodra iemand een open studio of eigen presentatie doet.

---

## 3. `invoiceSettings` is leeg

Geen KVK, IBAN, BTW-nummer of adres, terwijl de factuurcode die velden leest.
Facturen die hier uitgaan missen wettelijk verplichte gegevens. Invullen onder
**Site Settings → Invoice & business** — geen code nodig.

---

## 4. `artworkSeries` op de expositie

Eén expositie (The Zine Project) gebruikt hem nog, met 34 werken. Sinds de
artwork-picker erin zit kun je die werken direct kiezen. Omzetten en het veld
laten vervallen, of laten staan tot de bredere herziening van
`project` / `projectSeries` (zie `CLAUDE.md`).

---

## 5. ~~`npx tsc` is niet schoon~~ **Opgelost**

Stond hier met fouten in `src/app/(site)/works/page.tsx` (`salePriceExclVAT`,
`variantImages`, `onSale` bestaan niet op het varianttype) en in de
checkout-webhook. `npx tsc --noEmit` geeft nu geen output meer.

---

## 6. Mobiele app

Bestaat hier niet. De gallery-template heeft `/app` met pincode, prijslijsten,
verkoop registreren, contact toevoegen en werk reserveren. Voor een kunstenaar
is de aanleiding een open studio of eigen presentatie; de tegenhanger van
"work submissions" is `loan` — werk dat je uitleent aan galeries.

---

## 7. Dashboard mist twee secties

- **Reserveringen** — wacht op `reservedFor`, `reservedUntil` en `reservedNote`
  op `artwork`, die hier nog niet bestaan.
- **Uitgeleend werk** — op basis van het bestaande `loan`-type: leningen waarvan
  de einddatum nadert of verstreken is. De gallery-template heeft op die plek
  "Work submitted by artists", wat hier geen tegenhanger heeft.

---

## Opruimen

- `src/sanity/components/ExhibitionPrint.tsx` is leeg en mag weg.
- `scripts/migrate-exhibition-fields.mjs` moet nog draaien: 5 beschrijvingen naar
  portable text.
- Git laat lockbestanden achter wanneer een sandbox hier commit. Blijft er een
  `.git/HEAD.lock` staan, verwijder die met de hand.
