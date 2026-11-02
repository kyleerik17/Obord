'use client'

import { useState } from 'react'

const prompts = [
  'Quel petit plaisir rend ta semaine meilleure ?',
  'Si ton humeur était un jeu, lequel serait-ce ?',
  'Quelle activité te fait oublier l’heure ?',
  'Tu choisis : plage au coucher du soleil ou soirée jeux ?',
  'Quelle règle inventerais-tu pour un jeu sans perdant ?',
  'Quel talent inutile aimerais-tu maîtriser ?',
  'Quel personnage fictif inviterais-tu à la table ?',
  'C’est quoi, pour toi, une sortie vraiment réussie ?',
]

export default function TeamIcebreaker() {
  const [index, setIndex] = useState(0)
  function drawPrompt() {
    setIndex((current) => {
      const next = Math.floor(Math.random() * (prompts.length - 1))
      return next >= current ? next + 1 : next
    })
  }

  return <aside className="team-icebreaker" aria-live="polite">
    <span className="team-icebreaker-icon" aria-hidden="true">✦</span>
    <div><p className="event-practical-label">PETIT BRÛLE-GLACE</p><h3>{prompts[index]}</h3><p>Une question légère à lancer quand la conversation démarre doucement.</p></div>
    <button type="button" onClick={drawPrompt}>Une autre question ↗</button>
  </aside>
}
