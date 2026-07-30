/**
 * seed-birds-of-paradise.mjs — 23 artworks from Birds of Paradise
 * Run: node scripts/seed-birds-of-paradise.mjs
 */
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dir, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'u11u127q',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production',
  useCdn: false, apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

const T = {
  FRAME:          'Lambda print on Fujicolor Crystal Archive paper, passe-partout, glass, and wooden frame',
  MUSEUM:         'Lambda print on Fujicolor Crystal Archive paper, passe-partout, museum glass, and wooden frame',
  PRINTED_MUSEUM: 'Lambda print on Fujicolor Crystal Archive paper, printed passe-partout, museum glass, and wooden frame',
  SIMPLE:         'Lambda print on Fujicolor Crystal Archive paper, glass, and wooden frame',
  DIBOND:         'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, plexiglass and aluminum frame',
  PEEK:           'Lambda print on Fujicolor Crystal Archive paper, mounted on dibond, colored plexiglass, vinyl graphic and black spacers',
  PEEPHOLE:       'Lambda print on Fujicolor Crystal Archive paper, colored Plexiglass, black aluminum frame',
}

function b(text) {
  return { _type:'block', _key:'b0', style:'normal', markDefs:[], children:[{ _type:'span', _key:'s0', text, marks:[] }] }
}

const artworks = [
  { title:"Vive la Vie!", year:2021, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:90,heightCm:60}, priceExclVAT:1750, description:[b('"Vive la vie!" can be seen as a message of empowerment and liberation for women, encouraging them to embrace their sexuality and to live life to the fullest.')], options:[{label:'30 × 45 cm',priceExclVAT:750},{label:'40 × 60 cm',priceExclVAT:950},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"La Vie Est Une Fleur Dont l'Amour Est le Miel", year:2021, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:60,heightCm:90}, priceExclVAT:1750, description:[b('Quote by Victor Hugo: "Life is a flower of which love is the honey." A reminder of the beauty of love and intimacy, and encourages women to embrace their sexual experiences as a natural and essential part of life.')], options:[{label:'30 × 45 cm',priceExclVAT:750},{label:'40 × 60 cm',priceExclVAT:950},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Vouloir, C'est Pouvoir", year:2021, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, description:[b("The quote \"Vouloir, c'est pouvoir\" reinforces that women are capable of achieving their goals with determination and effort, and that they deserve equal rights and opportunities, free from social and cultural constraints.")], options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"La Sexualité Est un Acte de Liberté, Non de Soumission", year:2021, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:30,heightCm:45}, priceExclVAT:750, description:[b('Quote by Françoise Simpère: "Sexuality is an act of freedom, not submission." It emphasizes the importance of sexual autonomy and agency in relationships.')], options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"C'est Juste Moi", year:2021, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Peek-a-Boo Paradox", year:2022, editionTotal:7, editionAP:2, medium:T.PEEK, dimensions:{widthCm:99,heightCm:66}, priceExclVAT:2000, options:[{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Peephole", year:2022, editionTotal:7, editionAP:2, medium:T.PEEPHOLE, dimensions:{widthCm:75,heightCm:50}, priceExclVAT:1400, options:[{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Optical Phenomenon", year:2022, editionTotal:7, editionAP:2, medium:T.MUSEUM, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Madox", year:2024, editionTotal:7, editionAP:2, medium:T.PRINTED_MUSEUM, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:800, options:[{label:'40 × 60 cm',priceExclVAT:1000},{label:'90 × 60 cm',priceExclVAT:1800}] },
  { title:"Pat", year:2024, editionTotal:7, editionAP:2, medium:T.PRINTED_MUSEUM, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:800, options:[{label:'40 × 60 cm',priceExclVAT:1000},{label:'90 × 60 cm',priceExclVAT:1800}] },
  { title:"Stefa", year:2024, editionTotal:7, editionAP:2, medium:T.PRINTED_MUSEUM, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:800, options:[{label:'40 × 60 cm',priceExclVAT:1000},{label:'90 × 60 cm',priceExclVAT:1800}] },
  { title:"Wiktor", year:2024, editionTotal:7, editionAP:2, medium:T.PRINTED_MUSEUM, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:800, options:[{label:'40 × 60 cm',priceExclVAT:1000},{label:'90 × 60 cm',priceExclVAT:1800}] },
  { title:"Anthony & Otto", year:2016, editionTotal:5, editionAP:2, medium:T.FRAME, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Evolution of Imitation", year:2016, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Evolution of Imitation II", year:2018, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Unleashed Moments", year:2013, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:40,heightCm:60}, priceExclVAT:950, options:[{label:'30 × 45 cm',priceExclVAT:750},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Embrace Your Freedom", year:2020, editionTotal:7, editionAP:2, medium:T.DIBOND, dimensions:{widthCm:135,heightCm:90}, priceExclVAT:2750, options:[{label:'90 × 60 cm',priceExclVAT:1750},{label:'110 × 165 cm',priceExclVAT:3750}] },
  { title:"Misophonic Feast", year:2022, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:60,heightCm:40}, priceExclVAT:950, options:[{label:'30 × 45 cm',priceExclVAT:750},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Roots of the Self", year:2022, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:45,heightCm:30}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Magical Fountain", year:2020, editionTotal:7, editionAP:2, medium:T.MUSEUM, dimensions:{widthCm:30,heightCm:45}, priceExclVAT:1750, options:[{label:'40 × 60 cm (incl. frame 80 × 120 cm)',priceExclVAT:2750}] },
  { title:"The Forest Fairy", year:2020, editionTotal:7, editionAP:2, medium:T.FRAME, dimensions:{widthCm:60,heightCm:40}, priceExclVAT:950, options:[{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Natural Contortion", year:2020, editionTotal:7, editionAP:2, medium:T.SIMPLE, dimensions:{widthCm:30,heightCm:45}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
  { title:"Voyage into the Unknown", year:2020, editionTotal:7, editionAP:2, medium:T.SIMPLE, dimensions:{widthCm:30,heightCm:45}, priceExclVAT:750, options:[{label:'40 × 60 cm',priceExclVAT:950},{label:'90 × 60 cm',priceExclVAT:1750},{label:'135 × 90 cm',priceExclVAT:2750}] },
]

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

console.log(`\n🎨  Creating ${artworks.length} artworks...\n`)
const createdIds = []

for (const aw of artworks) {
  const slug = slugify(aw.title)
  const existing = await client.fetch(`*[_type=="artwork" && slug.current==$slug][0]._id`,{slug})
  if (existing) { console.log(`  ⏭️   Skip  "${aw.title}"`); createdIds.push(existing); continue }

  const doc = {
    _type:'artwork', title:aw.title,
    slug:{_type:'slug',current:slug},
    year:aw.year, medium:aw.medium, dimensions:aw.dimensions,
    editionTotal:aw.editionTotal, editionAP:aw.editionAP,
    priceExclVAT:aw.priceExclVAT, vatRate:9,
    status:'enquire', showInWebshop:false,
    ...(aw.description ? {description:aw.description} : {}),
    options:aw.options.map((o,i)=>({_type:'artworkOption',_key:`opt-${i}`,label:o.label,priceExclVAT:o.priceExclVAT})),
  }
  const created = await client.create(doc)
  console.log(`  ✅  "${aw.title}"`)
  createdIds.push(created._id)
}

const series = await client.fetch(`*[_type=="projectSeries" && lower(title) match "zine*"][0]{_id,title,artworks}`)
if (!series) {
  console.log('\n⚠️  "The Zine Project" projectSeries not found — create it in Studio and link manually.\n')
  console.log('IDs:', createdIds.join(', '))
  process.exit(0)
}
console.log(`\n📚  "${series.title}" found`)
const existing = new Set((series.artworks??[]).map(r=>r._ref))
const toAdd = createdIds.filter(id=>!existing.has(id)).map(id=>({_type:'reference',_ref:id,_key:id}))
if (toAdd.length) {
  await client.patch(series._id).setIfMissing({artworks:[]}).append('artworks',toAdd).commit()
  console.log(`  Linked ${toAdd.length} artworks to series.`)
}
console.log('\n✅  Done!\n')
