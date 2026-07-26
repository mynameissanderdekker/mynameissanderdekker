/* eslint-disable @next/next/no-img-element */
import SpinWheel from '@/components/SpinWheel'

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

// 61 images for the SpinWheel — the full 2026/02 series
const SPIN_NUMBERS = [
  '01','02','03','04','05','07','09','11','12','13','14','15','16','17','18',
  '20','21','22','23','25','26','27','28','30','31','32','33','34','37','39',
  '40','42','43','44','45','48','50','51','55','56','57','58','59','60','61',
  '62','63','64','66','68','69','70','71','72','73','74','75','76','77','78','79',
]
const SPIN_IMAGES = SPIN_NUMBERS.map(
  (n) => `${BASE}/2026/02/%C2%A9-Sander-Dekker-${n}.jpg`
)

const STORIES = [
  {
    name: 'Sasha',
    location: 'Moscow, RU',
    images: [
      `${BASE}/2026/07/1.jpg`,
      `${BASE}/2026/07/2.jpg`,
      `${BASE}/2026/07/3.jpg`,
    ],
    text: "Botox lips, a pumped-up body, 200 hours of tattoos by a single artist, and a feminine style of clothing. Easy to have preconceptions. Hard to look past.\n\nBut at his apartment, Sasha lives a quiet life with his wife Masya and their dogs Ricci and Jason. His look comes down to one simple question: why are women allowed to make themselves beautiful, but men cannot?\n\nIn Russia, that question has consequences. Despite his masculine build, it isn't always safe for him to go outside alone. He knows this. He goes anyway.",
  },
  {
    name: 'Anastasia',
    location: 'Moscow, RU',
    images: [
      `${BASE}/2026/07/5X8B7328-e1783438358222.jpg`,
      `${BASE}/2026/07/5X8B7680.jpg`,
    ],
    text: "Anastasia became champion figure skater of Moscow. The doors to success were wide open — until puberty arrived and her breasts began to grow. Her coach gave her two options: stop skating or take hormone blockers. The medication had the opposite effect, and could not be reversed.\n\nIt didn't stop her. Anastasia is now a coach, a role model, and a source of positive energy for the next generation of champions. Which is desperately needed in this ice-cold skating scene.",
  },
  {
    name: 'Natalia',
    location: 'Moscow, RU',
    images: [
      `${BASE}/2026/07/5X8B8679-e1783438337341.jpg`,
    ],
    dm: { handle: '@_ova_ng', text: 'This is exactly what I need!', avatar: `${BASE}/2026/07/5X8B8679-e1783438337341.jpg`, afterIntro: 'Natalia was the first person I contacted for my trip to Moscow.' },
    text: "She replied, which made me even more excited to meet her. I traveled to her studio, north of Moscow in an abandoned military plant. She opened the door beaming and full of energy. While she rearranged the paintings in her atelier for our shoot, she told me she has always been the odd one out: in her family, in school, and even in the art world. With hardly any commercial galleries in Moscow, being a young artist is especially hard.\n\nWith no money for materials, she paints on anything she can find: old packaging, pieces of wood, found canvas. She often even sleeps in the complex, on a shelf in the storage system, to save money on housing. Art is her reason to live and she's fully committed to it. Her dedication and enthusiasm were infectious, and I followed her through the building like a puppy in love.",
  },
  {
    name: 'Berno',
    location: 'New York City, US',
    images: [
      `${BASE}/2026/07/5X8B9181-e1783438319499.jpg`,
    ],
    text: "Berno grew up in Newkirk Plaza, Brooklyn, and never really left. The neighborhood knows him — the buildings, the people, the corner spots. His grandmother's house is his house now, and the memories live on in the photographs and knickknacks scattered throughout his apartment.\n\nHe's never exactly fit in, with his shiny jacket, jewelry, and gold teeth. But here, he can be himself. In 2019 he released his first single. On the wall of his apartment, in his own handwriting: Keep going mofo.",
  },
  {
    name: 'Yulia',
    location: 'Moscow, RU',
    images: [
      `${BASE}/2026/07/5X8B1725-e1783438392520.jpg`,
      `${BASE}/2026/07/5X8B1721-e1783438422176.jpg`,
      `${BASE}/2026/07/5X8B1722-e1783438402203.jpg`,
    ],
    text: "Yuliya opened the door a little shy and giggly — mostly because she doesn't speak English. So I followed her around and let her lead. Her muscular, athletic body moved through the apartment with ease and energy.\n\nShe went to the kitchen, grabbed a drink, and showered me with soda. Then gave me that look — the one a kid gives when they're not quite sure if they're in trouble. When she grabbed a fire extinguisher, I recognized it again. The powder filled the room before I could get the shot. We laughed hard.",
  },
  {
    name: 'Tess & Ian',
    location: 'London, UK',
    images: [
      `${BASE}/2026/07/IMG_0842.jpg`,
    ],
    text: "On the night of my London vernissage, I noticed a yellow Rolls-Royce parked outside — hand-painted with a red flower pattern. The owner, Ian, was as eccentric as his car. That same evening I met Tess, who had come with a mutual friend.\n\nThe next day we went to Ian's canal boat. After a brief chat, I asked if he had something for Tess to wear. He reached into nowhere and pulled out a green bodysuit.",
  },
  {
    name: 'Samia',
    location: 'New York City, US',
    images: [
      `${BASE}/2026/07/5X8B5413-e1783438382498.jpg`,
      `${BASE}/2026/07/5X8B5323-e1783438371133.jpg`,
    ],
    text: 'When Samia opened the door, I instantly fell in love with her energy and her smile. Born in Sudan during wartime, she and her sister had to take care of themselves from an early age. After moving through several other war-torn countries, she found her way to America — and to a modeling career. That hard-won freedom radiates from every frame.',
  },
  {
    name: 'Anthony',
    location: 'Brooklyn, US',
    images: [
      `${BASE}/2026/07/5X8B3307.jpg`,
    ],
    text: "This is Anthony with Otto, in front of a portrait of Anthony's mother — painted by Anthony himself. His mother is gone. So is his husband. Otto is the last living connection to the love they shared.\n\nThe photo was taken in his Brooklyn home. It is, in a way, a family portrait of a life that exists mostly in the past now — parties with Andy Warhol, Lady Divine, and his friend David Hodo, the construction worker of the Village People.",
  },
]

const POST_SPIN_GALLERY = [
  `${BASE}/2021/09/image-2.jpeg`,
  `${BASE}/2021/09/image-4.jpeg`,
  `${BASE}/2021/09/image-5.jpeg`,
  `${BASE}/2021/09/image-7.jpeg`,
]

export default function SocialMediaProjectPage() {
  return (
    <>
      <div className="project-video">
        <iframe
          src="https://player.vimeo.com/video/234703292?autoplay=0&title=0&byline=0&portrait=0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      <h1 className="project-title">The Social Media Project</h1>
      <p className="project-date">2011 – 2021</p>

      <div className="project-intro">
        <p>Between 2011 and 2021, Dekker contacted strangers he had never met through social media — a tattooed bodybuilder with a passion for accordion, a young painter living in a derelict factory — and asked to photograph them in their own homes. No preparation, no research, no plan. He got on a plane, knocked on the door, and worked with whatever and whoever he found.</p>
        <p>The sessions lasted an hour, sometimes less. What happened in front of the camera was simply what happened — shaped by the energy of two strangers meeting for the first time, with all the awkwardness, openness and occasional magic that brings.</p>
        <p>Looking back, the project documents something that no longer quite exists: a moment when social media made contact between strangers feel easy, natural and full of possibility. The people Dekker encountered were unapologetically themselves — no interest in being normalised, no need for validation.</p>
        <p>Dekker could still send that message today. But something has shifted. People present themselves more carefully now, more strategically — and sometimes barely at all, hiding behind images and personas that owe more to algorithms than to lived experience. In an era where even identity can be generated, the spontaneous, unguarded openness he encountered then feels harder to find.</p>
      </div>

      <hr className="project-divider" />

      <h2 className="project-pull-quote">
        Ten years. A dozen countries. Hundreds of messages sent to strangers. These are some of the people who said yes.
      </h2>

      {STORIES.map((story) => (
        <div key={story.name} className="project-story">
          {story.images.length > 0 && (
            <div className={`story-images story-images-${story.images.length}`}>
              {story.images.map((src) => (
                <img key={src} src={src} alt={story.name} />
              ))}
            </div>
          )}
          <div className="project-story-text">
            <h3 className="story-name">
              <strong>{story.name}</strong> <span className="story-location">— <em>{story.location}</em></span>
            </h3>
            {'dm' in story && story.dm ? (
              <>
                <p>{(story.dm as {afterIntro:string}).afterIntro}</p>
                <div className="story-dm">
                  <img src={(story.dm as {avatar:string}).avatar} alt={(story.dm as {handle:string}).handle} className="story-dm-avatar" />
                  <div className="story-dm-bubble">
                    <strong>{(story.dm as {handle:string}).handle}</strong>: {(story.dm as {text:string}).text}
                  </div>
                </div>
                {story.text.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </>
            ) : (
              story.text.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))
            )}
          </div>
        </div>
      ))}

      <div className="project-spin">
        <SpinWheel
          images={SPIN_IMAGES}
          coverImage={`${BASE}/2026/04/Spinwheel-V3.jpg`}
        />
      </div>

      <div className="project-gallery" style={{ marginTop: '48px' }}>
        {POST_SPIN_GALLERY.map((src) => (
          <img key={src} src={src} alt="The Social Media Project" />
        ))}
      </div>
    </>
  )
}
