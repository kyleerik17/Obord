import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/metadata'
import AccountDashboard from '@/components/AccountDashboard'

export const metadata: Metadata = {
  ...pageMetadata('Mon espace', 'Retrouve tes informations et le suivi de tes réservations O’BORD.'),
  robots: { index: false, follow: false },
}

export default function MemberSpacePage() {
  return <AccountDashboard />
}
