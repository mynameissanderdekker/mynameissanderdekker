/**
 * patch-historical-sales-v2.mjs
 * Comprehensive patch based on full CSV comparison.
 *
 * Fixes:
 *  - Wrong artwork attributions in existing contacts
 *  - Adds ~22 missing artwork documents
 *  - Adds ~50 missing/new contacts with correct purchases
 *
 * Safe to re-run (idempotent — createOrReplace for hist contacts, createIfNotExists for new ones).
 * Run: node scripts/patch-historical-sales-v2.mjs
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

const DIBOND  = 'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond and plexiglass'
const CPRINT  = 'C-print'
const CPRINT_PLEXI = 'C-print / plexi / frame'
const CPRINT_PASSE = 'C-print / passe-partout / white frame'

function ref(id) { return { _type: 'reference', _ref: id } }

// ─────────────────────────────────────────────────────────────────────────────
// PART 1: NEW ARTWORKS (createOrReplace)
// ─────────────────────────────────────────────────────────────────────────────

const newArtworks = [

  // Disco Balls (Editie 10) — was missing from seed script
  {
    _id: 'artwork-hist-disco-balls',
    _type: 'artwork',
    title: 'Disco Balls',
    slug: { _type: 'slug', current: 'disco-balls' },
    year: 2012,
    medium: CPRINT,
    dimensions: { widthCm: 80, heightCm: 60 },
  },

  // NYC Rooftop (Editie 10) — may already exist via add-nyc-rooftop.mjs
  {
    _id: 'artwork-hist-nyc-rooftop',
    _type: 'artwork',
    title: 'NYC rooftop',
    slug: { _type: 'slug', current: 'nyc-rooftop' },
    year: 2012,
    medium: DIBOND,
    dimensions: { widthCm: 90, heightCm: 60 },
  },

  // ── Social Media Project (Editie 5, ~2019, mostly sold Strayfield 04-2020) ──
  {
    _id: 'artwork-hist-kaliexpress',
    _type: 'artwork',
    title: 'KÂLIEXPRESS',
    slug: { _type: 'slug', current: 'kaliexpress' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-its-a-wrap',
    _type: 'artwork',
    title: "IT'S A WRAP",
    slug: { _type: 'slug', current: 'its-a-wrap' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-im-just-creating',
    _type: 'artwork',
    title: "I'M JUST CREATING",
    slug: { _type: 'slug', current: 'im-just-creating' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-new-found-freedom',
    _type: 'artwork',
    title: 'NEW FOUND FREEDOM',
    slug: { _type: 'slug', current: 'new-found-freedom' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-iris-skywalker',
    _type: 'artwork',
    title: 'IRIS SKYWALKER',
    slug: { _type: 'slug', current: 'iris-skywalker' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-a-pattern-of-madness',
    _type: 'artwork',
    title: 'A PATTERN OF MADNESS',
    slug: { _type: 'slug', current: 'a-pattern-of-madness' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-we-are-all-of-us-stars',
    _type: 'artwork',
    title: 'WE ARE ALL OF US STARS',
    slug: { _type: 'slug', current: 'we-are-all-of-us-stars' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-composition-in-blue',
    _type: 'artwork',
    title: 'COMPOSITION IN BLUE',
    slug: { _type: 'slug', current: 'composition-in-blue' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-activate-your-beast-mode',
    _type: 'artwork',
    title: 'ACTIVATE YOUR BEAST MODE',
    slug: { _type: 'slug', current: 'activate-your-beast-mode' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-when-offline',
    _type: 'artwork',
    title: 'WHEN OFFLINE',
    slug: { _type: 'slug', current: 'when-offline' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-lean-and-mean',
    _type: 'artwork',
    title: 'LEAN-AND-MEAN',
    slug: { _type: 'slug', current: 'lean-and-mean' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-lad-os-danse-pa-roser',
    _type: 'artwork',
    title: 'LAD OS DANSE PÅ ROSER',
    slug: { _type: 'slug', current: 'lad-os-danse-pa-roser' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-world-peace',
    _type: 'artwork',
    title: 'WORLD PEACE',
    slug: { _type: 'slug', current: 'world-peace' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-next-generation-of-changemakers',
    _type: 'artwork',
    title: 'Next Generation of Changemakers',
    slug: { _type: 'slug', current: 'next-generation-of-changemakers' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-we-are-all-made-of-stardust',
    _type: 'artwork',
    title: 'WE ARE ALL MADE OF STARDUST',
    slug: { _type: 'slug', current: 'we-are-all-made-of-stardust' },
    year: 2019,
    medium: CPRINT_PLEXI,
  },

  // ── Torch Gallery era (Editie 7, 2020–2024) ──────────────────────────────
  {
    _id: 'artwork-hist-anastasia',
    _type: 'artwork',
    title: 'Anastasia',
    slug: { _type: 'slug', current: 'anastasia' },
    year: 2020,
    medium: CPRINT_PLEXI,
  },
  {
    _id: 'artwork-hist-speedy-harmony',
    _type: 'artwork',
    title: 'SPEEDY HARMONY',
    slug: { _type: 'slug', current: 'speedy-harmony' },
    year: 2020,
    medium: CPRINT,
  },
  {
    _id: 'artwork-hist-got-no-time-for-that-shit',
    _type: 'artwork',
    title: 'GOT NO TIME FOR THAT SHIT!',
    slug: { _type: 'slug', current: 'got-no-time-for-that-shit' },
    year: 2021,
    medium: CPRINT_PASSE,
  },
  {
    _id: 'artwork-hist-nimby',
    _type: 'artwork',
    title: 'NIMBY',
    slug: { _type: 'slug', current: 'nimby' },
    year: 2021,
    medium: CPRINT_PASSE,
  },
  {
    _id: 'artwork-hist-horticulture-ii',
    _type: 'artwork',
    title: 'Horticulture II',
    slug: { _type: 'slug', current: 'horticulture-ii' },
    year: 2022,
    medium: CPRINT_PASSE,
  },
  {
    _id: 'artwork-hist-crustacean-ballet',
    _type: 'artwork',
    title: 'Crustacean Ballet',
    slug: { _type: 'slug', current: 'crustacean-ballet' },
    year: 2023,
    medium: CPRINT_PASSE,
  },
  {
    _id: 'artwork-hist-embrace-your-freedom',
    _type: 'artwork',
    title: 'EMBRACE YOUR FREEDOM',
    slug: { _type: 'slug', current: 'embrace-your-freedom' },
    year: 2024,
    medium: 'mounted on dibond, plexiglass and aluminum frame',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PART 2: FIX EXISTING CONTACTS (createOrReplace — replaces seed script data)
// ─────────────────────────────────────────────────────────────────────────────

const fixedContacts = [

  // ── Men at work — also bought NYC Rooftop Ed 1 ────────────────────────────
  {
    _id: 'contact-hist-men-at-work',
    _type: 'contact',
    firstName: 'Men at work',
    email: 'men-at-work@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Company. Bought Eye of the tiger AND NYC Rooftop via Walls gallery (both 10-2012). Placeholder email.',
    purchases: [
      {
        _key: 'p-menatwork-eye-of-the-tiger',
        artwork: ref('artwork-hist-eye-of-the-tiger'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2012-10-01',
        price: 900,
      },
      {
        _key: 'p-menatwork-nyc-rooftop',
        artwork: ref('artwork-hist-nyc-rooftop'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2012-10-01',
        price: 900,
      },
    ],
  },

  // ── G&T's George — Disco Balls Ed 1 (NOT Burger Bullet) ──────────────────
  {
    _id: 'contact-hist-george-gt',
    _type: 'contact',
    firstName: 'George',
    lastName: "G&T's",
    email: 'george-gt@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Buyer via Walls gallery. Part of "G&T\'s". Bought Disco Balls (not Burger Bullet — that was Tanya). Placeholder email.',
    purchases: [
      {
        _key: 'p-george-disco-balls',
        artwork: ref('artwork-hist-disco-balls'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2012-11-01',
        price: 400,
      },
    ],
  },

  // ── Anneke Dekker — add Cars n Heels Ed 1 ────────────────────────────────
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
        copyNumber: '1',
        soldVia: 'direct',
      },
      {
        _key: 'p-anneke-magic-world',
        artwork: ref('artwork-hist-magic-world'),
        copyNumber: '2',
        soldVia: 'direct',
      },
      {
        _key: 'p-anneke-vis-aquarium',
        artwork: ref('artwork-hist-vis-aquarium-frankrijk'),
        copyNumber: '1',
        soldVia: 'direct',
      },
      {
        _key: 'p-anneke-cars-n-heels',
        artwork: ref('artwork-hist-cars-n-heels'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2013-11-21',
        price: 900,
      },
    ],
  },

  // ── Majke Hüsstege — add Rabbit Hole Ed 1, fix dates ─────────────────────
  {
    _id: 'contact-hist-majke-husstege',
    _type: 'contact',
    firstName: 'Majke',
    lastName: 'Hüsstege',
    email: 'majke-husstege@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Bought Sharky x2, The Fox, Rabbit Hole. Placeholder email.',
    purchases: [
      {
        _key: 'p-majke-rabbit-hole',
        artwork: ref('artwork-hist-rabbit-hole'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2013-02-01',
        price: 250,
      },
      {
        _key: 'p-majke-sharky-2',
        artwork: ref('artwork-hist-sharky'),
        copyNumber: '2',
        soldVia: 'direct',
        date: '2013-01-26',
        price: 2000,
      },
      {
        _key: 'p-majke-sharky-3',
        artwork: ref('artwork-hist-sharky'),
        copyNumber: '3',
        soldVia: 'direct',
        date: '2013-01-29',
        price: 2000,
      },
      {
        _key: 'p-majke-the-fox',
        artwork: ref('artwork-hist-the-fox'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2014-01-25',
        price: 1000,
      },
    ],
  },

  // ── Branko van Kooten — Beast Ed 2 (not Ed 1!), Cheeky Bum Ed 1 ──────────
  {
    _id: 'contact-hist-branko-van-kooten',
    _type: 'contact',
    firstName: 'Branko',
    lastName: 'van Kooten',
    email: 'branko-van-kooten@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'The Beast Ed 2 (paid €1.400), Cheeky Bum Ed 1. Placeholder email.',
    purchases: [
      {
        _key: 'p-branko-cheeky-bum',
        artwork: ref('artwork-hist-cheeky-bum'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2014-03-25',
        price: 2250,
      },
      {
        _key: 'p-branko-the-beast',
        artwork: ref('artwork-hist-the-beast'),
        copyNumber: '2',
        soldVia: 'gallery',
        date: '2015-03-08',
        price: 1400,
      },
    ],
  },

  // ── Kristian Hornsleth — personal buyer (Venetian, Horticulture, Lady gift)
  // NOTE: He was the Strayfield AGENT for #foodporn — not the buyer.
  {
    _id: 'contact-hist-kristian-hornsleth',
    _type: 'contact',
    firstName: 'Kristian',
    lastName: 'Hornsleth',
    email: 'kristian-hornsleth@placeholder.art',
    company: 'Strayfield Gallery',
    type: 'gallery',
    country: 'DK',
    notes: 'Owner of Strayfield Gallery, Hellerup, Denmark. Personal purchases listed here; bulk Strayfield purchases on contact-hist-strayfield-gallery. Placeholder email.',
    purchases: [
      {
        _key: 'p-kristian-venetian-triptych',
        artwork: ref('artwork-hist-venetian-triptych'),
        copyNumber: '2',
        soldVia: 'direct',
        date: '2019-02-01',
        price: 950,
      },
      {
        _key: 'p-kristian-horticulture',
        artwork: ref('artwork-hist-horticulture'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2019-02-01',
        price: 960,
      },
      {
        _key: 'p-kristian-lady-of-the-manor-gift',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '5',
        soldVia: 'direct',
        date: '2019-11-01',
        // gift — no price
      },
    ],
  },

  // ── Strayfield Gallery — ALL bulk purchases ───────────────────────────────
  {
    _id: 'contact-hist-strayfield-gallery',
    _type: 'contact',
    firstName: 'Strayfield Gallery',
    email: 'strayfield-gallery@placeholder.art',
    company: 'Strayfield Gallery',
    type: 'gallery',
    country: 'DK',
    notes: 'Gallery in Hellerup, Denmark. Large purchase April 2020 (Social Media Project + other works). Also Sharky 3D Ed 2 (03-2020) and #foodporn Ed 2+3 (via Kristian). Placeholder email.',
    purchases: [
      // Pre-April 2020
      { _key: 'p-strayfield-employee-3',    artwork: ref('artwork-hist-employee-of-the-month'), copyNumber: '3', soldVia: 'gallery', date: '2020-03-01' },
      { _key: 'p-strayfield-sharky3d-2',    artwork: ref('artwork-hist-sharky-3d'),            copyNumber: '2', soldVia: 'gallery', date: '2020-03-01' },
      // April 2020 bulk
      { _key: 'p-strayfield-girl-in-red',   artwork: ref('artwork-hist-girl-in-red'),           copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-sharky-10',     artwork: ref('artwork-hist-sharky'),                copyNumber: '10', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-employee-4',    artwork: ref('artwork-hist-employee-of-the-month'), copyNumber: '4', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-cars-n-heels-3',artwork: ref('artwork-hist-cars-n-heels'),          copyNumber: '3', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-i-spy-3',       artwork: ref('artwork-hist-i-spy-with-my-little-eye'), copyNumber: '3', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-venetian-3',    artwork: ref('artwork-hist-venetian-triptych'),     copyNumber: '3', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-horticulture-2',artwork: ref('artwork-hist-horticulture'),          copyNumber: '2', soldVia: 'gallery', date: '2020-04-01' },
      // Social Media Project (all Ed 1, April 2020)
      { _key: 'p-strayfield-kaliexpress',            artwork: ref('artwork-hist-kaliexpress'),                    copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-its-a-wrap',             artwork: ref('artwork-hist-its-a-wrap'),                     copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-im-just-creating',       artwork: ref('artwork-hist-im-just-creating'),               copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-new-found-freedom',      artwork: ref('artwork-hist-new-found-freedom'),              copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-iris-skywalker',         artwork: ref('artwork-hist-iris-skywalker'),                 copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-a-pattern-of-madness',   artwork: ref('artwork-hist-a-pattern-of-madness'),           copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-we-are-all-of-us-stars', artwork: ref('artwork-hist-we-are-all-of-us-stars'),         copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-composition-in-blue',    artwork: ref('artwork-hist-composition-in-blue'),            copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-activate-beast-mode',    artwork: ref('artwork-hist-activate-your-beast-mode'),       copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-when-offline',           artwork: ref('artwork-hist-when-offline'),                   copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-lean-and-mean',          artwork: ref('artwork-hist-lean-and-mean'),                  copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-lad-os-danse',           artwork: ref('artwork-hist-lad-os-danse-pa-roser'),          copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-world-peace',            artwork: ref('artwork-hist-world-peace'),                    copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-next-generation',        artwork: ref('artwork-hist-next-generation-of-changemakers'),copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-we-are-all-stardust',    artwork: ref('artwork-hist-we-are-all-made-of-stardust'),    copyNumber: '1', soldVia: 'gallery', date: '2020-04-01' },
      // Post April 2020
      { _key: 'p-strayfield-foodporn-2',   artwork: ref('artwork-hist-foodporn'),               copyNumber: '2', soldVia: 'gallery', date: '2020-04-01' },
      { _key: 'p-strayfield-foodporn-3',   artwork: ref('artwork-hist-foodporn'),               copyNumber: '3', soldVia: 'gallery', date: '2021-05-01' },
    ],
  },

  // ── NVCS Konigs — Horsing Around Ed 1 (NOT Lady of manor) ────────────────
  {
    _id: 'contact-hist-nvcs-konigs',
    _type: 'contact',
    firstName: 'NVCS Konigs',
    email: 'nvcs-konigs@placeholder.art',
    type: 'collector',
    notes: 'Company. Bought Horsing Around Ed 1 (not Lady of manor — previous seed script error). Placeholder email.',
    purchases: [
      {
        _key: 'p-nvcs-horsing-around',
        artwork: ref('artwork-hist-horsing-around'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2019-11-01',
      },
    ],
  },

  // ── Lavinia — Horsing Around Ed 13 (NOT Lady of manor) ───────────────────
  {
    _id: 'contact-hist-lavinia',
    _type: 'contact',
    firstName: 'Lavinia',
    email: 'lavinia@placeholder.art',
    type: 'collector',
    notes: 'First name only. Bought Horsing Around Ed 13 (not Lady of manor — previous seed script error). Placeholder email.',
    purchases: [
      {
        _key: 'p-lavinia-horsing-around',
        artwork: ref('artwork-hist-horsing-around'),
        copyNumber: '13',
        soldVia: 'direct',
        date: '2020-06-01',
      },
    ],
  },

  // ── Red Cross — Lady of manor Ed 14 + Horsing Around Ed 12 ──────────────
  {
    _id: 'contact-hist-red-cross-veiling',
    _type: 'contact',
    firstName: 'Red Cross',
    email: 'red-cross-veiling@placeholder.art',
    type: 'other',
    notes: 'Donations for Red Cross charity auction. Lady of manor Ed 14, Horsing Around Ed 12.',
    purchases: [
      {
        _key: 'p-redcross-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '14',
        soldVia: 'other',
      },
      {
        _key: 'p-redcross-horsing-around',
        artwork: ref('artwork-hist-horsing-around'),
        copyNumber: '12',
        soldVia: 'other',
      },
    ],
  },

  // ── Pim / Brix — Hall Pass Ed 3 (not Ed 1!), + Sharky Ed 6 ──────────────
  {
    _id: 'contact-hist-pim-brix',
    _type: 'contact',
    firstName: 'Pim',
    email: 'pim-brix@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Buyer via Brix/Bright Side gallery. Hall Pass Ed 3, Sharky Ed 6. Placeholder email.',
    purchases: [
      {
        _key: 'p-pim-sharky-6',
        artwork: ref('artwork-hist-sharky'),
        copyNumber: '6',
        soldVia: 'gallery',
        price: 2400,
      },
      {
        _key: 'p-pim-hall-pass-3',
        artwork: ref('artwork-hist-hall-pass'),
        copyNumber: '3',
        soldVia: 'gallery',
        date: '2016-02-11',
      },
    ],
  },

  // ── Brix customer (anonymous) — Hall Pass Ed 1 + Ed 2 ────────────────────
  {
    _id: 'contact-hist-brix-customer',
    _type: 'contact',
    firstName: 'Brix customer',
    email: 'brix-customer@placeholder.art',
    type: 'collector',
    notes: 'Anonymous customer(s) via Brix gallery (Hall Pass Ed 1 + Ed 2). May be two different people.',
    purchases: [
      {
        _key: 'p-brixcust-hall-pass-1',
        artwork: ref('artwork-hist-hall-pass'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2014-09-05',
        price: 1000,
      },
      {
        _key: 'p-brixcust-hall-pass-2',
        artwork: ref('artwork-hist-hall-pass'),
        copyNumber: '2',
        soldVia: 'gallery',
        date: '2014-12-04',
        price: 1750,
      },
    ],
  },

  // ── Jody (Verver) — Chocolate Puma Ed 2 (not Ed 1!), Sorry we're dead Ed 1
  {
    _id: 'contact-hist-jody',
    _type: 'contact',
    firstName: 'Jody',
    lastName: 'Verver',
    email: 'jody-verver@placeholder.art',
    type: 'collector',
    notes: 'Chocolate Puma Ed 2 via Bright Side. Sorry we\'re dead Ed 1. Also: Day at museum Ed 9 buyer credited "via Jody Verver". Placeholder email.',
    purchases: [
      {
        _key: 'p-jody-chocolate-puma',
        artwork: ref('artwork-hist-chocolate-puma'),
        copyNumber: '2',
        soldVia: 'gallery',
      },
      {
        _key: 'p-jody-sorry-were-dead',
        artwork: ref('artwork-hist-sorry-were-dead'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2019-06-01',
      },
    ],
  },

  // ── Bruno (Hotel Not Hotel) — Out of the blue + Play with fire ───────────
  // NOTE: He did NOT buy I'll show you mine (previous seed script error)
  {
    _id: 'contact-hist-bruno-hnh',
    _type: 'contact',
    firstName: 'Bruno',
    email: 'bruno-hnh@placeholder.art',
    company: 'Hotel Not Hotel',
    type: 'collector',
    country: 'NL',
    notes: 'Contact at Hotel Not Hotel. Bought Out of the blue Ed 1 + Play with fire Ed 1 (Nov 2016). Did NOT buy I\'ll show you mine (previous error). Placeholder email.',
    purchases: [
      {
        _key: 'p-bruno-out-of-the-blue',
        artwork: ref('artwork-hist-out-of-the-blue'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2016-11-02',
      },
      {
        _key: 'p-bruno-play-with-fire',
        artwork: ref('artwork-hist-play-with-fire'),
        copyNumber: '1',
        soldVia: 'direct',
        date: '2016-11-02',
      },
    ],
  },

  // ── Hotel Not Hotel (institution) — many purchases 2018 ──────────────────
  {
    _id: 'contact-hist-hotel-not-hotel',
    _type: 'contact',
    firstName: 'Hotel Not Hotel',
    email: 'hotel-not-hotel@placeholder.art',
    company: 'Hotel Not Hotel',
    type: 'gallery',
    country: 'NL',
    notes: 'Amsterdam hotel/gallery. Multiple purchases 2018. Cars n Heels Ed 2 (not Ed 1 — previous error). I\'ll show you mine Ed 3 via "HnH vrouw" (anonymous). Placeholder email.',
    purchases: [
      {
        _key: 'p-hnh-the-beast-3',
        artwork: ref('artwork-hist-the-beast'),
        copyNumber: '3',
        soldVia: 'gallery',
        date: '2018-06-12',
      },
      {
        _key: 'p-hnh-la-squeeze-2',
        artwork: ref('artwork-hist-la-squeeze'),
        copyNumber: '2',
        soldVia: 'gallery',
        date: '2018-06-12',
      },
      {
        _key: 'p-hnh-the-oracle-2',
        artwork: ref('artwork-hist-the-oracle'),
        copyNumber: '2',
        soldVia: 'gallery',
        date: '2018-06-12',
      },
      {
        _key: 'p-hnh-villa-volta-1',
        artwork: ref('artwork-hist-villa-volta'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2018-06-12',
      },
      {
        _key: 'p-hnh-cars-n-heels-2',
        artwork: ref('artwork-hist-cars-n-heels'),
        copyNumber: '2',
        soldVia: 'direct',
        date: '2018-11-01',
      },
      {
        _key: 'p-hnh-ill-show-you-mine-3',
        artwork: ref('artwork-hist-ill-show-you-mine'),
        copyNumber: '3',
        soldVia: 'gallery',
        notes: 'Buyer was "HnH vrouw" — name unknown.',
      },
    ],
  },

  // ── Josilda da Conceição Gallery — dealer, not buyer of Sharky 3D ─────────
  {
    _id: 'contact-hist-josilda-da-conceicao',
    _type: 'contact',
    firstName: 'Josilda da Conceição Gallery',
    email: 'josilda-da-conceicao@placeholder.art',
    company: 'Josilda da Conceição Gallery',
    type: 'gallery',
    country: 'NL',
    notes: 'Amsterdam gallery. Sold Out of the blue + So Fashion to Guido de Bruyn (10-2017). Previous seed script incorrectly had Sharky 3D purchase — removed. Placeholder email.',
    purchases: [],
  },

  // ── Emma Ruimschotel — add Sharky 3D Ed 1 ────────────────────────────────
  {
    _id: 'contact-hist-emma-ruimschotel',
    _type: 'contact',
    firstName: 'Emma',
    lastName: 'Ruimschotel',
    email: 'emma-ruimschotel@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Bought Sharky 3D Ed 1 and Employee of the Month Ed 1 at This Art Fair (Dec 2015). Placeholder email.',
    purchases: [
      {
        _key: 'p-emma-sharky-3d',
        artwork: ref('artwork-hist-sharky-3d'),
        copyNumber: '1',
        soldVia: 'artfair',
        date: '2015-12-01',
        price: 1300,
      },
      {
        _key: 'p-emma-employee-of-the-month',
        artwork: ref('artwork-hist-employee-of-the-month'),
        copyNumber: '1',
        soldVia: 'artfair',
        date: '2015-12-01',
        price: 1300,
      },
    ],
  },

  // ── Marjolein Berghs-Hendrix — add Sharky Ed 8 ───────────────────────────
  {
    _id: 'contact-hist-marjolein-berghs-hendrix',
    _type: 'contact',
    firstName: 'Marjolein',
    lastName: 'Berghs-Hendrix',
    email: 'marjolein-berghs-hendrix@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Sharky Ed 8 (03-2016, via Bright Side) + Day at museum Ed 4 (11-2017). May be same as "Marjolein Hendrix" in Sharky sheet. Placeholder email.',
    purchases: [
      {
        _key: 'p-marjolein-sharky-8',
        artwork: ref('artwork-hist-sharky'),
        copyNumber: '8',
        soldVia: 'gallery',
        date: '2016-03-01',
        price: 2400,
      },
      {
        _key: 'p-marjolein-day-at-museum',
        artwork: ref('artwork-hist-day-at-the-museum'),
        copyNumber: '4',
        soldVia: 'direct',
        date: '2017-11-01',
        price: 240,
      },
    ],
  },

  // ── Fleur Souverein — add Lunar Lunacy Effect Ed 1 ───────────────────────
  {
    _id: 'contact-hist-fleur-souverein',
    _type: 'contact',
    firstName: 'Fleur',
    lastName: 'Souverein',
    email: 'fleur-souverein@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Lady of manor Ed 5 (09-2020) + Lunar Lunacy Effect Ed 1 via Torch (01-2022). Placeholder email.',
    purchases: [
      {
        _key: 'p-fleur-lady-of-the-manor',
        artwork: ref('artwork-hist-lady-of-the-manor'),
        copyNumber: '5',
        soldVia: 'direct',
        date: '2020-09-01',
      },
      {
        _key: 'p-fleur-lunar-lunacy',
        artwork: ref('artwork-hist-lunar-lunacy-effect'),
        copyNumber: '1',
        soldVia: 'gallery',
        date: '2022-01-01',
      },
    ],
  },

  // ── Fransie — add NEW FOUND FREEDOM Ed 2 ─────────────────────────────────
  {
    _id: 'contact-hist-fransie',
    _type: 'contact',
    firstName: 'Fransie',
    email: 'fransie@placeholder.art',
    type: 'collector',
    notes: 'First name only. NEW FOUND FREEDOM Ed 2 (11-2020, direct). Placeholder email.',
    purchases: [
      {
        _key: 'p-fransie-new-found-freedom',
        artwork: ref('artwork-hist-new-found-freedom'),
        copyNumber: '2',
        soldVia: 'direct',
        date: '2020-11-01',
      },
    ],
  },

  // ── Natalia Goncharova — add I'M JUST CREATING AP gift ───────────────────
  {
    _id: 'contact-hist-natalia-goncharova',
    _type: 'contact',
    firstName: 'Natalia',
    lastName: 'Goncharova',
    email: 'natalia-goncharova@placeholder.art',
    type: 'collector',
    notes: 'Received I\'M JUST CREATING as AP gift. Placeholder email.',
    purchases: [
      {
        _key: 'p-natalia-im-just-creating-ap',
        artwork: ref('artwork-hist-im-just-creating'),
        copyNumber: '1 AP',
        soldVia: 'direct',
      },
    ],
  },

  // ── Patty Morgan — Day at museum Ed 10 buyer ─────────────────────────────
  {
    _id: 'contact-hist-patty-morgan',
    _type: 'contact',
    firstName: 'Patty',
    lastName: 'Morgan',
    email: 'patty-morgan@placeholder.art',
    type: 'collector',
    notes: 'Bought Day at museum Ed 10 (01-2021). Also listed as cassiere/agent in earlier rows. Placeholder email.',
    purchases: [
      {
        _key: 'p-patty-day-at-museum-10',
        artwork: ref('artwork-hist-day-at-the-museum'),
        copyNumber: '10',
        soldVia: 'direct',
        date: '2021-01-01',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PART 3: NEW CONTACTS (createIfNotExists)
// ─────────────────────────────────────────────────────────────────────────────

const newContacts = [

  // ── NYC Rooftop buyers ────────────────────────────────────────────────────
  {
    _id: 'contact-hist-elena-kostler',
    _type: 'contact',
    firstName: 'Elena',
    lastName: 'Köstler',
    email: 'elena-kostler@placeholder.art',
    type: 'collector',
    notes: 'Received NYC Rooftop Ed 7 as gift (12-2012). Placeholder email.',
    purchases: [
      { _key: 'p-elena-nyc-rooftop', artwork: ref('artwork-hist-nyc-rooftop'), copyNumber: '7', soldVia: 'direct', date: '2012-12-01' },
    ],
  },

  // ── Kont Eva Lagerweij ────────────────────────────────────────────────────
  {
    _id: 'contact-hist-eva-lagerweij',
    _type: 'contact',
    firstName: 'Eva',
    lastName: 'Lagerweij',
    email: 'eva-lagerweij@placeholder.art',
    type: 'collector',
    notes: 'Received Kont Eva Lagerweij Ed 1 as gift. Placeholder email.',
    purchases: [
      { _key: 'p-eva-kont', artwork: ref('artwork-hist-kont-eva-lagerweij'), copyNumber: '1', soldVia: 'direct' },
    ],
  },

  // ── Pim Thomassen (The Jungle) ────────────────────────────────────────────
  {
    _id: 'contact-hist-pim-thomassen',
    _type: 'contact',
    firstName: 'Pim',
    lastName: 'Thomassen',
    email: 'pim-thomassen@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Bought The Jungle Ed 1 via Walls (07-2013). Placeholder email.',
    purchases: [
      { _key: 'p-pim-thomassen-jungle', artwork: ref('artwork-hist-the-jungle'), copyNumber: '1', soldVia: 'gallery', date: '2013-07-01', price: 450 },
    ],
  },

  // ── Sharky buyers ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-aaf-sharky',
    _type: 'contact',
    firstName: 'AAF customer',
    email: 'aaf-sharky@placeholder.art',
    type: 'collector',
    notes: 'Anonymous Art & Antique Fair buyer, Sharky Ed 1 via Walls (11-2013). Separate from Holy Dress AAF buyer.',
    purchases: [
      { _key: 'p-aaf-sharky-1', artwork: ref('artwork-hist-sharky'), copyNumber: '1', soldVia: 'artfair', date: '2013-11-30', price: 1100 },
    ],
  },
  {
    _id: 'contact-hist-dennis-diem',
    _type: 'contact',
    firstName: 'Dennis',
    lastName: 'Diem',
    email: 'dennis-diem@placeholder.art',
    type: 'collector',
    notes: 'Received Sharky Ed 4 as gift (03-2014). Placeholder email.',
    purchases: [
      { _key: 'p-dennis-sharky-4', artwork: ref('artwork-hist-sharky'), copyNumber: '4', soldVia: 'direct', date: '2014-03-07' },
    ],
  },
  {
    _id: 'contact-hist-bernd-roloff',
    _type: 'contact',
    firstName: 'Bernd',
    lastName: 'Roloff',
    email: 'berndroloff@yahoo.de',
    type: 'collector',
    country: 'DE',
    notes: 'German collector. Multiple purchases via Torch Gallery. Email confirmed via Mailchimp.',
    purchases: [
      { _key: 'p-bernd-sharky-5',        artwork: ref('artwork-hist-sharky'),                copyNumber: '5', soldVia: 'gallery', date: '2022-11-17' },
      { _key: 'p-bernd-kaliexpress-ap',  artwork: ref('artwork-hist-kaliexpress'),            copyNumber: '2 AP', soldVia: 'gallery', date: '2022-11-17' },
      { _key: 'p-bernd-got-no-time-1',   artwork: ref('artwork-hist-got-no-time-for-that-shit'), copyNumber: '1', soldVia: 'gallery', date: '2022-02-01', price: 1650 },
      { _key: 'p-bernd-got-no-time-2',   artwork: ref('artwork-hist-got-no-time-for-that-shit'), copyNumber: '2', soldVia: 'gallery', date: '2022-02-01', price: 1650 },
      { _key: 'p-bernd-horticulture-ii', artwork: ref('artwork-hist-horticulture-ii'),        copyNumber: '1', soldVia: 'gallery', date: '2022-11-17' },
      { _key: 'p-bernd-crustacean',      artwork: ref('artwork-hist-crustacean-ballet'),      copyNumber: '1', soldVia: 'gallery', date: '2023-12-18' },
    ],
  },
  {
    _id: 'contact-hist-roy-sapuletej',
    _type: 'contact',
    firstName: 'Roy',
    lastName: 'Sapuletej',
    email: 'roy-sapuletej@placeholder.art',
    type: 'collector',
    notes: 'Sharky Ed 7 via Walls (11-2015). Placeholder email.',
    purchases: [
      { _key: 'p-roy-sharky-7', artwork: ref('artwork-hist-sharky'), copyNumber: '7', soldVia: 'gallery', date: '2015-11-01', price: 1400 },
    ],
  },
  {
    _id: 'contact-hist-cris-ade',
    _type: 'contact',
    firstName: 'Cris',
    email: 'cris-ade@placeholder.art',
    type: 'collector',
    notes: 'Sharky Ed 9 via Bright Side (ADE event). Placeholder email.',
    purchases: [
      { _key: 'p-cris-sharky-9', artwork: ref('artwork-hist-sharky'), copyNumber: '9', soldVia: 'artfair', price: 2400 },
    ],
  },

  // ── The Maestro ───────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-job-staal',
    _type: 'contact',
    firstName: 'Job',
    lastName: 'Staal',
    email: 'job-staal@placeholder.art',
    company: 'Volkshotel',
    type: 'collector',
    country: 'NL',
    notes: 'Volkshotel. The Maestro Ed 2 (12-2015). Placeholder email.',
    purchases: [
      { _key: 'p-job-maestro-2', artwork: ref('artwork-hist-the-maestro'), copyNumber: '2', soldVia: 'gallery', date: '2015-12-01', price: 1100 },
    ],
  },

  // ── Cheeky Bum ────────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-jeroen-de-graaf',
    _type: 'contact',
    firstName: 'Jeroen',
    lastName: 'de Graaf',
    email: 'jeroen-de-graaf@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Cheeky Bum Ed 2 (04-2014). Placeholder email.',
    purchases: [
      { _key: 'p-jeroen-cheeky-bum-2', artwork: ref('artwork-hist-cheeky-bum'), copyNumber: '2', soldVia: 'gallery', date: '2014-04-02', price: 2250 },
    ],
  },
  {
    _id: 'contact-hist-maja-reineman',
    _type: 'contact',
    firstName: 'Maja',
    lastName: 'Reineman',
    email: 'maja-reineman@placeholder.art',
    type: 'collector',
    notes: 'Cheeky Bum Ed 3 (Unseen 2014). Placeholder email.',
    purchases: [
      { _key: 'p-maja-cheeky-bum-3', artwork: ref('artwork-hist-cheeky-bum'), copyNumber: '3', soldVia: 'artfair', date: '2014-11-01', price: 2100 },
    ],
  },
  {
    _id: 'contact-hist-pim-de-bruijne',
    _type: 'contact',
    firstName: 'Pim',
    lastName: 'de Bruijne',
    email: 'pim-de-bruijne@placeholder.art',
    type: 'collector',
    notes: 'Cheeky Bum Ed 4 (10-2015). Placeholder email.',
    purchases: [
      { _key: 'p-pim-cheeky-bum-4', artwork: ref('artwork-hist-cheeky-bum'), copyNumber: '4', soldVia: 'gallery', date: '2015-10-01', price: 2750 },
    ],
  },

  // ── Chocolate Puma Ed 1 ───────────────────────────────────────────────────
  {
    _id: 'contact-hist-walls-customer-spain',
    _type: 'contact',
    firstName: 'Walls customer (Spain)',
    email: 'walls-customer-spain@placeholder.art',
    type: 'collector',
    notes: 'Anonymous buyer via Walls gallery (25-08-2014). "Spanje" noted — Spanish buyer. Placeholder email.',
    purchases: [
      { _key: 'p-spain-chocolate-puma', artwork: ref('artwork-hist-chocolate-puma'), copyNumber: '1', soldVia: 'gallery', date: '2014-08-25', price: 2250 },
    ],
  },

  // ── #foodporn ─────────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-justin-faust-heylen',
    _type: 'contact',
    firstName: 'Justin Faust',
    lastName: 'Heylen',
    email: 'justin-faust-heylen@placeholder.art',
    type: 'collector',
    notes: '#foodporn Ed 1 via Walls (11-2015). Placeholder email.',
    purchases: [
      { _key: 'p-justin-foodporn-1', artwork: ref('artwork-hist-foodporn'), copyNumber: '1', soldVia: 'gallery', date: '2015-11-01', price: 2750 },
    ],
  },

  // ── I'll show you mine ────────────────────────────────────────────────────
  {
    _id: 'contact-hist-serato-ade',
    _type: 'contact',
    firstName: 'Serato',
    email: 'serato-ade@placeholder.art',
    company: 'Serato',
    type: 'collector',
    notes: 'Company (music software). I\'ll show you mine Ed 1 via Walls at ADE (10-2015). Placeholder email.',
    purchases: [
      { _key: 'p-serato-ill-show-you-mine', artwork: ref('artwork-hist-ill-show-you-mine'), copyNumber: '1', soldVia: 'artfair', date: '2015-10-01', price: 1750 },
    ],
  },
  {
    _id: 'contact-hist-kurt-gaugler',
    _type: 'contact',
    firstName: 'Kurt',
    lastName: 'Gaugler',
    email: 'kurt-gaugler@placeholder.art',
    type: 'collector',
    notes: 'I\'ll show you mine Ed 2 via Brix (01-2016). Placeholder email.',
    purchases: [
      { _key: 'p-kurt-ill-show-you-mine', artwork: ref('artwork-hist-ill-show-you-mine'), copyNumber: '2', soldVia: 'gallery', date: '2016-01-01', price: 2500 },
    ],
  },

  // ── I spy with my little eye ──────────────────────────────────────────────
  {
    _id: 'contact-hist-lisette-van-der-veldt',
    _type: 'contact',
    firstName: 'Lisette',
    lastName: 'van der Veldt',
    email: 'lisette-van-der-veldt@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'I spy Ed 1 via Bright Side (01-2016). Placeholder email.',
    purchases: [
      { _key: 'p-lisette-i-spy', artwork: ref('artwork-hist-i-spy-with-my-little-eye'), copyNumber: '1', soldVia: 'gallery', date: '2016-01-01', price: 1300 },
    ],
  },
  {
    _id: 'contact-hist-marloes-i-spy-ap',
    _type: 'contact',
    firstName: 'Marloes',
    email: 'marloes-i-spy-ap@placeholder.art',
    type: 'collector',
    notes: 'Received I spy with my little eye AP 1 as gift. First name only. Placeholder email.',
    purchases: [
      { _key: 'p-marloes-i-spy-ap', artwork: ref('artwork-hist-i-spy-with-my-little-eye'), copyNumber: '1 AP', soldVia: 'direct' },
    ],
  },

  // ── Venetian Triptych Ed 1 ────────────────────────────────────────────────
  {
    _id: 'contact-hist-this-art-fair-venetian',
    _type: 'contact',
    firstName: 'This Art Fair customer',
    email: 'this-art-fair-venetian@placeholder.art',
    type: 'collector',
    notes: 'Anonymous buyer at This Art Fair. Venetian Triptych Ed 1 (12-2016). Placeholder email.',
    purchases: [
      { _key: 'p-taf-venetian-1', artwork: ref('artwork-hist-venetian-triptych'), copyNumber: '1', soldVia: 'artfair', date: '2016-12-01', price: 1900 },
    ],
  },

  // ── And we deserve to twinkle ─────────────────────────────────────────────
  {
    _id: 'contact-hist-peter-van-rhoon',
    _type: 'contact',
    firstName: 'Peter',
    lastName: 'van Rhoon',
    email: 'peter-van-rhoon@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'And we deserve to twinkle Ed 1 (11-2017). Placeholder email.',
    purchases: [
      { _key: 'p-peter-twinkle', artwork: ref('artwork-hist-and-we-deserve-to-twinkle'), copyNumber: '1', soldVia: 'direct', date: '2017-11-01', price: 1200 },
    ],
  },

  // ── Guido de Bruyn — So Fashion + Out of the blue ────────────────────────
  {
    _id: 'contact-hist-guido-de-bruyn',
    _type: 'contact',
    firstName: 'Guido',
    lastName: 'de Bruyn',
    email: 'debruyn@cap63.be',
    type: 'collector',
    country: 'BE',
    notes: 'So Fashion Ed 1 + Out of the blue Ed 2, both via Josilda gallery (10-2017). Email from Mailchimp (debruyn@cap63.be).',
    purchases: [
      { _key: 'p-guido-so-fashion', artwork: ref('artwork-hist-so-fashion'), copyNumber: '1', soldVia: 'gallery', date: '2017-10-01', price: 700 },
      { _key: 'p-guido-out-of-the-blue', artwork: ref('artwork-hist-out-of-the-blue'), copyNumber: '2', soldVia: 'gallery', date: '2017-10-01', price: 1900 },
    ],
  },

  // ── Anthony & Otto ────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-nadia-van-den-berg',
    _type: 'contact',
    firstName: 'Nadia',
    lastName: 'van den Berg',
    email: 'nadia-van-den-berg@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Anthony & Otto Ed 1 (12-2017). Placeholder email.',
    purchases: [
      { _key: 'p-nadia-anthony-otto', artwork: ref('artwork-hist-anthony-and-otto'), copyNumber: '1', soldVia: 'direct', date: '2017-12-01', price: 1040 },
    ],
  },

  // ── El Diablo Luchador II ─────────────────────────────────────────────────
  {
    _id: 'contact-hist-lodewijk-keulen',
    _type: 'contact',
    firstName: 'Lodewijk',
    lastName: 'Keulen',
    email: 'lodewijk-keulen@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'El Diablo Luchador II Ed 1 (12-2017, via Brix installment). Placeholder email.',
    purchases: [
      { _key: 'p-lodewijk-el-diablo', artwork: ref('artwork-hist-el-diablo-luchador-ii'), copyNumber: '1', soldVia: 'gallery', date: '2017-12-01' },
    ],
  },

  // ── AP trades ─────────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-thijs-sweers',
    _type: 'contact',
    firstName: 'Thijs',
    lastName: 'Sweers',
    email: 'thijs-sweers@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Trade: A Pattern of Madness II AP + Confetti Party AP (both 09-2017). Placeholder email.',
    purchases: [
      { _key: 'p-thijs-a-pattern-ap', artwork: ref('artwork-hist-a-pattern-of-madness-ii'), copyNumber: '1 AP', soldVia: 'other', date: '2017-09-01', price: 0 },
      { _key: 'p-thijs-confetti-ap',  artwork: ref('artwork-hist-confetti-party'),          copyNumber: '1 AP', soldVia: 'other', date: '2017-09-01', price: 0 },
    ],
  },
  {
    _id: 'contact-hist-roel-van-der-linden',
    _type: 'contact',
    firstName: 'Roel Jeroen',
    lastName: 'van der Linden',
    email: 'roel-van-der-linden@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'Classic Rock AP trade (04-2017) + Anastasia Ed 1 (12-2020). Placeholder email.',
    purchases: [
      { _key: 'p-roel-classic-rock-ap', artwork: ref('artwork-hist-classic-rock'), copyNumber: '1 AP', soldVia: 'other', date: '2017-04-01', price: 0 },
      { _key: 'p-roel-anastasia',       artwork: ref('artwork-hist-anastasia'),    copyNumber: '1',    soldVia: 'direct', date: '2020-12-01' },
    ],
  },

  // ── From Russia with Love ─────────────────────────────────────────────────
  {
    _id: 'contact-hist-ruben-charbon',
    _type: 'contact',
    firstName: 'Ruben',
    lastName: 'Charbon',
    email: 'ruben-charbon@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: 'From Russia with Love Ed 1 (04-2018, via Brix installment). Placeholder email.',
    purchases: [
      { _key: 'p-ruben-from-russia', artwork: ref('artwork-hist-from-russia-with-love'), copyNumber: '1', soldVia: 'gallery', date: '2018-04-01' },
    ],
  },

  // ── The Beast Ed 1 trade ──────────────────────────────────────────────────
  {
    _id: 'contact-hist-katharina-arndt',
    _type: 'contact',
    firstName: 'Katharina',
    lastName: 'Arndt',
    email: 'katharina-arndt@placeholder.art',
    type: 'collector',
    notes: 'The Beast Ed 1 — trade/ruil (10-2015). Placeholder email.',
    purchases: [
      { _key: 'p-katharina-beast-1', artwork: ref('artwork-hist-the-beast'), copyNumber: '1', soldVia: 'other', date: '2015-10-01', price: 0 },
    ],
  },

  // ── Employee of the Month + Employee buyers ───────────────────────────────
  {
    _id: 'contact-hist-super-stories',
    _type: 'contact',
    firstName: 'Super Stories',
    email: 'super-stories@placeholder.art',
    company: 'Super Stories',
    type: 'collector',
    notes: 'Employee of the Month Ed 2 (07-2019). Placeholder email.',
    purchases: [
      { _key: 'p-superstories-employee-2', artwork: ref('artwork-hist-employee-of-the-month'), copyNumber: '2', soldVia: 'direct', date: '2019-07-01' },
    ],
  },
  {
    _id: 'contact-hist-sensemakers',
    _type: 'contact',
    firstName: 'Sensemakers',
    email: 'sensemakers@placeholder.art',
    company: 'Sensemakers',
    type: 'collector',
    notes: 'Sorry we\'re dead Ed 2 (11-2021) + Day at museum Ed 13 (11-2022). Placeholder email.',
    purchases: [
      { _key: 'p-sense-sorry-were-dead', artwork: ref('artwork-hist-sorry-were-dead'),   copyNumber: '2',  soldVia: 'direct', date: '2021-11-01' },
      { _key: 'p-sense-day-at-museum',   artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '13', soldVia: 'direct', date: '2022-11-01' },
    ],
  },

  // ── Tool Man's Dream ──────────────────────────────────────────────────────
  {
    _id: 'contact-hist-willem-asselbergs',
    _type: 'contact',
    firstName: 'Willem',
    lastName: 'Asselbergs',
    email: 'willem-asselbergs@placeholder.art',
    type: 'collector',
    country: 'NL',
    notes: "Tool man's dream Ed 1 (01-2016). Placeholder email.",
    purchases: [
      { _key: 'p-willem-tool-mans-dream', artwork: ref('artwork-hist-tool-mans-dream'), copyNumber: '1', soldVia: 'gallery', date: '2016-01-01', price: 500 },
    ],
  },

  // ── The Breakfast Club + Mo ───────────────────────────────────────────────
  {
    _id: 'contact-hist-mo-gallery',
    _type: 'contact',
    firstName: 'Mo',
    email: 'mo-gallery@placeholder.art',
    type: 'gallery',
    notes: 'Gallery "Mo". Breakfast Club Ed 1 (02-2016) + Catching Popcorn AP 1 (gift). Placeholder email.',
    purchases: [
      { _key: 'p-mo-breakfast-club',      artwork: ref('artwork-hist-the-breakfast-club'), copyNumber: '1',    soldVia: 'gallery', date: '2016-02-01' },
      { _key: 'p-mo-catching-popcorn-ap', artwork: ref('artwork-hist-catching-popcorn'),   copyNumber: '1 AP', soldVia: 'direct' },
    ],
  },

  // ── Day at the museum (14 buyers) ─────────────────────────────────────────
  {
    _id: 'contact-hist-stevenie-roseboom',
    _type: 'contact',
    firstName: 'Stevenie',
    lastName: 'Roseboom',
    email: 'stevenie-roseboom@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 1 via Webshop (11-2017, €240). Placeholder email.',
    purchases: [
      { _key: 'p-stevenie-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '1', soldVia: 'webshop', date: '2017-11-01', price: 240 },
    ],
  },
  {
    _id: 'contact-hist-bas-verwoerd',
    _type: 'contact',
    firstName: 'Bas',
    lastName: 'Verwoerd',
    email: 'bas-verwoerd@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 2 via Webshop (11-2017, €240). Placeholder email.',
    purchases: [
      { _key: 'p-bas-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '2', soldVia: 'webshop', date: '2017-11-01', price: 240 },
    ],
  },
  {
    _id: 'contact-hist-stefan-meier',
    _type: 'contact',
    firstName: 'Stefan',
    lastName: 'Meier',
    email: 'stefan-meier@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 3 (€160, 11-2017) + Lady of manor Ed 1 (11-2019). Placeholder email.',
    purchases: [
      { _key: 'p-stefan-day-at-museum',     artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '3',  soldVia: 'webshop', date: '2017-11-01', price: 160 },
      { _key: 'p-stefan-lady-of-the-manor', artwork: ref('artwork-hist-lady-of-the-manor'), copyNumber: '1',  soldVia: 'direct',  date: '2019-11-01' },
    ],
  },
  {
    _id: 'contact-hist-nick-botter',
    _type: 'contact',
    firstName: 'Nick',
    lastName: 'Botter',
    email: 'nick-botter@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 6 via Webshop (03-2018, €250). Placeholder email.',
    purchases: [
      { _key: 'p-nick-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '6', soldVia: 'webshop', date: '2018-03-01', price: 250 },
    ],
  },
  {
    _id: 'contact-hist-rob-de-jong',
    _type: 'contact',
    firstName: 'Rob',
    lastName: 'de Jong',
    email: 'rob-de-jong@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 7 via Marloes (03-2018) + Lady of manor Ed 13 (04-2020). Placeholder email.',
    purchases: [
      { _key: 'p-rob-day-at-museum',     artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '7',  soldVia: 'direct', date: '2018-03-01' },
      { _key: 'p-rob-lady-of-the-manor', artwork: ref('artwork-hist-lady-of-the-manor'), copyNumber: '13', soldVia: 'direct', date: '2020-04-01' },
    ],
  },
  {
    _id: 'contact-hist-jelle-rietveld',
    _type: 'contact',
    firstName: 'Jelle',
    lastName: 'Rietveld',
    email: 'jelle-rietveld@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 8 — gift (06-2018). Placeholder email.',
    purchases: [
      { _key: 'p-jelle-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '8', soldVia: 'direct', date: '2018-06-01' },
    ],
  },
  {
    _id: 'contact-hist-rob-via-jody',
    _type: 'contact',
    firstName: 'Rob',
    email: 'rob-via-jody@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 9 (06-2018, "van Jody Verver"). First name only. Placeholder email.',
    purchases: [
      { _key: 'p-rob-via-jody-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '9', soldVia: 'direct', date: '2018-06-01' },
    ],
  },
  {
    _id: 'contact-hist-rosemarijn-blanken',
    _type: 'contact',
    firstName: 'Rosemarijn',
    lastName: 'Blanken',
    email: 'rosemarijn-blanken@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 11 via Webshop (01-2022, €275). Placeholder email.',
    purchases: [
      { _key: 'p-rosemarijn-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '11', soldVia: 'webshop', date: '2022-01-01', price: 275 },
    ],
  },
  {
    _id: 'contact-hist-robbert-van-loon',
    _type: 'contact',
    firstName: 'Robbert',
    lastName: 'van Loon',
    email: 'robbert-van-loon@placeholder.art',
    type: 'collector',
    notes: 'Day at museum Ed 12 via Webshop (01-2022, €275). Placeholder email.',
    purchases: [
      { _key: 'p-robbert-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'), copyNumber: '12', soldVia: 'webshop', date: '2022-01-01', price: 275 },
    ],
  },
  {
    _id: 'contact-hist-shirien-van-maurik',
    _type: 'contact',
    firstName: 'Shirien',
    lastName: 'van Maurik',
    email: 'svmaurik@hotmail.com',
    type: 'collector',
    country: 'NL',
    notes: 'Day at museum Ed 14 (09-2023) + Lunar Lunacy Effect Ed 4 (03-2024). Email from Mailchimp.',
    purchases: [
      { _key: 'p-shirien-day-at-museum', artwork: ref('artwork-hist-day-at-the-museum'),   copyNumber: '14', soldVia: 'direct', date: '2023-09-01' },
      { _key: 'p-shirien-lunar-lunacy',  artwork: ref('artwork-hist-lunar-lunacy-effect'), copyNumber: '4',  soldVia: 'direct', date: '2024-03-01' },
    ],
  },

  // ── Smoking Bunny ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-lukas-schneider',
    _type: 'contact',
    firstName: 'Lukas',
    lastName: 'Schneider',
    email: 'lukas-schneider@placeholder.art',
    type: 'collector',
    notes: 'Smoking Bunny Ed 1 via Webshop (11-2017, €160). Placeholder email.',
    purchases: [
      { _key: 'p-lukas-smoking-bunny', artwork: ref('artwork-hist-smoking-bunny'), copyNumber: '1', soldVia: 'webshop', date: '2017-11-01', price: 160 },
    ],
  },
  {
    _id: 'contact-hist-benjamin-gotlieb',
    _type: 'contact',
    firstName: 'Benjamin',
    lastName: 'Gotlieb',
    email: 'benjamin-gotlieb@placeholder.art',
    type: 'collector',
    notes: 'Smoking Bunny Ed 2 via Webshop (11-2017, €240). Placeholder email.',
    purchases: [
      { _key: 'p-benjamin-smoking-bunny', artwork: ref('artwork-hist-smoking-bunny'), copyNumber: '2', soldVia: 'webshop', date: '2017-11-01', price: 240 },
    ],
  },
  {
    _id: 'contact-hist-linda-stulic',
    _type: 'contact',
    firstName: 'Linda',
    lastName: 'Stulic',
    email: 'linda-stulic@placeholder.art',
    type: 'collector',
    notes: 'Smoking Bunny Ed 3 — ruil shoot (12-2017, €160). Placeholder email.',
    purchases: [
      { _key: 'p-linda-smoking-bunny', artwork: ref('artwork-hist-smoking-bunny'), copyNumber: '3', soldVia: 'other', date: '2017-12-01', price: 160 },
    ],
  },

  // ── Lady of manor ─────────────────────────────────────────────────────────
  {
    _id: 'contact-hist-joris-el-jefe',
    _type: 'contact',
    firstName: 'Joris',
    email: 'joris-el-jefe@placeholder.art',
    company: 'EL Jefe',
    type: 'collector',
    notes: 'Lady of manor Ed 7 (12-2025). Placeholder email.',
    purchases: [
      { _key: 'p-joris-lady-of-the-manor', artwork: ref('artwork-hist-lady-of-the-manor'), copyNumber: '7', soldVia: 'direct', date: '2025-12-01' },
    ],
  },

  // ── Lunar Lunacy Effect ───────────────────────────────────────────────────
  {
    _id: 'contact-hist-kris-hart',
    _type: 'contact',
    firstName: 'Kris',
    lastName: 'Hart',
    email: 'kris-hart@placeholder.art',
    type: 'collector',
    notes: 'Lunar Lunacy Effect Ed 2 via Torch (01-2022). Placeholder email.',
    purchases: [
      { _key: 'p-kris-lunar-lunacy', artwork: ref('artwork-hist-lunar-lunacy-effect'), copyNumber: '2', soldVia: 'gallery', date: '2022-01-01' },
    ],
  },
  {
    _id: 'contact-hist-menno',
    _type: 'contact',
    firstName: 'Menno',
    email: 'menno-lunar@placeholder.art',
    type: 'collector',
    notes: 'Lunar Lunacy Effect Ed 7 via Torch (01-2022). First name only. Placeholder email.',
    purchases: [
      { _key: 'p-menno-lunar-lunacy', artwork: ref('artwork-hist-lunar-lunacy-effect'), copyNumber: '7', soldVia: 'gallery', date: '2022-01-01' },
    ],
  },

  // ── Torch Gallery era ─────────────────────────────────────────────────────
  {
    _id: 'contact-hist-duncan-leica',
    _type: 'contact',
    firstName: 'Duncan',
    lastName: 'Leica',
    email: 'duncan-leica@placeholder.art',
    type: 'collector',
    notes: 'Anastasia Ed 2 (trade, 12-2024) + Embrace Your Freedom Ed 1 (trade, 11-12-2024) both via Torch. Placeholder email.',
    purchases: [
      { _key: 'p-duncan-anastasia',        artwork: ref('artwork-hist-anastasia'),        copyNumber: '2', soldVia: 'gallery', date: '2024-12-01', price: 0 },
      { _key: 'p-duncan-embrace-freedom',  artwork: ref('artwork-hist-embrace-your-freedom'), copyNumber: '1', soldVia: 'gallery', date: '2024-12-11', price: 0 },
    ],
  },
  {
    _id: 'contact-hist-ryan-merrett',
    _type: 'contact',
    firstName: 'Ryan',
    lastName: 'Merrett',
    email: 'ryan.merrett@booking.com',
    type: 'collector',
    notes: 'NIMBY Ed 1 via Torch (02-2022, €995). Email from Mailchimp.',
    purchases: [
      { _key: 'p-ryan-nimby', artwork: ref('artwork-hist-nimby'), copyNumber: '1', soldVia: 'gallery', date: '2022-02-01', price: 995 },
    ],
  },
  {
    _id: 'contact-hist-frans-oomen',
    _type: 'contact',
    firstName: 'Frans',
    lastName: 'Oomen',
    email: 'info@mo-artgallery.nl',
    type: 'gallery',
    company: 'MO Art Gallery',
    notes: 'SPEEDY HARMONY Ed 1 via Torch (01-2020). Email from Mailchimp.',
    purchases: [
      { _key: 'p-frans-speedy-harmony', artwork: ref('artwork-hist-speedy-harmony'), copyNumber: '1', soldVia: 'gallery', date: '2020-01-01' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function upsert(doc, mode = 'createOrReplace') {
  try {
    await client[mode](doc)
    process.stdout.write('.')
    return true
  } catch (err) {
    console.error(`\n✗ ${doc._id}: ${err.message}`)
    return false
  }
}

async function main() {
  console.log('=== patch-historical-sales-v2.mjs ===\n')

  // Part 1: New artworks
  console.log(`Upserting ${newArtworks.length} new artworks...`)
  let ok = 0, fail = 0
  for (const doc of newArtworks) {
    const result = await upsert(doc, 'createOrReplace')
    result ? ok++ : fail++
  }
  console.log(`\nArtworks: ${ok} OK, ${fail} failed\n`)

  // Part 2: Fix existing contacts (createOrReplace)
  console.log(`Fixing ${fixedContacts.length} existing contacts...`)
  ok = 0; fail = 0
  for (const doc of fixedContacts) {
    const result = await upsert(doc, 'createOrReplace')
    result ? ok++ : fail++
  }
  console.log(`\nFixed contacts: ${ok} OK, ${fail} failed\n`)

  // Part 3: New contacts (createIfNotExists)
  console.log(`Adding ${newContacts.length} new contacts...`)
  ok = 0; fail = 0
  for (const doc of newContacts) {
    const result = await upsert(doc, 'createIfNotExists')
    result ? ok++ : fail++
  }
  console.log(`\nNew contacts: ${ok} OK, ${fail} failed\n`)

  console.log('Done! Open Studio to verify.')
  console.log('\nStill manual / uncertain:')
  console.log('  - NYC Rooftop Ed 2, 4, 5: anonymous Walls customers (no names in CSV)')
  console.log('  - Rabbit Hole Ed 2 + Ed 3: anonymous Walls customers')
  console.log('  - I spy Ed 2: "Aan wie ook al weer?" — buyer unknown')
  console.log('  - The Maestro Ed 1: sold to "Walls" (the gallery itself?) 16-11-2013')
  console.log('  - Anneke Dekker + Vader Dekker: LA Squeeze Ed 1 listed as "Ouders" — split or one contact?')
  console.log('  - Lady of manor: copy 5 has both Fleur Souverein AND Kristian gift — double-check')
}

main().catch(err => { console.error(err); process.exit(1) })
