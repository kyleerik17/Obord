import Link from 'next/link'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Lieux de rencontre', 'Informations sur les lieux de rencontre du collectif O’BORD à Grand-Bassam.')

export default function Lieu() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-poppins text-4xl font-semibold tracking-tight text-center mb-4 text-gray-950">
          Les lieux de rencontre
        </h1>
        <p className="font-inter text-xl text-center mb-12 text-gray-600">
          Le point de rendez-vous habituel d’O’BORD est Bamboo Blanc, dans le quartier France à Grand-Bassam.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="soft-card rounded-xl p-8">
            <h2 className="font-poppins text-2xl font-semibold mb-4 text-gray-950">Le lieu de la sortie</h2>
            <p className="font-inter text-gray-600 mb-6">
              Retrouvons-nous à Bamboo Blanc, quartier France, Grand-Bassam. Consulte la fiche de chaque rencontre pour les éventuelles précisions pratiques.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <span className="font-inter font-semibold">Lieu :</span>
                <span className="font-inter ml-2">Bamboo Blanc, quartier France</span>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-inter font-semibold">Autour du rendez-vous :</span>
                <span className="font-inter ml-2">rencontre, jeux, repas et boissons</span>
              </div>
            </div>
          </div>

          <div className="soft-card flex items-center justify-center rounded-xl bg-gray-950 p-8 text-white">
            <div className="text-center">
              <p className="font-poppins text-xl font-semibold">Bamboo Blanc</p>
              <p className="font-inter text-sm text-gray-300 mt-2">Quartier France · Grand-Bassam</p>
              <a className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4" href="https://www.google.com/maps/search/?api=1&query=Bamboo+Blanc%2C+Quartier+France%2C+Grand-Bassam" target="_blank" rel="noopener noreferrer">Voir sur Google Maps ↗</a>
            </div>
          </div>
        </div>

        <div className="soft-card mb-12 rounded-xl p-8">
          <h2 className="font-poppins mb-3 text-2xl font-semibold text-gray-950">Un moment à partager</h2>
          <p className="font-inter text-gray-600">Les sorties réunissent activités, jeux, repas et boissons. Les détails pratiques sont communiqués avec les informations du rendez-vous.</p>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="font-poppins text-gray-700 hover:text-gray-950 font-semibold"
          >
            ← Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
