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

function block(text) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: Math.random().toString(36).slice(2), text, marks: [] }],
  }
}

// ── ABOUT PAGE ────────────────────────────────────────────────────────────────

const aboutDoc = {
  _id: 'aboutPage',
  _type: 'aboutPage',
  bio: [
    block('Sander Dekker (1980) is an Amsterdam-based artist working with photography, installation, video and publications. His work documents how people present themselves — to each other, to cameras, and to the world they construct around themselves.'),
    block('His practice is rooted in The Social Media Project, a decade-long series of encounters with strangers photographed in their own homes after first contact online. It caught something specific: a brief moment when reaching out to a stranger on social media felt open, easy and charged with possibility. That openness is slowly fleeing. What remains is a document of a particular kind of human behaviour that feels increasingly rare.'),
    block('The questions that project raised have continued to drive everything since — through installations, handmade publications, participatory work and projects centred on people who push back against external pressure simply by being fully, visibly themselves.'),
  ],
  quotes: [
    {
      _key: 'q1',
      _type: 'quote',
      name: 'Marloes van Vugt',
      role: 'foreword',
      publication: 'My Name Is Sander Dekker Nº.2',
      image: { _type: 'image', asset: { _type: 'reference', _ref: 'image-placeholder' } },
      quote: '"While embracing his own strangeness, he makes a true connection with his models. It\'s what makes his work so very appealing."',
      article: `Josilda da Conceição Gallery in Amsterdam is presenting the solo exhibition 'Girls in Paris' with work by Sander Dekker. The introverted Dutch photographer takes raw and real photos of the people he encounters on social media. He captures them in ways that give them a significant degree of agency, a certain autonomy over the way they are represented.

The Dutch photographer travels all over the world for his photographs. He captured hundreds of people that he usually only knows through social media, often quite unique and eccentric people. This results in surprising and energetic images that are unexpectedly vulnerable. The people in his photos look relaxed and not a single element appears forced. The authenticity of his photos contrasts beautifully with the artificiality of the idealised ways in which we present ourselves on social media. Dekker worked as an art director in the fashion industry for a while, but his autonomous work is far from that. He does not want to make fashion spreads with a certain studio quality. He prefers an external flash, a 33mm wide-angle lens, short shoots and an essential combination of humour, spontaneity and improvisation.

What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves. That in itself is an achievement, but Dekker's characters are often naked women. Yet the photographer does not resort to tiring, beautiful pictures that are mainly intended for the entertainment of straight men. Instead, he seems to capture their personality in an effective and intimate way, that spark that makes them so unique.

While embracing his own strangeness, he makes a true connection with his models. It's what makes his work so very appealing. So goodbye to trying to be real; I hope you will acknowledge your stranger somewhere in this book.

– Marloes van Vugt`,
    },
    {
      _key: 'q2',
      _type: 'quote',
      name: 'Flor Linckens',
      role: 'review',
      publication: 'Gallery Viewer',
      quote: '"What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves."',
      article: `Josilda da Conceição Gallery in Amsterdam is presenting the solo exhibition 'Girls in Paris' with work by Sander Dekker. The introverted Dutch photographer takes raw and real photos of the people he encounters on social media. He captures them in ways that give them a significant degree of agency, a certain autonomy over the way they are represented.

The Dutch photographer travels all over the world for his photographs. He captured hundreds of people that he usually only knows through social media, often quite unique and eccentric people. This results in surprising and energetic images that are unexpectedly vulnerable. The people in his photos look relaxed and not a single element appears forced.

To understand why Dekker's portraits of women in particular are so interesting, it is necessary to take a closer look at the term the male gaze. The term was first introduced by Laura Mulvey in Visual Pleasure and Narrative Cinema (1975). In this influential essay, the American film theorist analysed the representation of women in Hollywood. Female characters in these films were usually presented from a heterosexual male perspective.

Dekker seems to break with these boring, reductive and stereotypical representations of the female presenting body. What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves. That in itself is an achievement, but Dekker's characters are often naked women. Yet the photographer does not resort to tiring, beautiful pictures that are mainly intended for the entertainment of straight men. Instead, he seems to capture their personality in an effective and intimate way, that spark that makes them so unique.

– Flor Linckens`,
    },
    {
      _key: 'q3',
      _type: 'quote',
      name: 'Margot Pol',
      role: 'interview',
      publication: 'de Volkskrant',
      quote: '"Het is een weerspiegeling van de tijdgeest: hoe normaal het is om op sociale media zo veel van jezelf te laten zien, en hoe makkelijk het is, of was, om in contact te komen."',
      article: `Fotograaf Sander Dekker, zelf nogal introvert, heeft veel bewondering voor de excentrieke types die hij op sociale media tegenkomt. Hij zocht ze op – en het klikte.

'Ik vind het zelf ook nog steeds vreemd: dat mensen zich probleemloos blootgeven aan iemand die ze niet kennen. En dan na anderhalf uur zeggen: groetjes!'

Behalve verwonderd is fotograaf Sander Dekker (39) ook dankbaar. Want alle excentriekelingen die hij de afgelopen zeven jaar overal ter wereld fotografeerde kende hij niet. Ze bleken desondanks bereid om voor hem, in hun eigen huis, te poseren. Het korte contact dat ze van tevoren hadden, liep meestal via Instagram of andere sociale media, waar Dekker ze ook zocht en vond: de energieke buitenbeentjes, de vrije types, de kunstenaars zonder gêne. 'Vaak dragen mensen op sociale media een masker, maar de echte excentriekelingen doen dat niet. Die spelen geen spelletje.'

En waarom zocht hij dan juist hén? Van Tel Aviv tot Moskou en Marseille? 'Uit bewondering. En ook omdat ik tegen ze opzag en hoopte dat hun eigenschappen op mij zouden afstralen, al was het maar een beetje. Ik kan zelf best een kluizenaar zijn en als ik mensen niet ken, ben ik toch wat introvert.'

Doordat Dekker zijn modellen pas ontmoette als ze de deur opendeden en de shoot vervolgens verliep zonder vooropgesteld plan, ontstonden vaak onverwachte, energieke beelden, vaak een beetje gek en passend bij de vrijheid van zijn geportretteerden.

Maar nu is het klaar. Met het afnemende gebruik van Facebook en steeds meer afgeschermde accounts op Instagram zijn mensen een stuk minder sociaal geworden op sociale media. Er komt wel nog een boek: My name is Sander Dekker 2. 'Het is een weerspiegeling van de tijdgeest: hoe normaal het is om op sociale media zo veel van jezelf te laten zien, en hoe makkelijk het is, of was, om in contact te komen.'

– Margot Pol (Volkskrant Magazine)`,
    },
    {
      _key: 'q4',
      _type: 'quote',
      name: 'Edo Dijksterhuis',
      role: 'article',
      publication: 'Het Parool',
      quote: '"Net als Arbus, Clark en Sultan is Sander Dekker een kind van zijn tijd."',
      article: `My Name is Sander Dekker doet onherroepelijk denken aan Diane Arbus. De in 1971 overleden New Yorkse fotografeerde dwergen, nudisten, transgenders en circusvolk. Ze gaf een gezicht aan mensen in de marge, die als freak werden beschouwd. Met keihard flitslicht zette zij ze haarscherp neer, niet altijd even flatteus. Met haar werk gaf Arbus de documentairefotografie een duw in een nieuwe richting.

Net als Arbus, Clark en Sultan is Sander Dekker een kind van zijn tijd. Hij zoekt zijn modellen niet in smoezelige achterbuurten maar doet research op internet. Op sociale media stuit hij bijvoorbeeld op een getatoeëerde bodybuilder met een voorliefde voor accordeon of een jonge schilder die woont en werkt in een bouwvallig fabriekspand. Hij stuurt ze een berichtje, springt in het vliegtuig en staat dan 'out of the blue' voor de deur van wildvreemden.

Dekkers fotosessies duren een tot anderhalf uur. Er is niets voorbereid. De fotograaf doet het met wat en wie hij aantreft. Het gaat om de magie en chemie van het moment. Het is als een blind date met camera.

The Project is de verzamelnaam van de foto's die Dekker sinds 2011 maakt en waarvan een deel nu te zien is bij Torch. Er is veel expliciet bloot te zien. De portretten ogen als kruising tussen geënsceneerde fotografie en snapshots, het consequent gebruik van zwart-wit knipoogt weer naar de documentairetraditie.

Maar het grote verschil met de outcasts die Arbus vastlegde en daarmee emancipeerde, is dat Dekkers modellen geen enkele behoefte hebben aan normalisering en acceptatie. Zij dragen hun 'freak'-button met trots. Zij wentelen zich in hun niche, etaleren hem. In het Instagramtijdperk lijken sensatie en schaamte verdwenen en bestaat enkel nog exposure.

– Edo Dijksterhuis (Het Parool)`,
    },
  ],
}

// ── CV PAGE ───────────────────────────────────────────────────────────────────

const cvDoc = {
  _id: 'cvPage',
  _type: 'cvPage',
  intro: 'A selection of solo projects, installations and presentations, followed by group exhibitions, special projects and publications.',
  sections: [
    {
      _key: 's1', _type: 'cvSection',
      title: 'Innate Curiosity — Art fairs',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2026', label: 'NAP+, Amsterdam, NL' },
      ],
    },
    {
      _key: 's2', _type: 'cvSection',
      title: 'The Zine Project — Solo presentations',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2026', label: 'Studio presentation (ongoing), by appointment, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2025', label: 'Torch Gallery, Amsterdam, NL' },
        { _key: 'e3', _type: 'entry', year: '2023', label: 'Josilda da Conceição Gallery, Amsterdam, NL' },
      ],
    },
    {
      _key: 's3', _type: 'cvSection',
      title: 'TenFifteen — Permanent installations',
      entries: [
        { _key: 'e1', _type: 'entry', label: 'Leica Store, Lisse, NL (since 2026)' },
        { _key: 'e2', _type: 'entry', label: 'Strayfield Gallery, Hellerup, DK (since 2020)' },
        { _key: 'e3', _type: 'entry', label: 'TORCH Gallery, Amsterdam, NL (since 2018)' },
        { _key: 'e4', _type: 'entry', label: 'Hotel Not Hotel, Amsterdam, NL (since 2018)' },
      ],
    },
    {
      _key: 's4', _type: 'cvSection',
      title: 'TenFifteen — Exhibited installations',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2026', label: 'Torch Gallery, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2025', label: 'Torch Gallery, Amsterdam, NL' },
        { _key: 'e3', _type: 'entry', year: '2019', label: 'Former ABN AMRO, Amsterdam, NL' },
        { _key: 'e4', _type: 'entry', year: '2018', label: 'Arti et Amicitiae, Amsterdam, NL' },
        { _key: 'e5', _type: 'entry', year: '2018', label: 'Torch Gallery, Amsterdam, NL' },
        { _key: 'e6', _type: 'entry', year: '2018', label: 'ODAM at Georgies, Amsterdam, NL' },
        { _key: 'e7', _type: 'entry', year: '2018', label: 'Amsterdam Central Station, Amsterdam, NL' },
        { _key: 'e8', _type: 'entry', year: '2017', label: 'Josilda da Conceição Gallery, Amsterdam, NL' },
        { _key: 'e9', _type: 'entry', year: '2016', label: 'Bright Side Gallery, Amsterdam, NL' },
        { _key: 'e10', _type: 'entry', year: '2015', label: 'Walls Gallery, Amsterdam, NL' },
        { _key: 'e11', _type: 'entry', year: '2014', label: 'Majke Hüsstege, Den Bosch, NL' },
      ],
    },
    {
      _key: 's5', _type: 'cvSection',
      title: 'TenFifteen — Art fairs (selection)',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2017', label: '6voor6 Art Fair, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2014', label: 'The Great Last Minute Art Fair, Rotterdam, NL' },
      ],
    },
    {
      _key: 's6', _type: 'cvSection',
      title: 'The Social Media Project — Solo presentations',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2022', label: 'Torch Gallery, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2020', label: 'Strayfield Gallery, Copenhagen, DK' },
        { _key: 'e3', _type: 'entry', year: '2018', label: 'Torch Gallery, Amsterdam, NL' },
        { _key: 'e4', _type: 'entry', year: '2018', label: 'Amsterdam Central Station, Amsterdam, NL' },
        { _key: 'e5', _type: 'entry', year: '2016', label: '30Works Gallery, Cologne, DE' },
        { _key: 'e6', _type: 'entry', year: '2015', label: 'Walls Gallery, Amsterdam, NL' },
        { _key: 'e7', _type: 'entry', year: '2014', label: 'Majke Hüsstege, Den Bosch, NL' },
        { _key: 'e8', _type: 'entry', year: '2012', label: 'Walls Gallery, Amsterdam, NL' },
      ],
    },
    {
      _key: 's7', _type: 'cvSection',
      title: 'The Social Media Project — Art fairs (selection)',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2024', label: 'NAP+, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2022', label: 'Unseen Amsterdam, NL' },
        { _key: 'e3', _type: 'entry', year: '2017', label: '6voor6 Art Fair, Amsterdam, NL' },
        { _key: 'e4', _type: 'entry', year: '2016', label: 'This Art Fair, Amsterdam, NL' },
        { _key: 'e5', _type: 'entry', year: '2015', label: 'This Art Fair, Amsterdam, NL' },
        { _key: 'e6', _type: 'entry', year: '2015', label: 'KunstRAI, Amsterdam, NL' },
        { _key: 'e7', _type: 'entry', year: '2014', label: 'PAN Amsterdam, NL' },
      ],
    },
    {
      _key: 's8', _type: 'cvSection',
      title: 'The Social Media Project — Group exhibitions (selection)',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2024', label: '40Y Torch Gallery, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2022', label: 'Luxfer & Lípa, Česká Skalice, CZ' },
        { _key: 'e3', _type: 'entry', year: '2022', label: 'Caesuur & Lípa, Middelburg, NL' },
        { _key: 'e4', _type: 'entry', year: '2020', label: 'Strayfield Gallery, Hellerup, DK' },
        { _key: 'e5', _type: 'entry', year: '2018', label: 'Arti et Amicitiae, Amsterdam, NL' },
        { _key: 'e6', _type: 'entry', year: '2017', label: 'Josilda da Conceição Gallery, Amsterdam, NL' },
        { _key: 'e7', _type: 'entry', year: '2016', label: 'Bright Side Gallery, Amsterdam, NL' },
        { _key: 'e8', _type: 'entry', year: '2015', label: 'Schau Fenster Gallery, Berlin, DE' },
        { _key: 'e9', _type: 'entry', year: '2015', label: 'FB69 Gallery, Münster, DE' },
        { _key: 'e10', _type: 'entry', year: '2014', label: 'Walls Gallery, Amsterdam, NL' },
        { _key: 'e11', _type: 'entry', year: '2013', label: 'Flaxon Ptootch, London, UK' },
      ],
    },
    {
      _key: 's9', _type: 'cvSection',
      title: 'The Social Media Project — Special projects (selection)',
      entries: [
        { _key: 'e1', _type: 'entry', year: '2018', label: 'ODAM, Amsterdam, NL' },
        { _key: 'e2', _type: 'entry', year: '2016', label: 'OFFF by Night, Antwerp, BE' },
        { _key: 'e3', _type: 'entry', year: '2013', label: 'Nuit Blanche, Amsterdam, NL' },
        { _key: 'e4', _type: 'entry', year: '2013', label: 'FOAM, Amsterdam, NL' },
      ],
    },
  ],
  publications: [
    { _key: 'p1', _type: 'publication', title: 'The Zine Project', year: '2021–2025', description: 'Zine Nº1–10 (Annemarijn, Girls in Paris, Janna, Cats & Dogs, Mexico, Claudia, 12.5Y, The Warsaw SAGA, A.S.I.A., TenFifteen)', isbn: '9789082111347' },
    { _key: 'p2', _type: 'publication', title: 'My Name Is Sander Dekker — Volume 2', isbn: '9789082111330' },
    { _key: 'p3', _type: 'publication', title: 'My Name Is Sander Dekker — Volume 1.5', isbn: '9789082111323' },
    { _key: 'p4', _type: 'publication', title: 'My Name Is Sander Dekker — Volume 1', isbn: '9789082111316' },
  ],
  press: [
    'Het Parool (29-06-2018, 15-06-2018, 17-12-2016, 05-12-2014)',
    'De Volkskrant (30-11-2019, 07-11-2015)',
    'BLINK Korea',
    'CODE Magazine',
    'Juxtapoz',
    'Le Petit Voyeur',
    'Lodown Magazine',
    'Purple France',
    'Snoecks',
    'VICE Creators',
    'VICE Magazine',
    'Gallery Viewer (2023, 2025)',
    'ABC Video',
  ],
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function run() {
  // Strip image refs without real asset IDs
  aboutDoc.quotes = aboutDoc.quotes.map(q => {
    const { image, ...rest } = q
    return rest
  })

  console.log('Seeding aboutPage...')
  await client.createOrReplace(aboutDoc)
  console.log('✓ aboutPage')

  console.log('Seeding cvPage...')
  await client.createOrReplace(cvDoc)
  console.log('✓ cvPage')

  console.log('Done.')
}

run().catch(err => { console.error(err); process.exit(1) })
