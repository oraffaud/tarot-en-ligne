import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'
import { MAJOR_ARCANA } from '../lib/marseilleDeck'

export default function Jeu() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 to-violet-700 text-white">
      <Head>
        <title>Contrôle du jeu — Tarot de Marseille — Les tarots de Nanou</title>
      </Head>
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Arcanes majeurs — Tarot de Marseille</h1>
          <p className="text-violet-100 mb-2">
            Jeu de contrôle : 22 arcanes majeurs selon l’ordre du Tarot de Marseille.
          </p>
          <p className="text-sm text-violet-200">
            Images : Tarot de Marseille de Jean Dodal, Lyon, début XVIIIe siècle, reproductions du domaine public via Wikimedia Commons.
          </p>
          <Link href="/" className="inline-block mt-4 underline">← Retour au tirage</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {MAJOR_ARCANA.map((card, index) => (
            <div key={card.name} className="flex justify-center">
              <TarotCard
                name={card.name}
                meaning={{ up: card.up, rev: card.rev }}
                index={index}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
