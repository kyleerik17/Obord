import type { ReactNode } from 'react'

export default function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="trust-page">
      <header className="trust-hero trust-hero-compact">
        <p className="eyebrow eyebrow-dark">O’BORD · INFORMATIONS</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <article className="trust-content legal-content">{children}</article>
    </div>
  )
}
