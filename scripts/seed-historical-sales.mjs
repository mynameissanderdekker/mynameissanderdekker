/**
 * Seed historical artwork and sales data into Sanity.
 * Creates artwork documents, contact documents with purchase records.
 * Uses createOrReplace — safe to re-run (idempotent).
 *
 * Run: node scripts/seed-historical-sales.mjs
 *
 * NOTE: Years marked (* est.) are estimates — update in Studio if needed.
 * TODO markers indicate purchase data from screenshots that needs verification.
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// ── Medium shorthands ──────────────────────────────────────────────────────────
const DIBOND  = 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond and plexiglass'
const CPRINT  = 'C-print'
const LAMBDA  = 'Lambda print on Fujicolor Crystal Archive paper'

function ref(id) {
  return { _type: 'reference', _ref: id }
}

// ── ARTWORKS ─────────────────────────────────────────────────────────────────

const artworks = [

  // ── 2012: Walls gallery era ───────────────────────────────────────────────
  {
    _id: 'artwork-hist-eye-of-the-tiger',
    _type: 'artwork',
    title: 'Eye of the tiger',
    slug: { _type: 'slug', current: 'eye-of-the-tiger' },
    year: 2012,
    medium: DIBOND,
    dimensions: { widthCm: 90, heightCm: 60 },
  },
  {
    _id: 'artwork-hist-burger-bullet',
    _type: 'artwork',
    title: 'Burger bullet',
    slug: { _type: 'slug', current: 'burger-bullet' },
    year: 2012,
    medium: DIBOND,
    dimensions: { widthCm: 40, heightCm: 30 },
  },
  {
    _id: 'artwork-hist-magic-world',
    _type: 'artwork',
    title: 'Magic World',
    slug: { _type: 'slug', current: 'magic-world' },
    year: 2012,
    medium: DIBOND,
    dimensions: { widthCm: 90, heightCm: 60 },
  },
  {
    _id: 'artwork-hist-holy-dress',
    _type: 'artwork',
    title: 'Holy Dress',
    slug: { _type: 'slug', current: 'holy-dress' },
    year: 2012,
    medium: CPRINT,
    dimensions: { widthCm: 45, heightCm: 30 },
  },
  {
    _id: 'artwork-hist-varietes',
    _type: 'artwork',
    title: 'Varietes',
    slug: { _type: 'slug', current: 'varietes' },
    year: 2012,
  },
  {
    _id: 'artwork-hist-varietes-frankrijk',
    _type: 'artwork',
    title: 'Varietes Frankrijk',
    slug: { _type: 'slug', current: 'varietes-frankrijk' },
    year: 2012,
    medium: DIBOND,
    dimensions: { widthCm: 72, heightCm: 54 },
  },
  {
    _id: 'artwork-hist-vis-aquarium-frankrijk',
    _type: 'artwork',
    title: 'Vis aquarium Frankrijk',
    slug: { _type: 'slug', current: 'vis-aquarium-frankrijk' },
    year: 2012,
    medium: CPRINT,
    dimensions: { widthCm: 40, heightCm: 30 },
  },
  {
    _id: 'artwork-hist-meisje-achter-blak-usa',
    _type: 'artwork',
    title: 'Meisje achter blak USA',
    slug: { _type: 'slug', current: 'meisje-achter-blak-usa' },
    year: 2012,
    medium: CPRINT,
    dimensions: { widthCm: 45, heightCm: 30 },
  },
  {
    _id: 'artwork-hist-laura-naaktop-bank',
    _type: 'artwork',
    title: 'Laura naaktop bank',
    slug: { _type: 'slug', current: 'laura-naaktop-bank' },
    year: 2012,
    medium: CPRINT,
    dimensions: { widthCm: 45, heightCm: 30 },
  },
  {
    _id: 'artwork-hist-air-gitar-isabel',
    _type: 'artwork',
    title: 'Air gitar (Isabel)',
    slug: { _type: 'slug', current: 'air-gitar-isabel' },
    year: 2012,
    medium: CPRINT,
    dimensions: { widthCm: 45, heightCm: 30 },
  },

  // ── 2013: Second batch ────────────────────────────────────────────────────
  {
    _id: 'artwork-hist-rabbit-hole',
    _type: 'artwork',
    title: 'Rabbit hole',
    slug: { _type: 'slug', current: 'rabbit-hole' },
    year: 2013, // est.
  },
  {
    _id: 'artwork-hist-kont-eva-lagerweij',
    _type: 'artwork',
    title: 'Kont Eva Lagerweij',
    slug: { _type: 'slug', current: 'kont-eva-lagerweij' },
    year: 2013, // est.
  },
  {
    _id: 'artwork-hist-connect-the-dots',
    _type: 'artwork',
    title: 'Connect the dots',
    slug: { _type: 'slug', current: 'connect-the-dots' },
    year: 2013, // est.
  },
  {
    _id: 'artwork-hist-the-jungle',
    _type: 'artwork',
    title: 'The jungle',
    slug: { _type: 'slug', current: 'the-jungle' },
    year: 2013, // est.
  },

  // ── Sharky series ─────────────────────────────────────────────────────────
  {
    _id: 'artwork-hist-sharky',
    _type: 'artwork',
    title: 'Sharky',
    slug: { _type: 'slug', current: 'sharky' },
    year: 2013, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-sharky-3d',
    _type: 'artwork',
    title: 'Sharky 3D',
    slug: { _type: 'slug', current: 'sharky-3d' },
    year: 2015, // est.
    medium: DIBOND,
  },

  // ── Edition 5 works (2013-2023) ───────────────────────────────────────────
  {
    _id: 'artwork-hist-the-fox',
    _type: 'artwork',
    title: 'The Fox',
    slug: { _type: 'slug', current: 'the-fox' },
    year: 2014, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-cars-n-heels',
    _type: 'artwork',
    title: "Cars 'n Heels",
    slug: { _type: 'slug', current: 'cars-n-heels' },
    year: 2014, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-the-maestro',
    _type: 'artwork',
    title: 'The Maestro',
    slug: { _type: 'slug', current: 'the-maestro' },
    year: 2014, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-cheeky-bum',
    _type: 'artwork',
    title: 'Cheeky Bum',
    slug: { _type: 'slug', current: 'cheeky-bum' },
    year: 2014, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-walls',
    _type: 'artwork',
    title: 'Walls',
    slug: { _type: 'slug', current: 'walls' },
    year: 2013, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-chocolate-puma',
    _type: 'artwork',
    title: 'Chocolate Puma',
    slug: { _type: 'slug', current: 'chocolate-puma' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-hall-pass',
    _type: 'artwork',
    title: 'Hall Pass',
    slug: { _type: 'slug', current: 'hall-pass' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-la-squeeze',
    _type: 'artwork',
    title: 'LA Squeeze',
    slug: { _type: 'slug', current: 'la-squeeze' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-the-beast',
    _type: 'artwork',
    title: 'The Beast',
    slug: { _type: 'slug', current: 'the-beast' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-employee-of-the-month',
    _type: 'artwork',
    title: 'Employee of the Month',
    slug: { _type: 'slug', current: 'employee-of-the-month' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-ill-show-you-mine',
    _type: 'artwork',
    title: "I'll show you mine",
    slug: { _type: 'slug', current: 'ill-show-you-mine' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-foodporn',
    _type: 'artwork',
    title: '#foodporn',
    slug: { _type: 'slug', current: 'foodporn' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-the-oracle',
    _type: 'artwork',
    title: 'The Oracle',
    slug: { _type: 'slug', current: 'the-oracle' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-tool-mans-dream',
    _type: 'artwork',
    title: "Tool man's dream",
    slug: { _type: 'slug', current: 'tool-mans-dream' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-i-spy-with-my-little-eye',
    _type: 'artwork',
    title: 'I spy with my little eye',
    slug: { _type: 'slug', current: 'i-spy-with-my-little-eye' },
    year: 2015, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-venetian-triptych',
    _type: 'artwork',
    title: 'Venetian Triptych',
    slug: { _type: 'slug', current: 'venetian-triptych' },
    year: 2016, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-catching-popcorn',
    _type: 'artwork',
    title: 'Catching Popcorn',
    slug: { _type: 'slug', current: 'catching-popcorn' },
    year: 2016, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-out-of-the-blue',
    _type: 'artwork',
    title: 'Out of the blue',
    slug: { _type: 'slug', current: 'out-of-the-blue' },
    year: 2016, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-play-with-fire',
    _type: 'artwork',
    title: 'Play with fire',
    slug: { _type: 'slug', current: 'play-with-fire' },
    year: 2016, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-and-we-deserve-to-twinkle',
    _type: 'artwork',
    title: 'And we deserve to twinkle',
    slug: { _type: 'slug', current: 'and-we-deserve-to-twinkle' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-so-fashion',
    _type: 'artwork',
    title: 'So fashion',
    slug: { _type: 'slug', current: 'so-fashion' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-a-pattern-of-madness-ii',
    _type: 'artwork',
    title: 'A pattern of madness II',
    slug: { _type: 'slug', current: 'a-pattern-of-madness-ii' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-confetti-party',
    _type: 'artwork',
    title: 'Confetti party',
    slug: { _type: 'slug', current: 'confetti-party' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-anthony-and-otto',
    _type: 'artwork',
    title: 'Anthony & Otto',
    slug: { _type: 'slug', current: 'anthony-and-otto' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-el-diablo-luchador-ii',
    _type: 'artwork',
    title: 'El Diablo Luchador II',
    slug: { _type: 'slug', current: 'el-diablo-luchador-ii' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-classic-rock',
    _type: 'artwork',
    title: 'Classic Rock',
    slug: { _type: 'slug', current: 'classic-rock' },
    year: 2018, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-from-russia-with-love',
    _type: 'artwork',
    title: 'From Russia with Love',
    slug: { _type: 'slug', current: 'from-russia-with-love' },
    year: 2019, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-villa-volta',
    _type: 'artwork',
    title: 'Villa Volta',
    slug: { _type: 'slug', current: 'villa-volta' },
    year: 2019, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-horticulture',
    _type: 'artwork',
    title: 'Horticulture',
    slug: { _type: 'slug', current: 'horticulture' },
    year: 2019, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-sorry-were-dead',
    _type: 'artwork',
    title: "Sorry we're dead",
    slug: { _type: 'slug', current: 'sorry-were-dead' },
    year: 2019, // est.
    medium: DIBOND,
  },
  {
    _id: 'artwork-hist-the-breakfast-club',
    _type: 'artwork',
    title: 'The Breakfast Club',
    slug: { _type: 'slug', current: 'the-breakfast-club' },
    year: 2023,
    medium: DIBOND,
  },

  // ── Social Media Project (Strayfield bulk deal 04-2020) ───────────────────
  {
    _id: 'artwork-hist-girl-in-red',
    _type: 'artwork',
    title: 'Girl in Red',
    slug: { _type: 'slug', current: 'girl-in-red' },
    year: 2019, // est.
    medium: DIBOND,
  },
  // TODO: 13 more Social Media Project titles from the Strayfield batch (April 2020)
  // Add these as: artwork-hist-{slug}, all edition 5, all sold to Strayfield copy 1, 2020-04-01

  // ── Edition 30 works ──────────────────────────────────────────────────────
  {
    _id: 'artwork-hist-day-at-the-museum',
    _type: 'artwork',
    title: 'Day at the museum',
    slug: { _type: 'slug', current: 'day-at-the-museum' },
    year: 2016, // est.
    medium: LAMBDA,
  },
  {
    _id: 'artwork-hist-smoking-bunny',
    _type: 'artwork',
    title: 'Smoking Bunny',
    slug: { _type: 'slug', current: 'smoking-bunny' },
    year: 2016, // est.
    medium: LAMBDA,
  },
  {
    _id: 'artwork-hist-lady-of-the-manor',
    _type: 'artwork',
    title: 'Lady of the manor',
    slug: { _type: 'slug', current: 'lady-of-the-manor' },
    year: 2017, // est.
    medium: LAMBDA,
  },
  {
    _id: 'artwork-hist-horsing-around',
    _type: 'artwork',
    title: 'Horsing Around',
    slug: { _type: 'slug', current: 'horsing-around' },
    year: 2017, // est.
    medium: LAMBDA,
  },
  {
    _id: 'artwork-hist-lunar-lunacy-effect',
    _type: 'artwork',
    title: 'Lunar Lunacy Effect',
    slug: { _type: 'slug', current: 'lunar-lunacy-effect' },
    year: 2019, // est.
    medium: LAMBDA,
  },
]

// ── CONTACTS WITH PURCHASES ───────────────────────────────────────────────────
//
// Purchase object shape:
//   { _key, artwork: ref(id), copyNumber, soldVia, date, price }
//
// soldVia values: 'webshop' | 'direct' | 'gallery' | 'artfair' | 'other'
// price: number (excl. VAT), or omit for gifts
// date: 'YYYY-MM-DD' or null

const contacts = [

  // ── Anneke Dekker (mom) ───────────────────────────────────────────────────
  {
    _id: 'contact-hist-anneke-dekker',
    _type: 'contact',
    firstName: 'Anneke',
    lastName: 'Dekker',
    email: 'anneke-dekker@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: "Sander's mother. Placeholder email — update if known.",
    purchases: [
      {
        _key: 'p-anneke-varietes-frankrijk',
        artwork: ref('artwork-hist-varietes-frankrijk'),
        copyNumber: '1/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
      {
        _key: 'p-anneke-magic-world',
        artwork: ref('artwork-hist-magic-world'),
        copyNumber: '2/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
      {
        _key: 'p-anneke-vis-aquarium',
        artwork: ref('artwork-hist-vis-aquarium-frankrijk'),
        copyNumber: '1/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
      // TODO: Cars 'n Heels (copy unknown) — via Walls/HnH
      // TODO: LA Squeeze (copy unknown) — via direct
    ],
  },

  // ── Vader Dekker (Sander's father, first name unknown) ───────────────────
  {
    _id: 'contact-hist-vader-dekker',
    _type: 'contact',
    firstName: 'Vader',
    lastName: 'Dekker',
    email: 'vader-dekker@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: "Sander's father. First name unknown. Placeholder email — update if known.",
    purchases: [
      // TODO: LA Squeeze (copy unknown) — "Ouders" = both parents
    ],
  },

  // ── G&T's — Tanya ────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-tanya-gt',
    _type: 'contact',
    firstName: 'Tanya',
    lastName: "G&T's",
    email: 'tanya-gt@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Buyer via Walls gallery. Part of "G&T\'s". Placeholder email.',
    purchases: [
      {
        _key: 'p-tanya-burger-bullet',
        artwork: ref('artwork-hist-burger-bullet'),
        copyNumber: '1/10+2AP',
        soldVia: 'gallery',
        date: '2012-11-01',
        price: 450,
      },
      {
        _key: 'p-tanya-vis-aquarium',
        artwork: ref('artwork-hist-vis-aquarium-frankrijk'),
        copyNumber: '1/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
    ],
  },

  // ── G&T's — George ───────────────────────────────────────────────────────
  {
    _id: 'contact-hist-george-gt',
    _type: 'contact',
    firstName: 'George',
    lastName: "G&T's",
    email: 'george-gt@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Buyer via Walls gallery. Part of "G&T\'s". Placeholder email.',
    purchases: [
      {
        _key: 'p-george-burger-bullet',
        artwork: ref('artwork-hist-burger-bullet'),
        copyNumber: '1/10+2AP',
        soldVia: 'gallery',
        date: '2012-11-01',
        price: 400,
      },
    ],
  },

  // ── Sanne Verlaan ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-sanne-verlaan',
    _type: 'contact',
    firstName: 'Sanne',
    lastName: 'Verlaan',
    email: 'sanne-verlaan@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Received Burger bullet as gift. Placeholder email.',
    purchases: [
      {
        _key: 'p-sanne-burger-bullet',
        artwork: ref('artwork-hist-burger-bullet'),
        copyNumber: '2/10+2AP',
        soldVia: 'direct',
        date: '2012-12-01',
        // gift — no price
      },
    ],
  },

  // ── Sabina Toet ──────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-sabina-toet',
    _type: 'contact',
    firstName: 'Sabina',
    lastName: 'Toet',
    email: 'sabina-toet@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Received Magic World as gift. Placeholder email.',
    purchases: [
      {
        _key: 'p-sabina-magic-world',
        artwork: ref('artwork-hist-magic-world'),
        copyNumber: '1/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
    ],
  },

  // ── Merijn Kavelaars ─────────────────────────────────────────────────────
  {
    _id: 'contact-hist-merijn-kavelaars',
    _type: 'contact',
    firstName: 'Merijn',
    lastName: 'Kavelaars',
    email: 'merijn-kavelaars@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Received Magic World (dibond, 60x90) as gift. Placeholder email.',
    purchases: [
      {
        _key: 'p-merijn-magic-world',
        artwork: ref('artwork-hist-magic-world'),
        copyNumber: '2/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
    ],
  },

  // ── Men at work (company) ─────────────────────────────────────────────────
  {
    _id: 'contact-hist-men-at-work',
    _type: 'contact',
    firstName: 'Men at work',
    email: 'men-at-work@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Company. Bought Eye of the tiger via Walls gallery. Placeholder email.',
    purchases: [
      {
        _key: 'p-menatwork-eye-of-the-tiger',
        artwork: ref('artwork-hist-eye-of-the-tiger'),
        copyNumber: '1/10+2AP',
        soldVia: 'gallery',
        date: '2012-10-01',
        price: 900,
      },
    ],
  },

  // ── AAF beurs customer (anonymous) ───────────────────────────────────────
  {
    _id: 'contact-hist-aaf-customer',
    _type: 'contact',
    firstName: 'AAF customer',
    email: 'aaf-customer@placeholder.art',
    type: 'collector',
    notes: 'Anonymous Art & Antique Fair buyer via Walls gallery. Real identity unknown.',
    purchases: [
      {
        _key: 'p-aaf-holy-dress',
        artwork: ref('artwork-hist-holy-dress'),
        copyNumber: '1/10+2AP',
        soldVia: 'artfair',
        price: 200,
        // date unknown
      },
    ],
  },

  // ── Marloes van Vugt ─────────────────────────────────────────────────────
  {
    _id: 'contact-hist-marloes-van-vugt',
    _type: 'contact',
    firstName: 'Marloes',
    lastName: 'van Vugt',
    email: 'marloes-van-vugt@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Received Meisje achter blak USA as gift. Placeholder email.',
    purchases: [
      {
        _key: 'p-marloes-meisje-achter-blak',
        artwork: ref('artwork-hist-meisje-achter-blak-usa'),
        copyNumber: '1/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
    ],
  },

  // ── Laura Smeekes ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-laura-smeekes',
    _type: 'contact',
    firstName: 'Laura',
    lastName: 'Smeekes',
    email: 'laura-smeekes@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Received Laura naaktop bank as gift. Placeholder email.',
    purchases: [
      {
        _key: 'p-laura-laura-naaktop-bank',
        artwork: ref('artwork-hist-laura-naaktop-bank'),
        copyNumber: '1/10+2AP',
        soldVia: 'direct',
        // gift — no price
      },
    ],
  },

  // ── Isabel Nollen ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-isabel-nollen',
    _type: 'contact',
    firstName: 'Isabel',
    lastName: 'Nollen',
    email: 'isabel-nollen@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Received Air gitar (Isabel) — artist proof. Placeholder email.',
    purchases: [
      {
        _key: 'p-isabel-air-gitar',
        artwork: ref('artwork-hist-air-gitar-isabel'),
        copyNumber: '1/1P',
        soldVia: 'direct',
        // no price recorded
      },
    ],
  },

  // ── Majke Hüsstege ───────────────────────────────────────────────────────
  {
    _id: 'contact-hist-majke-husstege',
    _type: 'contact',
    firstName: 'Majke',
    lastName: 'Hüsstege',
    email: 'majke-husstege@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Bought multiple Sharky editions and The Fox. Placeholder email.',
    purchases: [
      {
        _key: 'p-majke-sharky-1',
        artwork: ref('artwork-hist-sharky'),
        copyNumber: '2/10+2AP', // TODO: verify copy numbers from Sharky spreadsheet
        soldVia: 'direct',
        // date + price unknown — from Sharky spreadsheet
      },
      {
        _key: 'p-majke-sharky-2',
        artwork: ref('artwork-hist-sharky'),
        copyNumber: '3/10+2AP', // TODO: verify copy numbers from Sharky spreadsheet
        soldVia: 'direct',
        // date + price unknown
      },
      {
        _key: 'p-majke-the-fox',
        artwork: ref('artwork-hist-the-fox'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'direct',
        // date + price unknown
      },
    ],
  },

  // ── Branko van Kooten ─────────────────────────────────────────────────────
  {
    _id: 'contact-hist-branko-van-kooten',
    _type: 'contact',
    firstName: 'Branko',
    lastName: 'van Kooten',
    email: 'branko-van-kooten@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Placeholder email. The Beast was a trade (ruil).',
    purchases: [
      {
        _key: 'p-branko-the-beast',
        artwork: ref('artwork-hist-the-beast'),
        copyNumber: '1/5+2AP',
        soldVia: 'other',
        price: 0,
        // note: trade/ruil — no cash exchanged
        // date unknown
      },
      {
        _key: 'p-branko-cheeky-bum',
        artwork: ref('artwork-hist-cheeky-bum'),
        copyNumber: '1/5+2AP', // TODO: verify from Cheeky Bum spreadsheet
        soldVia: 'direct',
        // date + price unknown
      },
    ],
  },

  // ── Emma Ruimschotel ─────────────────────────────────────────────────────
  {
    _id: 'contact-hist-emma-ruimschotel',
    _type: 'contact',
    firstName: 'Emma',
    lastName: 'Ruimschotel',
    email: 'emma-ruimschotel@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Bought Employee of the Month via This Art Fair. Placeholder email.',
    purchases: [
      {
        _key: 'p-emma-employee-of-the-month',
        artwork: ref('artwork-hist-employee-of-the-month'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'artfair',
        // date + price unknown — "This art fair" note
      },
    ],
  },

  // ── Bruno (Hotel Not Hotel) ───────────────────────────────────────────────
  {
    _id: 'contact-hist-bruno-hnh',
    _type: 'contact',
    firstName: 'Bruno',
    email: 'bruno-hnh@placeholder.art',
    company: 'Hotel Not Hotel',
    type: 'collector',
    country: 'NL',
    notes: 'Contact at Hotel Not Hotel (HnH). Bought I\'ll show you mine. Placeholder email.',
    purchases: [
      {
        _key: 'p-bruno-ill-show-you-mine',
        artwork: ref('artwork-hist-ill-show-you-mine'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'gallery',
        // date + price unknown
      },
    ],
  },

  // ── Kristian Hornsleth (Strayfield Gallery) ───────────────────────────────
  {
    _id: 'contact-hist-kristian-hornsleth',
    _type: 'contact',
    firstName: 'Kristian',
    lastName: 'Hornsleth',
    email: 'kristian-hornsleth@placeholder.art',
    company: 'Strayfield Gallery',
    type: 'gallery',
    country: 'DK',
    notes: 'Owner of Strayfield Gallery, Hellerup, Denmark. Bought many works. Placeholder email.',
    purchases: [
      {
        _key: 'p-kristian-foodporn',
        artwork: ref('artwork-hist-foodporn'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'gallery',
        // date + price unknown
      },
      {
        _key: 'p-kristian-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '5',  // copy 5/30 (gift — from Lady of the manor spreadsheet)
        soldVia: 'direct',
        // gift — no price
      },
      // TODO: #foodporn (Strayfield), and any other works sold via/to Kristian
      // NOTE: The 14 Social Media Project works sold to Strayfield 04-2020 are
      //       recorded on contact-hist-strayfield-gallery below
    ],
  },

  // ── Strayfield Gallery (bulk buyer, April 2020) ───────────────────────────
  {
    _id: 'contact-hist-strayfield-gallery',
    _type: 'contact',
    firstName: 'Strayfield Gallery',
    email: 'strayfield-gallery@placeholder.art',
    company: 'Strayfield Gallery',
    type: 'gallery',
    country: 'DK',
    notes: 'Gallery in Hellerup, Denmark. Bulk purchase of 14 Social Media Project works in April 2020 (copy 1 each). Placeholder email.',
    purchases: [
      {
        _key: 'p-strayfield-girl-in-red',
        artwork: ref('artwork-hist-girl-in-red'),
        copyNumber: '1/5+2AP',
        soldVia: 'gallery',
        date: '2020-04-01',
        // price unknown — TODO
      },
      // TODO: Add 13 more Social Media Project works here once titles are known
    ],
  },

  // ── Josilda da Conceição Gallery ─────────────────────────────────────────
  {
    _id: 'contact-hist-josilda-da-conceicao',
    _type: 'contact',
    firstName: 'Josilda da Conceição Gallery',
    email: 'josilda-da-conceicao@placeholder.art',
    company: 'Josilda da Conceição Gallery',
    type: 'gallery',
    country: 'NL',
    notes: 'Amsterdam gallery. Bought Sharky 3D. Placeholder email.',
    purchases: [
      {
        _key: 'p-josilda-sharky-3d',
        artwork: ref('artwork-hist-sharky-3d'),
        copyNumber: '1/3+2AP', // TODO: verify edition size / copy number
        soldVia: 'gallery',
        // date + price unknown
      },
    ],
  },

  // ── Hotel Not Hotel (Cars 'n Heels) ──────────────────────────────────────
  {
    _id: 'contact-hist-hotel-not-hotel',
    _type: 'contact',
    firstName: 'Hotel Not Hotel',
    email: 'hotel-not-hotel@placeholder.art',
    company: 'Hotel Not Hotel',
    type: 'gallery',
    country: 'NL',
    notes: 'Amsterdam hotel / gallery. Bought Cars \'n Heels. Placeholder email.',
    purchases: [
      {
        _key: 'p-hnh-cars-n-heels',
        artwork: ref('artwork-hist-cars-n-heels'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'gallery',
        // date + price unknown
      },
    ],
  },

  // ── Pim (Brix) ───────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-pim-brix',
    _type: 'contact',
    firstName: 'Pim',
    email: 'pim-brix@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Buyer via Brix gallery. Also in Sharky spreadsheet. Placeholder email.',
    purchases: [
      {
        _key: 'p-pim-hall-pass',
        artwork: ref('artwork-hist-hall-pass'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'gallery',
        // date + price unknown
      },
      // TODO: Sharky copy via Brix
    ],
  },

  // ── Brix customer (anonymous) ────────────────────────────────────────────
  {
    _id: 'contact-hist-brix-customer',
    _type: 'contact',
    firstName: 'Brix customer',
    email: 'brix-customer@placeholder.art',
    type: 'collector',
    notes: 'Anonymous customer via Brix gallery (Hall Pass). Real identity unknown.',
    purchases: [
      {
        _key: 'p-brixcust-hall-pass',
        artwork: ref('artwork-hist-hall-pass'),
        copyNumber: '2/5+2AP', // TODO: verify
        soldVia: 'gallery',
        // date + price unknown
      },
    ],
  },

  // ── Jody (Chocolate Puma) ─────────────────────────────────────────────────
  {
    _id: 'contact-hist-jody',
    _type: 'contact',
    firstName: 'Jody',
    email: 'jody@placeholder.art',
    type: 'collector',
    notes: 'Received Chocolate Puma — no date or price recorded. Placeholder email.',
    purchases: [
      {
        _key: 'p-jody-chocolate-puma',
        artwork: ref('artwork-hist-chocolate-puma'),
        copyNumber: '1/5+2AP', // TODO: verify
        soldVia: 'direct',
        // gift or no payment recorded
      },
    ],
  },

  // ── Marjolein Berghs-Hendrix ──────────────────────────────────────────────
  {
    _id: 'contact-hist-marjolein-berghs-hendrix',
    _type: 'contact',
    firstName: 'Marjolein',
    lastName: 'Berghs-Hendrix',
    email: 'marjolein-berghs-hendrix@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Day at the museum (row 4). May be same person as "Marjolein Hendrix" in Sharky spreadsheet. Placeholder email.',
    purchases: [
      {
        _key: 'p-marjolein-day-at-museum',
        artwork: ref('artwork-hist-day-at-the-museum'),
        copyNumber: '4', // copy 4/30
        soldVia: 'direct',
        // date + price unknown
      },
      // TODO: Sharky copy — verify if same person as Marjolein Hendrix
    ],
  },

  // ── Fleur Souverein ──────────────────────────────────────────────────────
  {
    _id: 'contact-hist-fleur-souverein',
    _type: 'contact',
    firstName: 'Fleur',
    lastName: 'Souverein',
    email: 'fleur-souverein@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Bought Lady of the manor (copy 5/30). Placeholder email.',
    purchases: [
      {
        _key: 'p-fleur-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '5',
        soldVia: 'direct',
        // date + price unknown
      },
    ],
  },

  // ── NVCS Konigs ──────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-nvcs-konigs',
    _type: 'contact',
    firstName: 'NVCS Konigs',
    email: 'nvcs-konigs@placeholder.art',
    type: 'collector',
    notes: 'Company name only — no further details. Bought Lady of the manor or Horsing Around. Placeholder email.',
    purchases: [
      {
        _key: 'p-nvcs-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '7', // TODO: verify copy number from spreadsheet
        soldVia: 'direct',
      },
    ],
  },

  // ── Lavinia ───────────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-lavinia',
    _type: 'contact',
    firstName: 'Lavinia',
    email: 'lavinia@placeholder.art',
    type: 'collector',
    notes: 'First name only. Bought Lady of the manor or Horsing Around. Placeholder email.',
    purchases: [
      {
        _key: 'p-lavinia-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '13', // TODO: verify copy number from spreadsheet
        soldVia: 'direct',
      },
    ],
  },

  // ── Red Cross (auction donation) ─────────────────────────────────────────
  {
    _id: 'contact-hist-red-cross-veiling',
    _type: 'contact',
    firstName: 'Red Cross',
    email: 'red-cross-veiling@placeholder.art',
    type: 'other',
    notes: 'Donation for Red Cross charity auction (Rode Kruis veiling). Lady of the manor. No price.',
    purchases: [
      {
        _key: 'p-redcross-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '1', // TODO: verify
        soldVia: 'other',
        // gift/donation — no price
      },
    ],
  },

  // ── Patty Morgan ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-patty-morgan',
    _type: 'contact',
    firstName: 'Patty',
    lastName: 'Morgan',
    email: 'patty-morgan@placeholder.art',
    type: 'collector',
    notes: 'Listed as seller/kassier in Day at the museum spreadsheet (row 10). Unclear if buyer or intermediary. Placeholder email.',
    purchases: [
      // TODO: verify — row 10 had no named buyer; Patty may be internal notation
    ],
  },

  // ── Fransie ──────────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-fransie',
    _type: 'contact',
    firstName: 'Fransie',
    email: 'fransie@placeholder.art',
    type: 'collector',
    notes: 'First name only. Appeared in Strayfield batch (Social Media Project, April 2020). Placeholder email.',
    purchases: [
      // TODO: which Social Media Project work(s)?
    ],
  },

  // ── Natalia Goncharova ───────────────────────────────────────────────────
  {
    _id: 'contact-hist-natalia-goncharova',
    _type: 'contact',
    firstName: 'Natalia',
    lastName: 'Goncharova',
    email: 'natalia-goncharova@placeholder.art',
    type: 'collector',
    notes: 'Appeared in Strayfield batch (Social Media Project, April 2020). Placeholder email.',
    purchases: [
      // TODO: which Social Media Project work(s)?
    ],
  },

]

// ── Runner ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${artworks.length} artworks and ${contacts.length} contacts...`)

  // Upsert artworks
  let artOk = 0, artFail = 0
  for (const artwork of artworks) {
    try {
      await client.createOrReplace(artwork)
      artOk++
      process.stdout.write('.')
    } catch (err) {
      console.error(`\n✗ artwork ${artwork._id}: ${err.message}`)
      artFail++
    }
  }
  console.log(`\nArtworks: ${artOk} OK, ${artFail} failed`)

  // Upsert contacts
  let conOk = 0, conFail = 0
  for (const contact of contacts) {
    try {
      await client.createOrReplace(contact)
      conOk++
      process.stdout.write('.')
    } catch (err) {
      console.error(`\n✗ contact ${contact._id}: ${err.message}`)
      conFail++
    }
  }
  console.log(`\nContacts: ${conOk} OK, ${conFail} failed`)

  console.log('\nDone! Check Studio to verify data.')
  console.log('TODO items to complete manually:')
  console.log('  - 13 more Social Media Project / Strayfield works (April 2020 bulk deal)')
  console.log('  - Sharky spreadsheet: all copy numbers, dates, prices, remaining buyers')
  console.log('  - Cheeky Bum: 3 more buyers (dates, prices)')
  console.log('  - Cars n Heels: Anneke + 1 unknown buyer')
  console.log('  - Hall Pass: 3rd buyer + dates/prices')
  console.log('  - The Maestro: 2 buyers')
  console.log('  - Day at the museum: 13 more buyers (edition 30)')
  console.log('  - Smoking Bunny: 3 buyers')
  console.log('  - Horsing Around: buyers + copy numbers')
  console.log('  - Batch 2 (Rabbit hole, Kont Eva, Connect the dots, The jungle): purchase records')
  console.log('  - Chocolate Puma: 2nd buyer')
  console.log('  - LA Squeeze: father (Vader Dekker) + Anneke + 3rd buyer if any')
  console.log('  - All edition-5 works sold to Strayfield: prices')
  console.log('  - Breakfast Club: 5 buyers (COA SD.2023.1-5)')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
