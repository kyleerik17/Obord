import Link from 'next/link'
import Image from 'next/image'
import { organizers } from '@/lib/data/site'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata('Les organisateurs', 'Rencontre les organisateurs du collectif O’BORD à Grand-Bassam.')

export default function Organisateurs() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-poppins text-4xl font-semibold tracking-tight text-center mb-4 text-gray-950">
          Nos Organisateurs
        </h1>
        <p className="font-inter text-xl text-center mb-12 text-gray-600">
          Malick Mockey, Ange Erik et Aurore — le collectif derrière O’BORD.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {organizers.map((org, index) => (
            <div key={index} className="soft-card rounded-xl overflow-hidden">
              <div className="relative flex h-64 items-center justify-center overflow-hidden border-b border-line bg-gray-100">
                {org.photo ? <Image src={org.photo} alt={`Portrait de ${org.name}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-[center_25%]" /> : <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white font-poppins text-2xl font-semibold text-gray-900 shadow-sm">{org.initials}</span>}
              </div>
              <div className="p-6">
                <h2 className="font-poppins text-2xl font-semibold mb-2 text-gray-950">{org.name}</h2>
                <p className="font-inter text-gray-500 font-semibold mb-4">{org.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
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
