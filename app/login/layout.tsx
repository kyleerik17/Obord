import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = pageMetadata('Connexion', 'Connecte-toi ou crée un compte pour réserver une rencontre O’BORD.')

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
