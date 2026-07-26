'use client'

import { useState } from 'react'

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const QUOTES = [
  {
    name: 'Marloes van Vugt',
    role: 'foreword',
    publication: 'My Name Is Sander Dekker Nº.2',
    image: `${BASE}/2020/04/Front-1.jpg`,
    quote: '"While embracing his own strangeness, he makes a true connection with his models. It\'s what makes his work so very appealing."',
    article: `Josilda da Conceição Gallery in Amsterdam is presenting the solo exhibition 'Girls in Paris' with work by Sander Dekker. The introverted Dutch photographer takes raw and real photos of the people he encounters on social media. He captures them in ways that give them a significant degree of agency, a certain autonomy over the way they are represented.

The Dutch photographer travels all over the world for his photographs. He captured hundreds of people that he usually only knows through social media, often quite unique and eccentric people. This results in surprising and energetic images that are unexpectedly vulnerable. The people in his photos look relaxed and not a single element appears forced. The authenticity of his photos contrasts beautifully with the artificiality of the idealised ways in which we present ourselves on social media. Dekker worked as an art director in the fashion industry for a while, but his autonomous work is far from that. He does not want to make fashion spreads with a certain studio quality. He prefers an external flash, a 33mm wide-angle lens, short shoots and an essential combination of humour, spontaneity and improvisation.

What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves. That in itself is an achievement, but Dekker's characters are often naked women. Yet the photographer does not resort to tiring, beautiful pictures that are mainly intended for the entertainment of straight men. Instead, he seems to capture their personality in an effective and intimate way, that spark that makes them so unique.

While embracing his own strangeness, he makes a true connection with his models. It's what makes his work so very appealing. So goodbye to trying to be real; I hope you will acknowledge your stranger somewhere in this book.

– Marloes van Vugt`,
  },
  {
    name: 'Flor Linckens',
    role: 'review',
    publication: 'Gallery Viewer',
    image: `${BASE}/2023/11/Josilda-4.jpg`,
    quote: '"What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves."',
    article: `Josilda da Conceição Gallery in Amsterdam is presenting the solo exhibition 'Girls in Paris' with work by Sander Dekker. The introverted Dutch photographer takes raw and real photos of the people he encounters on social media. He captures them in ways that give them a significant degree of agency, a certain autonomy over the way they are represented.

The Dutch photographer travels all over the world for his photographs. He captured hundreds of people that he usually only knows through social media, often quite unique and eccentric people. This results in surprising and energetic images that are unexpectedly vulnerable. The people in his photos look relaxed and not a single element appears forced.

To understand why Dekker's portraits of women in particular are so interesting, it is necessary to take a closer look at the term the male gaze: a term that has frequently determined the discourse since the 1970s. The term was first introduced by Laura Mulvey in Visual Pleasure and Narrative Cinema (1975). In this influential essay, the American film theorist analysed the representation of women in Hollywood. Female characters in these films were usually presented from a heterosexual male perspective.

Dekker seems to break with these boring, reductive and stereotypical representations of the female presenting body. What makes his work so remarkable is the individuality and autonomy of his characters: they refuse to relinquish their power and above all: they seem to be unapologetically themselves. That in itself is an achievement, but Dekker's characters are often naked women. Yet the photographer does not resort to tiring, beautiful pictures that are mainly intended for the entertainment of straight men. Instead, he seems to capture their personality in an effective and intimate way, that spark that makes them so unique.

– Flor Linckens`,
  },
  {
    name: 'Margot Pol',
    role: 'interview',
    publication: 'de Volkskrant',
    image: `${BASE}/2026/01/DSCF0794.jpg`,
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
    name: 'Edo Dijksterhuis',
    role: 'article',
    publication: 'Het Parool',
    image: `${BASE}/2026/01/DSCF6743.jpg`,
    quote: '"Net als Arbus, Clark en Sultan is Sander Dekker een kind van zijn tijd."',
    article: `My Name is Sander Dekker doet onherroepelijk denken aan Diane Arbus. De in 1971 overleden New Yorkse fotografeerde dwergen, nudisten, transgenders en circusvolk. Ze gaf een gezicht aan mensen in de marge, die als freak werden beschouwd. Met keihard flitslicht zette zij ze haarscherp neer, niet altijd even flatteus. Met haar werk gaf Arbus de documentairefotografie een duw in een nieuwe richting.

Net als Arbus, Clark en Sultan is Sander Dekker een kind van zijn tijd. Hij zoekt zijn modellen niet in smoezelige achterbuurten maar doet research op internet. Op sociale media stuit hij bijvoorbeeld op een getatoeëerde bodybuilder met een voorliefde voor accordeon of een jonge schilder die woont en werkt in een bouwvallig fabriekspand. Hij stuurt ze een berichtje, springt in het vliegtuig en staat dan 'out of the blue' voor de deur van wildvreemden.

Dekkers fotosessies duren een tot anderhalf uur. Er is niets voorbereid. De fotograaf doet het met wat en wie hij aantreft. Het gaat om de magie en chemie van het moment. Het is als een blind date met camera.

The Project is de verzamelnaam van de foto's die Dekker sinds 2011 maakt en waarvan een deel nu te zien is bij Torch. Er is veel expliciet bloot te zien. De portretten ogen als kruising tussen geënsceneerde fotografie en snapshots, het consequent gebruik van zwart-wit knipoogt weer naar de documentairetraditie.

Maar het grote verschil met de outcasts die Arbus vastlegde en daarmee emancipeerde, is dat Dekkers modellen geen enkele behoefte hebben aan normalisering en acceptatie. Zij dragen hun 'freak'-button met trots. Zij wentelen zich in hun niche, etaleren hem. In het Instagramtijdperk lijken sensatie en schaamte verdwenen en bestaat enkel nog exposure.

– Edo Dijksterhuis (Het Parool)`,
  },
]

function QuoteItem({ q }: { q: typeof QUOTES[0] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="about-quote">
      <div className="about-quote-header">
        {q.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image} alt={q.name} className="about-quote-img" />
        )}
        <div className="about-quote-meta">
          <p className="about-quote-name">
            <strong>{q.name}</strong> — {q.role}, <em>{q.publication}</em>
          </p>
          <p className="about-quote-text">{q.quote}</p>
        </div>
      </div>
      <button
        className="about-quote-toggle"
        onClick={() => setOpen(o => !o)}
      >
        Read article <span>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="about-quote-article">
          {q.article.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AboutPage() {
  return (
    <>
      <h1 className="project-title">About</h1>

      <div className="about-bio">
        <p>Sander Dekker (1980) is an Amsterdam-based artist working with photography, installation, video and publications. His work documents how people present themselves — to each other, to cameras, and to the world they construct around themselves.</p>
        <p>His practice is rooted in The Social Media Project, a decade-long series of encounters with strangers photographed in their own homes after first contact online. It caught something specific: a brief moment when reaching out to a stranger on social media felt open, easy and charged with possibility. That openness is slowly fleeing. What remains is a document of a particular kind of human behaviour that feels increasingly rare.</p>
        <p>The questions that project raised have continued to drive everything since — through installations, handmade publications, participatory work and projects centred on people who push back against external pressure simply by being fully, visibly themselves.</p>
      </div>

      <h2 className="section-title">Selected Quotes</h2>

      <div className="about-quotes">
        {QUOTES.map(q => (
          <QuoteItem key={q.name} q={q} />
        ))}
      </div>
    </>
  )
}
