// ── Studio Help Q&A ───────────────────────────────────────────────────────────
// Edit this file to add, update or translate FAQ entries.

export interface HelpFAQ {
  id: string
  nl: { q: string; a: string }
  en: { q: string; a: string }
}

export const HELP_FAQS: HelpFAQ[] = [

  // ── Artwork ────────────────────────────────────────────────────────────────

  {
    id: 'add-artwork',
    nl: {
      q: 'Hoe voeg ik een nieuw kunstwerk toe?',
      a: 'Ga naar Works → Artworks → klik op het + icoon rechtsboven. Vul de Basis-tab in: titel, jaar, techniek, afmetingen, foto\'s, prijs en status. Klik op Publish om het live te zetten.',
    },
    en: {
      q: 'How do I add a new artwork?',
      a: 'Go to Works → Artworks → click the + icon top right. Fill in the Basis tab: title, year, medium, dimensions, photos, price and status. Click Publish to make it live.',
    },
  },
  {
    id: 'set-price',
    nl: {
      q: 'Hoe stel ik een prijs in, of zet ik een werk op "prijs op aanvraag"?',
      a: 'Open het kunstwerk → Basis-tab. Vul "Prijs incl. BTW" in voor een vaste prijs. Zet het vinkje "Price on request" aan als je geen prijs wil tonen.',
    },
    en: {
      q: 'How do I set a price, or mark an artwork as "price on request"?',
      a: 'Open the artwork → Basis tab. Fill in "Price incl. VAT" for a fixed price. Enable the "Price on request" checkbox if you don\'t want to show a price.',
    },
  },
  {
    id: 'artwork-status',
    nl: {
      q: 'Hoe verander ik de status van een kunstwerk?',
      a: 'Open het kunstwerk → Basis-tab → Status. Kies uit: Available, Reserved, Sold, On loan, of Not for sale.',
    },
    en: {
      q: 'How do I change the status of an artwork?',
      a: 'Open the artwork → Basis tab → Status. Choose from: Available, Reserved, Sold, On loan, or Not for sale.',
    },
  },
  {
    id: 'coa',
    nl: {
      q: 'Hoe maak ik een Certificate of Authenticity?',
      a: 'Open het kunstwerk → Gallery-tab. Klik op "Open CoA" om de print-pagina te openen. Vul eerst de editiegegevens in (Basis-tab) zodat het certificaat correct is.',
    },
    en: {
      q: 'How do I create a Certificate of Authenticity?',
      a: 'Open the artwork → Gallery tab. Click "Open CoA" to open the print page. First fill in the edition details (Basis tab) so the certificate is correct.',
    },
  },
  {
    id: 'webshop',
    nl: {
      q: 'Hoe zet ik een werk in de webshop?',
      a: 'Open het kunstwerk → Webshop-tab. Zet "Sell in webshop" aan en voeg een kooplink (Mollie/Stripe) toe. Sla op en publiceer.',
    },
    en: {
      q: 'How do I put an artwork in the webshop?',
      a: 'Open the artwork → Webshop tab. Enable "Sell in webshop" and add a buy link (Mollie/Stripe). Save and publish.',
    },
  },
  {
    id: 'torch-sync',
    nl: {
      q: 'Hoe synchroniseer ik een werk naar Torch Gallery?',
      a: 'Open het kunstwerk → klik op "Sync to Torch" in de toolbar bovenaan. Of gebruik de Torch Sync-tool in de navigatie om meerdere werken tegelijk te synchroniseren.',
    },
    en: {
      q: 'How do I sync an artwork to Torch Gallery?',
      a: 'Open the artwork → click "Sync to Torch" in the top toolbar. Or use the Torch Sync tool in the navigation to sync multiple works at once.',
    },
  },
  {
    id: 'exhibition',
    nl: {
      q: 'Hoe maak ik een tentoonstelling aan?',
      a: 'Ga naar Trade → Exhibitions → + Create. Vul naam, begin- en einddatum in. Koppel werken aan de tentoonstelling via de artwork-editor (Gallery-tab → Exhibitions).',
    },
    en: {
      q: 'How do I create an exhibition?',
      a: 'Go to Trade → Exhibitions → + Create. Fill in the name, start and end date. Link artworks to the exhibition via the artwork editor (Gallery tab → Exhibitions).',
    },
  },
  {
    id: 'register-sale',
    nl: {
      q: 'Hoe registreer ik een verkoop?',
      a: 'Ga naar Trade → Make or Register a Sale. Zoek het werk op, vul de koper en het bedrag in. De status wordt automatisch op "Sold" gezet.',
    },
    en: {
      q: 'How do I register a sale?',
      a: 'Go to Trade → Make or Register a Sale. Find the artwork, enter the buyer and amount. The status is automatically set to "Sold".',
    },
  },
  {
    id: 'contact',
    nl: {
      q: 'Hoe voeg ik een contact toe?',
      a: 'Ga naar Network → Contacts → + Create. Voer naam, e-mail en type (collector, press, gallery) in. Je kunt ook notities toevoegen.',
    },
    en: {
      q: 'How do I add a contact?',
      a: 'Go to Network → Contacts → + Create. Enter the name, email and type (collector, press, gallery). You can also add notes.',
    },
  },
  {
    id: 'publish-vs-save',
    nl: {
      q: 'Wat is het verschil tussen opslaan en publiceren?',
      a: '"Save" slaat je wijzigingen op als concept — nog niet zichtbaar op de website. "Publish" maakt de wijzigingen live. Discard changes verwijdert de concept-versie.',
    },
    en: {
      q: 'What is the difference between saving and publishing?',
      a: '"Save" stores your changes as a draft — not yet visible on the website. "Publish" makes the changes live. Discard changes removes the draft version.',
    },
  },
  {
    id: 'draft-dots',
    nl: {
      q: 'Ik zie oranje+groene stippen bij werken — wat betekent dat?',
      a: 'Oranje+groen betekent dat het werk zowel een gepubliceerde als een concept-versie heeft. Klik op "Discard changes" om het concept te verwijderen, of "Publish" om het concept live te zetten.',
    },
    en: {
      q: 'I see orange+green dots on works — what does that mean?',
      a: 'Orange+green means the work has both a published and a draft version. Click "Discard changes" to remove the draft, or "Publish" to make it live.',
    },
  },
  {
    id: 'coupon',
    nl: {
      q: 'Hoe maak ik een kortingscode aan?',
      a: 'Ga naar Webshop → Coupons → + Create. Kies een code, het type korting en een geldigheidsdatum.',
    },
    en: {
      q: 'How do I create a discount code?',
      a: 'Go to Webshop → Coupons → + Create. Choose a code, the discount type and an expiry date.',
    },
  },

]
