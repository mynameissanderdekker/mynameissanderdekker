/* eslint-disable @next/next/no-img-element */

const BASE = 'https://mynameissanderdekker.com/wp-content/uploads'

const IMAGES = [
  `${BASE}/2021/09/image-8.jpeg`,
  `${BASE}/2021/09/image-9.jpeg`,
  `${BASE}/2021/09/image-10.jpeg`,
  `${BASE}/2022/09/TenFifteen.gif`,
  `${BASE}/2021/09/image-11.jpeg`,
  `${BASE}/2025/04/Birds-of-Paradise-%C2%A9Sander-dekker-10.jpg`,
  `${BASE}/2021/09/image-12.jpeg`,
]

export default function TenFifteenPage() {
  return (
    <>
      <div className="project-video">
        <iframe
          src="https://player.vimeo.com/video/331591561?autoplay=0&title=0&byline=0&portrait=0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      <h1 className="project-title">TenFifteen — The Social Landscape</h1>
      <p className="project-date">2014 – present</p>

      <div className="project-intro">
        <p>TenFifteen grew directly out of The Social Media Project — not as a sequel, but as a shift in perspective. Where that project looked at individuals, this one looks at the stream itself.</p>
        <p>Thousands of black-and-white photographs, each measuring ten by fifteen centimetres — hence the name — are presented side by side in a large-scale installation. Individually the images are intimate and personal. Together they become something else: an overwhelming, fragmented landscape that mirrors the endless flow of images we scroll through every day.</p>
        <p>The installation has no single story to tell. Like social media itself, it is abundant, subjective and impossible to take in all at once. Viewers are invited to move through it freely, to pause where something catches their eye, and to consider their own relationship to the images in front of them — and to the images they share themselves.</p>
      </div>

      <div className="project-gallery">
        {IMAGES.map((src) => (
          <img key={src} src={src} alt="TenFifteen installation" />
        ))}
      </div>
    </>
  )
}
