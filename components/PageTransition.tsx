'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'

function isInternalNavigableLink(target: HTMLAnchorElement | null): target is HTMLAnchorElement {
  if (!target) return false
  if (target.target && target.target !== '_self') return false
  if (target.hasAttribute('download')) return false
  if (target.dataset.noProgress === 'true') return false

  const url = new URL(target.href)
  return url.origin === window.location.origin && url.href !== window.location.href
}

export default function PageTransition() {
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const timer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  const exitTimer = useRef<number | null>(null)
  const startedAt = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const start = () => {
    if (timer.current) window.clearInterval(timer.current)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    if (exitTimer.current) window.clearTimeout(exitTimer.current)
    startedAt.current = performance.now()
    setLeaving(false)
    setVisible(true)
    setProgress(8)
    timer.current = window.setInterval(() => {
      setProgress((current) => (current < 88 ? Math.min(88, current + Math.max(1, Math.round((88 - current) * 0.075))) : current))
    }, 180)
  }

  const finish = () => {
    if (startedAt.current === null) return
    if (timer.current) window.clearInterval(timer.current)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    const elapsed = performance.now() - startedAt.current
    hideTimer.current = window.setTimeout(() => {
      setProgress(100)
      setLeaving(true)
      exitTimer.current = window.setTimeout(() => {
        setVisible(false)
        setLeaving(false)
        setProgress(0)
        startedAt.current = null
      }, 320)
    }, Math.max(0, 2680 - elapsed))
  }

  useEffect(() => {
    finish()
    return () => {
      if (timer.current) window.clearInterval(timer.current)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      if (exitTimer.current) window.clearTimeout(exitTimer.current)
    }
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }

      const target = (event.target as Element | null)?.closest<HTMLAnchorElement>('a') ?? null
      if (target?.hash && target.pathname === window.location.pathname) {
        event.preventDefault()
        const destination = document.getElementById(decodeURIComponent(target.hash.slice(1)))
        if (!destination) return

        destination.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
        destination.classList.remove('section-arriving')
        window.requestAnimationFrame(() => destination.classList.add('section-arriving'))
        window.setTimeout(() => destination.classList.remove('section-arriving'), 800)
        window.history.replaceState(null, '', target.href)
        return
      }
      if (!isInternalNavigableLink(target)) return

      event.preventDefault()
      target.classList.add('is-activating')
      window.setTimeout(() => target.classList.remove('is-activating'), 420)
      start()
      startTransition(() => {
        const url = new URL(target.href)
        router.push(`${url.pathname}${url.search}${url.hash}`)
      })
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [router])

  if (!visible) return null

  return (
    <div className={`page-transition${leaving ? ' is-leaving' : ''}`} role="progressbar" aria-label="Ouverture de la page" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <span className="page-transition-bloom" />
      <span className="page-transition-mark"><Image src="/obord-logo.png" alt="" width={74} height={74} priority /></span>
      <span className="page-transition-wave" aria-hidden="true"><span style={{ width: `${progress}%` }} /></span>
      <span className="page-transition-caption" aria-hidden="true">On se retrouve juste après</span>
      <span className="sr-only">Chargement {progress}%</span>
    </div>
  )
}
