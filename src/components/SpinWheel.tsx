'use client'

import { useState, useRef } from 'react'

interface SpinWheelProps {
  images: string[]
  coverImage?: string
}

// Degrees the button rotates per frame step — constant per step means
// angular velocity scales with image speed automatically (fast frames = fast rotation)
const DEG_PER_STEP = 18

export default function SpinWheel({ images, coverImage }: SpinWheelProps) {
  const [displayImg, setDisplayImg] = useState<string | null>(null)
  const [spinning, setSpinning] = useState(false)
  const spinningRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const btnRef = useRef<HTMLButtonElement>(null)
  const angleRef = useRef(0)

  const rotateTo = (deg: number) => {
    if (btnRef.current) {
      btnRef.current.style.transform = `translate(-50%, 50%) rotate(${deg}deg)`
    }
  }

  const spin = () => {
    if (spinningRef.current || images.length === 0) return
    spinningRef.current = true
    setSpinning(true)

    if (timerRef.current) clearTimeout(timerRef.current)

    const FRAMES = 28
    const finalImg = images[Math.floor(Math.random() * images.length)]

    let frame = 0
    let idx = Math.floor(Math.random() * images.length)

    const step = () => {
      const t = frame / (FRAMES - 1)

      // Same easing as before: fast → decelerate
      let delay: number
      if (t < 0.6) {
        delay = 38 + Math.random() * 20
      } else {
        const s = (t - 0.6) / 0.4
        delay = 58 + s * s * 420
      }

      // Advance image
      idx = (idx + 1) % images.length
      setDisplayImg(images[idx])

      // Rotate button by fixed amount — angular velocity matches frame rate
      angleRef.current += DEG_PER_STEP
      rotateTo(angleRef.current)

      frame++

      if (frame < FRAMES) {
        timerRef.current = setTimeout(step, delay)
      } else {
        // Final pause then snap to chosen image — button stays where it stopped
        timerRef.current = setTimeout(() => {
          setDisplayImg(finalImg)
          spinningRef.current = false
          setSpinning(false)
          // Button keeps its current angle — no reset
        }, 480)
      }
    }

    step()
  }

  return (
    <div className="spinwheel-wrapper">
      <div className="spinwheel-stage">
        {!displayImg ? (
          <div
            className="spinwheel-cover"
            style={
              coverImage
                ? { backgroundImage: `url(${coverImage})` }
                : undefined
            }
          >
            {!coverImage && (
              <span className="spinwheel-cover-text">
                Spin the wheel for a random photo
              </span>
            )}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImg}
            alt="Random photo"
            className={`spinwheel-img${spinning ? ' is-spinning' : ''}`}
          />
        )}
      </div>
      <button
        ref={btnRef}
        className={`spinwheel-btn${spinning ? ' is-spinning' : ''}`}
        onClick={spin}
        disabled={spinning}
      >
        Spin
      </button>
    </div>
  )
}
