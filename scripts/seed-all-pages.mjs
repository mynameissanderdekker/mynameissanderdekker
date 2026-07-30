/**
 * Seed script: all project pages
 *
 * Seeds 8 project pages into Sanity as isPage:true project documents
 * using the pageBuilder block system.
 *
 * Run from the project root:
 *   node scripts/seed-all-pages.mjs
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

const WP = 'https://mynameissanderdekker.com/wp-content/uploads'

// ── Helpers ───────────────────────────────────────────────────────────────────

function block(key, text) {
  return {
    _type: 'block', _key: key, style: 'normal',
    children: [{ _type: 'span', _key: `${key}s`, text }],
  }
}

function textSection(key, paragraphs, width = '8col') {
  return {
    _type: 'textSection', _key: key, width,
    content: paragraphs.map((t, i) => block(`${key}b${i}`, t)),
  }
}

function heroImage(key, imageUrl, alt = '') {
  return { _type: 'heroImage', _key: key, imageUrl, alt }
}

function videoEmbed(key, embedUrl) {
  return { _type: 'videoEmbed', _key: key, embedUrl }
}

function gallery(key, externalUrls, columns = 3) {
  return { _type: 'galleryBlock', _key: key, externalUrls, columns }
}

function pdfViewer(key, pdfUrl) {
  return { _type: 'pdfViewer', _key: key, pdfUrl }
}

function pullQuote(key, text) {
  return { _type: 'pullQuote', _key: key, text }
}

function divider(key) {
  return { _type: 'dividerBlock', _key: key }
}

function imageText(key, imageUrl, paragraphs, layout = '4+8-left') {
  return {
    _type: 'imageText', _key: key, layout,
    image: { _type: 'image' }, // placeholder — no Sanity asset
    content: paragraphs.map((t, i) => block(`${key}b${i}`, t)),
    // We use externalImageUrl as a custom workaround since imageText only supports Sanity images
    // For now: store as caption field note
    caption: imageUrl,
  }
}

// ── Pages ─────────────────────────────────────────────────────────────────────

const pages = [

  // ── #Fun ──────────────────────────────────────────────────────────────────
  {
    _id: 'project-fun',
    _type: 'project',
    title: '#Fun',
    slug: { _type: 'slug', current: 'fun' },
    dateRange: '2015 – present',
    isPage: true,
    order: 10,
    pageBuilder: [
      heroImage('pb-hero', `${WP}/2026/07/sander-dekker-fun-001.jpg`, '#Fun'),
      textSection('pb-intro', [
        'The moment a camera appears, something switches. Smiles widen, poses form, joy becomes demonstrable. It happens almost automatically — a Pavlovian reflex so ingrained that most people don\'t notice they\'re doing it.',
        'Dekker notices. And stays put.',
        '#Fun is a long-term series in which Dekker inserts himself into everyday situations as a completely neutral, expressionless presence. He does not pose. He does not react. While those around him instinctively perform for the lens, Dekker remains still — and in doing so, transforms that instinct into something visible, almost absurd.',
        'He has since taken the work one step further. Dekker had a mask made of his own deadpan face — complete with his long blond hair — and invites others to wear it. The figure who refuses to perform becomes the role everyone else steps into.',
        'The series is ongoing.',
      ]),
      gallery('pb-featured', [
        `${WP}/2026/03/sander-dekker-fun-024.jpg`,
        `${WP}/2026/03/sander-dekker-fun-026.jpg`,
        `${WP}/2026/03/sander-dekker-fun-025.gif`,
      ], 3),
      gallery('pb-gallery', [
        `${WP}/2026/07/sander-dekker-fun-037.jpg`,
        `${WP}/2026/07/sander-dekker-fun-015.jpg`,
        `${WP}/2026/07/sander-dekker-fun-027.jpg`,
        `${WP}/2026/07/sander-dekker-fun-033.jpg`,
        `${WP}/2026/07/sander-dekker-fun-016.jpg`,
        `${WP}/2026/07/sander-dekker-fun-017.jpg`,
        `${WP}/2026/07/sander-dekker-fun-028.jpg`,
        `${WP}/2026/07/sander-dekker-fun-018.jpg`,
        `${WP}/2026/07/sander-dekker-fun-022.jpg`,
        `${WP}/2026/07/sander-dekker-fun-021.jpg`,
        `${WP}/2026/07/sander-dekker-fun-012.jpg`,
        `${WP}/2026/07/sander-dekker-fun-023.jpg`,
        `${WP}/2026/07/sander-dekker-fun-029.jpg`,
        `${WP}/2026/07/sander-dekker-fun-030.jpg`,
        `${WP}/2026/07/sander-dekker-fun-031.jpg`,
        `${WP}/2026/07/sander-dekker-fun-014.jpg`,
        `${WP}/2026/07/sander-dekker-fun-032.jpg`,
        `${WP}/2026/07/sander-dekker-fun-013.jpg`,
        `${WP}/2026/07/sander-dekker-fun-011.jpg`,
        `${WP}/2026/07/sander-dekker-fun-010.jpg`,
        `${WP}/2026/07/sander-dekker-fun-009.jpg`,
        `${WP}/2026/07/sander-dekker-fun-008.jpg`,
        `${WP}/2026/07/sander-dekker-fun-007.jpg`,
        `${WP}/2026/07/sander-dekker-fun-006.jpg`,
        `${WP}/2026/07/sander-dekker-fun-005.jpg`,
        `${WP}/2026/07/sander-dekker-fun-003.jpg`,
        `${WP}/2026/07/sander-dekker-fun-002.jpg`,
        `${WP}/2026/07/sander-dekker-fun-036.jpg`,
        `${WP}/2026/07/sander-dekker-fun-034.jpg`,
        `${WP}/2026/07/sander-dekker-fun-035.jpg`,
      ], 3),
    ],
  },

  // ── Innate Curiosity ──────────────────────────────────────────────────────
  {
    _id: 'project-innate-curiosity',
    _type: 'project',
    title: 'Innate Curiosity',
    slug: { _type: 'slug', current: 'innate-curiosity' },
    dateRange: '2026 –',
    isPage: true,
    order: 20,
    pageBuilder: [
      heroImage('pb-hero', `${WP}/2026/07/Innate-Curiosity.jpg`, 'Innate Curiosity'),
      textSection('pb-intro', [
        'Growing up without a phone meant finding your own way to see the world. You had to seek things out. You had to be resourceful. You had to take risks — and sometimes get caught.',
        'Through the gap in the blinds. Through a steamed-up bathroom window. Through a peephole in a door. These were the instruments of a pre-algorithmic curiosity. Physical, embodied, slightly transgressive. The thrill was inseparable from the effort.',
        'That impulse — to look, to wonder, to find things out for yourself — is what Innate Curiosity is about. Not nostalgia for a simpler time, but a question about what happens to curiosity when it is no longer necessary. When the algorithm anticipates your interests before you have formed them. When discovery is served rather than earned.',
        'The works in this series invite the viewer back into that earlier mode. Objects that ask you to lean in, to reach, to look for yourself. The discomfort is part of it. So is the reward.',
        'Dekker was born in 1980, the last generation to grow up entirely without the internet. He approaches this not as a technophobe but as a witness. What do we lose when we stop looking for ourselves?',
      ]),
      // Works as imageText blocks
      {
        _type: 'imageText', _key: 'pb-work1', layout: '4+8-left',
        image: { _type: 'image' },
        caption: `${WP}/2026/07/Innate-Curiosity-The-Peek%E2%80%94V1.jpg`,
        content: [
          block('w1t', 'V1 The Peek — blinds, 2026'),
          block('w1d', 'A closed set of aluminium venetian blinds mounted to the wall, with a backlit photograph behind them. To see anything, the viewer has to open the blinds by hand, come closer, find the right angle. The image rewards effort and punishes the casual glance.'),
        ],
      },
      {
        _type: 'imageText', _key: 'pb-work2', layout: '4+8-left',
        image: { _type: 'image' },
        caption: `${WP}/2026/07/Innate-Curiosity-The-Find%E2%80%94V1-1.jpg`,
        content: [
          block('w2t', 'V1 The Find — wastebin with Whisper, 2026'),
          block('w2d', 'A Dutch railway wastebin. Inside, among period debris, a brown paper bag contains Whisper — a fictional 1980s adult magazine, entirely handmade by the artist, indistinguishable from the source material of its time. To see it, the viewer must reach into the bin and lift it out.'),
        ],
      },
      {
        _type: 'imageText', _key: 'pb-work3', layout: '4+8-left',
        image: { _type: 'image' },
        caption: `${WP}/2026/07/Innate-Curiosity-The-Trace%E2%80%94V1.jpg`,
        content: [
          block('w3t', 'V1 The Trace — chair with traces, 2026'),
          block('w3d', 'A white plastic garden chair with a charging cable resting on the seat. On the floor beside it, a pair of binoculars and a classic plastic tray of fries. Someone was here. He is not anymore.'),
        ],
      },
    ],
  },

  // ── It Is Us ──────────────────────────────────────────────────────────────
  {
    _id: 'project-it-is-us',
    _type: 'project',
    title: 'It Is Us',
    slug: { _type: 'slug', current: 'it-is-us' },
    dateRange: 'A body beyond perfection.',
    isPage: true,
    order: 30,
    pageBuilder: [
      heroImage('pb-hero', `${WP}/2026/01/Use.jpg`, 'It Is Us'),
      textSection('pb-intro', [
        'People are invited to anonymously photograph a part of their body they feel strongly about — something they are proud of, or something they usually hide. A scar, a birthmark, an uneven body part, a detail shaped by time or experience. The choice is entirely theirs.',
        'Nothing is directed, corrected or filtered. The photographs are printed on site and gradually brought together to form collective bodies — each one composed of many individual images, creating a shared presence built from difference. Character emerges through contrast: confidence next to doubt, vulnerability alongside strength.',
        'The outcome is always a surprise. As the bodies take shape, they often provoke recognition, curiosity and a quiet sense of humour. Not because they are perfect, but because they feel familiar in unexpected ways.',
        'It Is Us responds to the dominant ideas of perfection that saturate social media — not with an idealised image, but with a body that reflects who we are collectively: marked, uneven, personal and human. Not an image of who we could become, but a recognition of who we already are.',
      ]),
      gallery('pb-gallery', [
        `${WP}/2026/01/05.jpg`,
        `${WP}/2026/01/ezgif-11bc24516138084f.gif`,
      ], 2),
    ],
  },

  // ── TenFifteen ────────────────────────────────────────────────────────────
  {
    _id: 'project-tenfifteen',
    _type: 'project',
    title: 'TenFifteen — The Social Landscape',
    slug: { _type: 'slug', current: 'tenfifteen' },
    dateRange: '2014 – present',
    isPage: true,
    order: 40,
    pageBuilder: [
      videoEmbed('pb-video', 'https://player.vimeo.com/video/331591561?autoplay=0&title=0&byline=0&portrait=0'),
      textSection('pb-intro', [
        'TenFifteen grew directly out of The Social Media Project — not as a sequel, but as a shift in perspective. Where that project looked at individuals, this one looks at the stream itself.',
        'Thousands of black-and-white photographs, each measuring ten by fifteen centimetres — hence the name — are presented side by side in a large-scale installation. Individually the images are intimate and personal. Together they become something else: an overwhelming, fragmented landscape that mirrors the endless flow of images we scroll through every day.',
        'The installation has no single story to tell. Like social media itself, it is abundant, subjective and impossible to take in all at once. Viewers are invited to move through it freely, to pause where something catches their eye, and to consider their own relationship to the images in front of them — and to the images they share themselves.',
      ]),
      gallery('pb-gallery', [
        `${WP}/2021/09/image-8.jpeg`,
        `${WP}/2021/09/image-9.jpeg`,
        `${WP}/2021/09/image-10.jpeg`,
        `${WP}/2022/09/TenFifteen.gif`,
        `${WP}/2021/09/image-11.jpeg`,
        `${WP}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-10.jpg`,
        `${WP}/2021/09/image-12.jpeg`,
      ], 3),
    ],
  },

  // ── The Social Media Project ──────────────────────────────────────────────
  {
    _id: 'project-the-social-media-project',
    _type: 'project',
    title: 'The Social Media Project',
    slug: { _type: 'slug', current: 'the-social-media-project' },
    dateRange: '2011 – 2021',
    isPage: true,
    order: 50,
    pageBuilder: [
      videoEmbed('pb-video', 'https://player.vimeo.com/video/234703292?autoplay=0&title=0&byline=0&portrait=0'),
      textSection('pb-intro', [
        'Between 2011 and 2021, Dekker contacted strangers he had never met through social media — a tattooed bodybuilder with a passion for accordion, a young painter living in a derelict factory — and asked to photograph them in their own homes. No preparation, no research, no plan. He got on a plane, knocked on the door, and worked with whatever and whoever he found.',
        'The sessions lasted an hour, sometimes less. What happened in front of the camera was simply what happened — shaped by the energy of two strangers meeting for the first time, with all the awkwardness, openness and occasional magic that brings.',
        'Looking back, the project documents something that no longer quite exists: a moment when social media made contact between strangers feel easy, natural and full of possibility. The people Dekker encountered were unapologetically themselves — no interest in being normalised, no need for validation.',
        'Dekker could still send that message today. But something has shifted. People present themselves more carefully now, more strategically — and sometimes barely at all, hiding behind images and personas that owe more to algorithms than to lived experience. In an era where even identity can be generated, the spontaneous, unguarded openness he encountered then feels harder to find.',
      ]),
      divider('pb-divider'),
      pullQuote('pb-quote', 'Ten years. A dozen countries. Hundreds of messages sent to strangers. These are some of the people who said yes.'),
      // Story galleries
      gallery('pb-sasha', [`${WP}/2026/07/1.jpg`, `${WP}/2026/07/2.jpg`, `${WP}/2026/07/3.jpg`], 3),
      textSection('pb-sasha-text', ['Sasha — Moscow, RU. Botox lips, a pumped-up body, 200 hours of tattoos by a single artist, and a feminine style of clothing. Easy to have preconceptions. Hard to look past. But at his apartment, Sasha lives a quiet life with his wife Masya and their dogs Ricci and Jason. His look comes down to one simple question: why are women allowed to make themselves beautiful, but men cannot? In Russia, that question has consequences. Despite his masculine build, it isn\'t always safe for him to go outside alone. He knows this. He goes anyway.']),
      gallery('pb-anastasia', [`${WP}/2026/07/5X8B7328-e1783438358222.jpg`, `${WP}/2026/07/5X8B7680.jpg`], 2),
      textSection('pb-anastasia-text', ['Anastasia — Moscow, RU. Anastasia became champion figure skater of Moscow. The doors to success were wide open — until puberty arrived and her breasts began to grow. Her coach gave her two options: stop skating or take hormone blockers. The medication had the opposite effect, and could not be reversed. It didn\'t stop her. Anastasia is now a coach, a role model, and a source of positive energy for the next generation of champions.']),
      gallery('pb-natalia', [`${WP}/2026/07/5X8B8679-e1783438337341.jpg`], 2),
      textSection('pb-natalia-text', ['Natalia — Moscow, RU. She replied, which made me even more excited to meet her. I traveled to her studio, north of Moscow in an abandoned military plant. She opened the door beaming and full of energy. While she rearranged the paintings in her atelier for our shoot, she told me she has always been the odd one out: in her family, in school, and even in the art world. With hardly any commercial galleries in Moscow, being a young artist is especially hard. With no money for materials, she paints on anything she can find: old packaging, pieces of wood, found canvas. She often even sleeps in the complex, on a shelf in the storage system, to save money on housing.']),
      gallery('pb-berno', [`${WP}/2026/07/5X8B9181-e1783438319499.jpg`], 2),
      textSection('pb-berno-text', ['Berno — New York City, US. Berno grew up in Newkirk Plaza, Brooklyn, and never really left. The neighborhood knows him — the buildings, the people, the corner spots. His grandmother\'s house is his house now, and the memories live on in the photographs and knickknacks scattered throughout his apartment. He\'s never exactly fit in, with his shiny jacket, jewelry, and gold teeth. But here, he can be himself. In 2019 he released his first single. On the wall of his apartment, in his own handwriting: Keep going mofo.']),
      gallery('pb-yulia', [`${WP}/2026/07/5X8B1725-e1783438392520.jpg`, `${WP}/2026/07/5X8B1721-e1783438422176.jpg`, `${WP}/2026/07/5X8B1722-e1783438402203.jpg`], 3),
      textSection('pb-yulia-text', ['Yuliya — Moscow, RU. Yuliya opened the door a little shy and giggly — mostly because she doesn\'t speak English. So I followed her around and let her lead. Her muscular, athletic body moved through the apartment with ease and energy. She went to the kitchen, grabbed a drink, and showered me with soda. Then gave me that look — the one a kid gives when they\'re not quite sure if they\'re in trouble. When she grabbed a fire extinguisher, I recognized it again. The powder filled the room before I could get the shot. We laughed hard.']),
      gallery('pb-tessian', [`${WP}/2026/07/IMG_0842.jpg`], 2),
      textSection('pb-tessian-text', ['Tess & Ian — London, UK. On the night of my London vernissage, I noticed a yellow Rolls-Royce parked outside — hand-painted with a red flower pattern. The owner, Ian, was as eccentric as his car. That same evening I met Tess, who had come with a mutual friend. The next day we went to Ian\'s canal boat. After a brief chat, I asked if he had something for Tess to wear. He reached into nowhere and pulled out a green bodysuit.']),
      gallery('pb-samia', [`${WP}/2026/07/5X8B5413-e1783438382498.jpg`, `${WP}/2026/07/5X8B5323-e1783438371133.jpg`], 2),
      textSection('pb-samia-text', ['Samia — New York City, US. When Samia opened the door, I instantly fell in love with her energy and her smile. Born in Sudan during wartime, she and her sister had to take care of themselves from an early age. After moving through several other war-torn countries, she found her way to America — and to a modeling career. That hard-won freedom radiates from every frame.']),
      gallery('pb-anthony', [`${WP}/2026/07/5X8B3307.jpg`], 2),
      textSection('pb-anthony-text', ['Anthony — Brooklyn, US. This is Anthony with Otto, in front of a portrait of Anthony\'s mother — painted by Anthony himself. His mother is gone. So is his husband. Otto is the last living connection to the love they shared. The photo was taken in his Brooklyn home. It is, in a way, a family portrait of a life that exists mostly in the past now — parties with Andy Warhol, Lady Divine, and his friend David Hodo, the construction worker of the Village People.']),
      // Spin wheel
      {
        _type: 'spinWheel', _key: 'pb-spin',
        coverImage: `${WP}/2026/04/Spinwheel-V3.jpg`,
        images: ['01','02','03','04','05','07','09','11','12','13','14','15','16','17','18',
          '20','21','22','23','25','26','27','28','30','31','32','33','34','37','39',
          '40','42','43','44','45','48','50','51','55','56','57','58','59','60','61',
          '62','63','64','66','68','69','70','71','72','73','74','75','76','77','78','79',
        ].map(n => `${WP}/2026/02/%C2%A9-Sander-Dekker-${n}.jpg`),
      },
      gallery('pb-post-spin', [
        `${WP}/2021/09/image-2.jpeg`,
        `${WP}/2021/09/image-4.jpeg`,
        `${WP}/2021/09/image-5.jpeg`,
        `${WP}/2021/09/image-7.jpeg`,
      ], 2),
    ],
  },

  // ── Girls in Paris ────────────────────────────────────────────────────────
  {
    _id: 'project-girls-in-paris',
    _type: 'project',
    title: 'Girls in Paris',
    slug: { _type: 'slug', current: 'girls-in-paris' },
    dateRange: 'Exhibition · Josilda da Conceição Gallery, Amsterdam · 2022',
    isPage: true,
    order: 60,
    pageBuilder: [
      heroImage('pb-hero', `${WP}/2026/01/girls-in-paris-%C2%A9sander-dekker-05.jpg`, 'Girls in Paris'),
      textSection('pb-intro', [
        'The exhibition features stories and photographs of eight Girls in Paris, who are challenging the status quo and deconstructing paradigms. Dekker\'s journey began when he was commissioned to create a feminist calendar in France. To his surprise, he discovered that France still has a significant gap between men and women, with domestic violence against women often downplayed and not taken seriously. This realization prompted him to pack his bags and head back to Paris to meet and photograph women who are part of a new generation — a wave of strong women challenging the status quo and deconstructing paradigms.',
        'The result of his journey is an exhibition that showcases these women\'s stories and their struggles for self-expression, equality, and sexuality. The photographs are accompanied by excerpts from the conversations, printed on transparent canvases that shield the works, requiring visitors to read them first before viewing the photos. This presentation is a snapshot of what drives them, the conservative thinking they face, and the controversies that arise from it. Through their beautiful struggle, they are instigating their own kind of French Revolution.',
        '— This exhibition originated from the Zine project.',
      ]),
      pdfViewer('pb-pdf', 'https://mynameissanderdekker.com/wp-content/uploads/2025/11/Girls-in-Paris-1.pdf'),
      gallery('pb-gallery', [
        `${WP}/2026/01/girls-in-paris-%C2%A9sander-dekker-cover-e1777915768154.jpg`,
        `${WP}/2026/01/girls-in-paris-%C2%A9sander-dekker-01.jpg`,
        `${WP}/2026/01/girls-in-paris-%C2%A9sander-dekker-02.jpg`,
        `${WP}/2026/01/girls-in-paris-%C2%A9sander-dekker-03.jpg`,
        `${WP}/2026/01/girls-in-paris-%C2%A9sander-dekker-04.jpg`,
      ], 3),
    ],
  },

  // ── The Warsaw SAGA ───────────────────────────────────────────────────────
  {
    _id: 'project-warsaw-saga',
    _type: 'project',
    title: 'The Warsaw SAGA',
    slug: { _type: 'slug', current: 'warsaw-saga' },
    dateRange: 'June 2024 · Edition of 40',
    isPage: true,
    order: 70,
    pageBuilder: [
      heroImage('pb-hero', `${WP}/2026/05/DSC04034.jpg`, 'The Warsaw SAGA'),
      textSection('pb-intro', [
        'I came across an article that highlighted Poland as the worst country for LGBTQ+ individuals within the EU. It stuck with me, and I couldn\'t shake it off. While many European countries are progressing towards greater freedom and equality, Poland seems to be moving in the opposite direction.',
        'Motivated by this, I decided to visit Warsaw and shine a light on the brave people who stay true to themselves despite the hatred around them. I named my project \'THE WARSAW SAGA,\' a fitting title that stands for Sexuality And Gender Acceptance and embodies the stories I aim to tell.',
        'Armed with my camera, I set out to create a photo series showcasing people who embrace their authenticity despite the hostility. Their portraits focus on self-expression, equality, and sexuality, emphasizing joy and liberation. The stories that accompany their portraits not only show the challenges they face, but also the resilience they draw from these challenges to effect change.',
        'This project is dedicated to breaking down barriers and creating a future where everyone\'s SAGA is valued, one story at a time.',
      ]),
      pdfViewer('pb-pdf', 'https://mynameissanderdekker.com/wp-content/uploads/2025/08/No8-The-Warsaw-SAGA.pdf'),
      gallery('pb-gallery', [
        `${WP}/2026/05/IMG_0145-edit.jpg`,
        `${WP}/2026/05/IMG_0376-edit.jpg`,
        `${WP}/2026/05/IMG_0162-edit.jpg`,
        `${WP}/2026/05/IMG_0113-edit.jpg`,
      ], 2),
    ],
  },

  // ── A.S.I.A. ─────────────────────────────────────────────────────────────
  {
    _id: 'project-asia',
    _type: 'project',
    title: 'A.S.I.A.',
    slug: { _type: 'slug', current: 'asia' },
    dateRange: 'February 2025 · Edition of 40',
    isPage: true,
    order: 80,
    pageBuilder: [
      heroImage('pb-hero', `${WP}/2026/05/IMG_2887-Edit.jpg`, 'A.S.I.A.'),
      textSection('pb-intro', [
        '60 pages, hand-stitched coptic binding, sleeve cover, 15×21cm. Signed, numbered and with original print.',
        'A.S.I.A. — Addressing Structural Inequalities in Amsterdam — was born close to home. Despite Amsterdam\'s reputation for tolerance and openness, racism against people of Asian descent remains a quiet but persistent reality in the Netherlands — one that rarely receives the attention it deserves.',
        'The project centres on seven individuals with Asian heritage who unapologetically embrace their own identity, using self-expression to challenge stereotypes — directly and indirectly. They are not presented as victims of discrimination, but as people who have turned visibility into a form of resistance.',
      ]),
      pdfViewer('pb-pdf', 'https://mynameissanderdekker.com/wp-content/uploads/2025/07/No9-Asia.pdf'),
      gallery('pb-gallery', [
        `${WP}/2026/05/9.jpg`,
        `${WP}/2026/05/L1000018-edit.jpg`,
        `${WP}/2026/05/IMG_0420.jpg`,
      ], 3),
    ],
  },
]

// ── Run ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`🌱 Seeding ${pages.length} project pages...\n`)
  for (const page of pages) {
    try {
      await client.createOrReplace(page)
      console.log(`✅ ${page.title}`)
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`)
    }
  }

  console.log('\n📋 Done! Pages now in Sanity:')
  pages.forEach(p => console.log(`   • ${p.title} → /projects/${p.slug.current}`))

  console.log('\n🗑  Once verified in browser, delete these static routes:')
  const slugs = pages.map(p => p.slug.current)
  slugs.forEach(s => console.log(`   src/app/(site)/projects/${s}/page.tsx`))
}

seed()
