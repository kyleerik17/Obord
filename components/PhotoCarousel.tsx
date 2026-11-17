'use client'

import Image from 'next/image'
import { useState } from 'react'

export type CarouselPhoto = { src: string; alt: string }

export default function PhotoCarousel({ photos, label, className = '' }: { photos: CarouselPhoto[]; label: string; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  if (!photos.length) return null

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + photos.length) % photos.length)
  }

  return (
    <section className={`ob-photo-carousel ${className}`} aria-label={label} aria-roledescription="carrousel">
      <div className="ob-photo-carousel-track" aria-live="polite">
        {photos.map((photo, index) => (
          <figure className={`ob-photo-slide${index === activeIndex ? ' is-active' : ''}`} key={`${photo.src}-${index}`} aria-hidden={index !== activeIndex}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 90vw, 720px" priority={index === 0} />
            <figcaption>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </div>
      {photos.length > 1 && <div className="ob-photo-carousel-controls">
        <div className="ob-photo-carousel-dots" role="group" aria-label={label}>{photos.map((photo, index) => <button key={`${photo.src}-dot-${index}`} type="button" aria-label={`${label} ${index + 1}`} aria-current={index === activeIndex} onClick={() => setActiveIndex(index)} />)}</div>
        <div className="ob-photo-carousel-arrows"><button type="button" aria-label="Photo précédente" onClick={() => move(-1)}>←</button><button type="button" aria-label="Photo suivante" onClick={() => move(1)}>→</button></div>
      </div>}
    </section>
  )
}
