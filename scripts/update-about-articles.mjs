/**
 * update-about-articles.mjs
 *
 * Saves English translations of the Margot Pol and Edo Dijksterhuis articles
 * to the aboutPage quotes in Sanity.
 *
 * - Moves the current Dutch text to `articleNl` (if not already set)
 * - Sets the English translation in `article`
 *
 * Run: node scripts/update-about-articles.mjs
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
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
})

const MARGOT_POL_EN = `Photographer Sander Dekker, himself rather introverted, has a deep admiration for the eccentric characters he encounters on social media. He sought them out — and it clicked.

'I still find it strange myself: that people so effortlessly open up to someone they don't know. And then, after an hour and a half, just say: take care!'

As well as fascinated, photographer Sander Dekker (39) is also grateful. Because every eccentric he photographed over the past seven years, across the world, was a stranger to him. They were nonetheless willing to pose for him, in their own homes. The brief contact they had beforehand usually took place via Instagram or other social media — where Dekker searched for and found them: the energetic outsiders, the free spirits, the artists without inhibition. 'People often wear a mask on social media, but the real eccentrics don't. They're not playing a game.'

And why seek out precisely them? From Tel Aviv to Moscow and Marseille? 'Out of admiration. And also because I looked up to them — hoping some of their qualities might rub off on me, even just a little. I can be quite a hermit, and around people I don't know, I tend to be rather introverted. But sometimes I get tired of myself. And social media is a safe way to do something about that, because I would never just walk up to a stranger on the street.'

Because Dekker only met his subjects when they opened their door — and the shoot that followed had no predetermined plan — the results were often unexpected, energetic images: a little wild, fitting for the freedom of his sitters. The series began in 2011, when Dekker started photographing Amsterdam's colourful characters with his first proper camera. The photographs gained attention, an exhibition at Walls Gallery in Amsterdam followed, and the former graphic designer decided to expand his reach to other countries. 'Those were the golden days of social media: making contact was easy, and nobody thought it strange to be approached. I'd look at which eccentric musician was well known in a particular place, find out who followed them, pick the ones I found interesting, and send them messages — and if they didn't respond, I'd post comments under their photos. That kind of thing could go on for months. It's almost like stalking. Once I had enough candidates in the same country, I'd book a ticket.'

To go in as open as possible, Dekker deliberately kept prior contact to a minimum. 'From the moment someone in Moscow, London or Berlin opened their door, I'd spend an hour and a half shooting quickly and in volume — often without looking through the lens, to create unexpected lines and compositions. That way I could fit in three or four visits in a single day. That kind of fleeting contact might seem superficial — much like social media itself — but I've made friends all over the world from it. And yes, I think it's made me less guarded. I put my work — and myself — out there more.'

But now it's done. With the decline of Facebook and increasingly private accounts on Instagram, people have become far less open on social media, Dekker feels — and after around three hundred intensive lightning visits, some of the charge has gone out of it. Time for something new. A book is still on the way: My name is Sander Dekker 2. 'It's a reflection of the zeitgeist: how normal it has become to show so much of yourself on social media, and how easy it was — or is — to make contact. But I think that in twenty years, when this form of media has disappeared and we may have become hyperprivate, my photographs will be even more interesting.'

— Margot Pol, Volkskrant Magazine`

const EDO_DIJKSTERHUIS_EN = `Send a message, board a plane, click

My Name is Sander Dekker inevitably calls Diane Arbus to mind. The New York photographer, who died in 1971, photographed dwarfs, nudists, transgender people and circus folk. She gave a face to those living on the margins — people considered freaks. With brutal flash light she pinned them down in merciless sharp focus — not always flatteringly. Her work gave documentary photography a shove in a new direction. She started a school. Larry Clark published photobooks about young drug users. Larry Sultan later came with photographs of homes used as sets for pornographic films.

Like Arbus, Clark and Sultan, Sander Dekker is a child of his time. He doesn't seek his subjects in dingy back-street neighbourhoods — he does his research online. On social media he might come across a tattooed bodybuilder with a passion for the accordion, or a young painter who lives and works in a crumbling factory building. He sends them a message, jumps on a plane, and turns up out of the blue on the doorstep of complete strangers.

You only live once

Dekker's shoots last one to one and a half hours. Nothing is prepared. The photographer works with whatever — and whoever — he finds. It's about the magic and chemistry of the moment. Like a blind date with a camera, charged with the exuberant energy of a YOLO party.

The Project is the collective title for the photographs Dekker has been making since 2011, a selection of which is now on show at Torch. There is a lot of explicit nudity. A bare arse sticks out above the bathtub, a girl with an open jacket sits bored in a studio, another poses as a many-armed Hindu goddess. The portraits read as a cross between staged photography and snapshots; the consistent use of black and white winks at the documentary tradition.

But the crucial difference from the outcasts Arbus documented — and in doing so emancipated — is that Dekker's subjects have no need whatsoever for normalisation or acceptance. They wear their 'freak' badge with pride. They wallow in their niche and flaunt it. They may sometimes appear in strange poses, but never unfavourably — as was sometimes the case with Arbus. They are too self-aware for that.

In the Instagram age, sensation and shame seem to have vanished. All that remains is exposure.

— Edo Dijksterhuis, Het Parool`

const page = await client.fetch(`*[_type == "aboutPage"][0]{ _id, quotes[] }`)

if (!page) {
  console.error('No aboutPage document found.')
  process.exit(1)
}

const quotes = page.quotes ?? []
console.log(`\n📄  Found ${quotes.length} quotes\n`)

const updatedQuotes = quotes.map(q => {
  if (q.name === 'Margot Pol') {
    console.log(`  ✅  Updating Margot Pol`)
    return {
      ...q,
      quote: 'It\'s a reflection of the zeitgeist: how normal it has become to show so much of yourself on social media, and how easy it was — or is — to make contact.',
      article: MARGOT_POL_EN,
      articleNl: q.articleNl ?? q.article ?? null,
    }
  }
  if (q.name === 'Edo Dijksterhuis') {
    console.log(`  ✅  Updating Edo Dijksterhuis`)
    return {
      ...q,
      quote: 'Like Arbus, Clark and Sultan, Sander Dekker is a child of his time.',
      article: EDO_DIJKSTERHUIS_EN,
      articleNl: q.articleNl ?? q.article ?? null,
    }
  }
  return q
})

await client.patch(page._id).set({ quotes: updatedQuotes }).commit()
console.log('\n✅  Done.\n')
