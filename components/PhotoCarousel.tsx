'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

export type CarouselPhoto = { src: string; alt: string }

export default function PhotoCarousel({ photos, label, className = '' }: { photos: CarouselPhoto[]; label: string; className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const [pausedByUser, setPausedByUser] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    if (photos.length < 2 || isHovered || hasFocus || pausedByUser || reducedMotion) return
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % photos.length), 5000)
    return () => window.clearInterval(timer)
  }, [hasFocus, isHovered, pausedByUser, photos.length, reducedMotion])

  if (!photos.length) return null

  return (
    <section className={`ob-photo-carousel ${className}`} aria-label={label} aria-roledescription="carrousel" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onFocusCapture={() => setHasFocus(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false) }}>
      <div className="ob-photo-carousel-track" aria-live="off">
        {photos.map((photo, index) => (
          <figure className={`ob-photo-slide${index === activeIndex ? ' is-active' : ''}`} key={`${photo.src}-${index}`} aria-hidden={index !== activeIndex}>
            <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 700px) 90vw, 720px" priority={index === 0} />
            <figcaption>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </div>
      {photos.length > 1 && <div className="ob-photo-carousel-controls">
        <div className="ob-photo-carousel-dots" role="group" aria-label={label}>{photos.map((photo, index) => <button key={`${photo.src}-dot-${index}`} type="button" aria-label={`${label} ${index + 1}`} aria-current={index === activeIndex} onClick={() => setActiveIndex(index)} />)}</div>
        <div className="ob-photo-carousel-arrows"><button type="button" aria-label="Photo précédente" onClick={() => setActiveIndex((activeIndex - 1 + photos.length) % photos.length)}>←</button><button type="button" aria-label={pausedByUser || reducedMotion ? 'Reprendre le défilement des photos' : 'Mettre le défilement des photos en pause'} onClick={() => setPausedByUser((paused) => !paused)}>{pausedByUser || reducedMotion ? '▶' : 'Ⅱ'}</button><button type="button" aria-label="Photo suivante" onClick={() => setActiveIndex((activeIndex + 1) % photos.length)}>→</button></div>
      </div>}
    </section>
  )
}
