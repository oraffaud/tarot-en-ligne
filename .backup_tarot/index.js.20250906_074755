import Head from 'next/head'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

export default function Home() {
  const cards = ['Le Mat', 'Le Magicien', 'La Papesse', "L'Impératrice", "L'Empereur"]

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 to-violet-700 text-white">
      <Head>
        <title>Arcana — Tarot en ligne</title>
        <meta name="description" content="Tirage de tarot en ligne & lecture premium" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <section className="grid md:grid-cols-2 gap-8 items-center py-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Tirez les cartes, éclairez votre chemin</h1>
            <p className="mb-6 text-violet-100">Tirage instantané gratuit. Pour une lecture détaillée et personnalisée, cliquez sur Lecture Premium.</p>
            <div className="flex gap-3">
              <button onClick={() => location.reload()} className="bg-white/10 px-4 py-2 rounded-lg">Nouveau tirage</button>
              <a href={PAYMENT_LINK} className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold">Lecture Premium — 19€</a>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="space-x-[-40px] flex items-end">
              <TarotCard name={cards[0]} />
              <TarotCard name={cards[1]} />
              <TarotCard name={cards[2]} />
            </div>
          </div>
        </section>

        <section className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Comment ça marche</h2>
          <ol className="list-decimal list-inside space-y-2 text-violet-100">
            <li>Tirez un tirage gratuit.</li>
            <li>Pour la lecture détaillée, cliquez sur Lecture Premium.</li>
            <li>Vous serez redirigé vers Stripe (Payment Link).</li>
          </ol>
        </section>
      </main>
    </div>
  )
}
