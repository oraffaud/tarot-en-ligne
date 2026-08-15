import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'
import { MAJOR_ARCANA } from '../lib/marseilleDeck'
import LiveChatPromo from '../components/LiveChatPromo'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function drawOne() {
  return shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx })))[0]
}

function freeReading(card, lang) {
  if (!card) return null

  const french = {
    title: `${card.name} vient à votre rencontre`,
    opening: `Cette carte éclaire un mouvement déjà présent autour de votre question. Elle ne donne pas une réponse figée : elle vous invite à regarder autrement ce qui cherche à se faire entendre.`,
    message: `${card.up}. Dans votre situation, ${card.name} suggère qu’un élément essentiel mérite d’être reconnu avant d’aller plus loin.`,
    mirror: `Si vous cessiez un instant de chercher la “bonne” réponse, qu’est-ce que votre intuition vous dirait en premier ?`,
    hidden: `Une seule carte révèle l’énergie du moment. Elle ne montre pas encore ce qui influence la situation, ce que vous ne voyez pas encore, ni la direction possible du chemin.`
  }

  const english = {
    title: `${card.name} has come forward`,
    opening: `This card illuminates a movement already present around your question. It does not give a fixed answer: it invites you to look differently at what is asking to be heard.`,
    message: `${card.up}. In your situation, ${card.name} suggests that something essential deserves to be acknowledged before you go further.`,
    mirror: `If you stopped searching for the “right” answer for a moment, what would your intuition tell you first?`,
    hidden: `One card reveals the energy of the moment. It does not yet show what is influencing the situation, what remains unseen, or where the path may lead.`
  }

  return lang === 'en' ? english : french
}

export default function Home() {
  const router = useRouter()
  const lang = router.query.lang === 'en' ? 'en' : 'fr'

  const [question, setQuestion] = useState('')
  const [step, setStep] = useState(1)
  const [card, setCard] = useState(null)
  const [error, setError] = useState('')

  const reading = freeReading(card, lang)

  function beginDraw() {
    if (!question.trim()) {
      setError(lang === 'en'
        ? 'Write the question you would like to entrust to the cards.'
        : 'Écrivez la question que vous souhaitez confier aux cartes.')
      return
    }
    setError('')
    setStep(2)
    setTimeout(() => {
      setCard(drawOne())
      setStep(3)
    }, 900)
  }

  function restart() {
    setQuestion('')
    setCard(null)
    setStep(1)
    setError('')
  }

  function goPremium() {
    const params = new URLSearchParams({
      question: question.trim(),
      lang
    })
    if (card?.name) params.set('fromCard', card.name)
    router.push(`/premium?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white">
      <Head>
        <title>{lang === 'en' ? "Nanou’s Tarot — Your free card" : 'Les tarots de Nanou — Votre carte du jour'}</title>
        <meta
          name="description"
          content={lang === 'en'
            ? 'Ask a question and discover the Tarot de Marseille card that comes forward for you.'
            : 'Posez votre question et découvrez l’arcane du Tarot de Marseille qui vient à votre rencontre.'}
        />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <Header />

      <main className="max-w-5xl mx-auto px-5 md:px-6 pb-20">
        {step === 1 && (
          <section className="max-w-3xl mx-auto text-center pt-14 md:pt-20">
            <div className="text-3xl mb-4">☾ ✦ ☽</div>
            <div className="text-xs uppercase tracking-[0.30em] text-amber-100/65">
              {lang === 'en' ? 'Your first sign' : 'Votre premier éclairage'}
            </div>

            <h1 className="text-4xl md:text-6xl font-serif mt-4 leading-tight">
              {lang === 'en'
                ? 'A question is on your mind?'
                : 'Une question vous accompagne ?'}
            </h1>

            <p className="mt-5 max-w-2xl mx-auto text-violet-100/90 leading-8 text-lg">
              {lang === 'en'
                ? 'Take a few seconds. Think of a situation, a person or a choice that occupies your mind. When you are ready, entrust your question to the cards.'
                : 'Prenez quelques secondes. Pensez à une situation, une personne ou un choix qui occupe votre esprit. Lorsque vous êtes prêt, confiez votre question aux cartes.'}
            </p>

            <div className="mt-10 rounded-[28px] bg-white/[0.055] border border-white/10 p-6 md:p-8 shadow-2xl text-left">
              <label className="block text-sm uppercase tracking-[0.18em] text-violet-300 mb-3">
                {lang === 'en' ? 'Your question' : 'Votre question'}
              </label>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                className="w-full rounded-2xl p-5 text-violet-950 min-h-[150px] shadow-inner text-lg"
                placeholder={lang === 'en'
                  ? 'What would you like to understand or illuminate today?'
                  : 'Qu’aimeriez-vous comprendre ou éclairer aujourd’hui ?'}
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">
                  {error}
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={beginDraw}
                  className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition"
                >
                  {lang === 'en' ? 'Entrust my question to the cards ✦' : 'Confier ma question aux cartes ✦'}
                </button>
              </div>
            </div>

            <p className="mt-6 text-sm text-violet-400">
              {lang === 'en'
                ? 'One free Tarot de Marseille card · no account required'
                : 'Un arcane du Tarot de Marseille offert · sans création de compte'}
            </p>
          </section>
        )}

        {step === 2 && (
          <section className="max-w-3xl mx-auto text-center pt-20 md:pt-28">
            <div className="text-4xl animate-pulse">✦</div>
            <h2 className="text-3xl md:text-4xl font-serif mt-6">
              {lang === 'en' ? 'The cards are listening…' : 'Les cartes vous écoutent…'}
            </h2>
            <p className="mt-4 text-violet-200 leading-8">
              {lang === 'en'
                ? 'Keep your question in mind for a moment.'
                : 'Gardez votre question à l’esprit quelques instants.'}
            </p>
          </section>
        )}

        {step === 3 && card && reading && (
          <section className="max-w-4xl mx-auto pt-10 md:pt-14">
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.28em] text-amber-100/65">
                {lang === 'en' ? 'Your card' : 'Votre carte'}
              </div>
              <h1 className="text-3xl md:text-5xl font-serif mt-3">
                {reading.title}
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-violet-200 leading-8">
                {reading.opening}
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="animate-[fadeIn_.7s_ease-out]">
                <TarotCard
                  name={card.name}
                  meaning={{ up: card.up, rev: card.rev }}
                  index={card.idx}
                />
              </div>
            </div>

            <div className="mt-8 max-w-3xl mx-auto rounded-[28px] bg-white/[0.055] border border-white/10 p-6 md:p-8 shadow-xl">
              <div className="text-xs uppercase tracking-[0.20em] text-violet-300">
                {lang === 'en' ? 'For your question' : 'Pour votre question'}
              </div>
              <p className="mt-3 text-lg leading-8 text-violet-50">
                {reading.message}
              </p>

              <div className="mt-6 rounded-2xl bg-amber-100/[0.06] border border-amber-100/15 p-5">
                <div className="text-xs uppercase tracking-[0.20em] text-amber-100/70">
                  {lang === 'en' ? 'The question your card reflects back to you' : 'La question que votre carte vous renvoie'}
                </div>
                <p className="mt-3 font-serif italic text-xl leading-8">
                  « {reading.mirror} »
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-3xl mx-auto rounded-[28px] border border-amber-100/20 bg-gradient-to-b from-amber-100/[0.07] to-white/[0.03] p-6 md:p-8 text-center">
              <div className="text-xl">✦</div>
              <h2 className="text-2xl md:text-3xl font-serif mt-3">
                {lang === 'en'
                  ? 'Your card has opened a first door'
                  : 'Votre carte a ouvert une première porte'}
              </h2>

              <p className="mt-4 text-violet-200 leading-8">
                {reading.hidden}
              </p>

              <div className="grid md:grid-cols-3 gap-3 mt-7 text-left">
                {[
                  lang === 'en' ? 'What influences you' : 'Ce qui vous influence',
                  lang === 'en' ? 'What remains unseen' : 'Ce que vous ne voyez pas encore',
                  lang === 'en' ? 'Where the situation may lead' : 'Vers quoi la situation peut évoluer'
                ].map((label) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-5">
                    <div className="h-24 rounded-xl bg-gradient-to-b from-white/10 to-white/[0.02] flex items-center justify-center text-2xl text-white/30">
                      ✦
                    </div>
                    <div className="mt-3 text-sm text-violet-200">{label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={goPremium}
                className="mt-8 bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition"
              >
                {lang === 'en' ? 'Deepen my reading ✦' : 'Approfondir mon tirage ✦'}
              </button>

              <p className="mt-4 text-sm text-violet-400">
                {lang === 'en'
                  ? 'Your question will be carried into the Premium reading.'
                  : 'Votre question sera conservée pour poursuivre la lecture Premium.'}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button onClick={restart} className="text-sm underline text-violet-300">
                {lang === 'en' ? 'Ask another question' : 'Poser une autre question'}
              </button>
              <a href="/jeu" className="text-sm underline text-violet-300">
                {lang === 'en' ? 'View the Tarot de Marseille deck' : 'Voir le jeu du Tarot de Marseille'}
              </a>
            </div>

            <div className="mt-10">
              <LiveChatPromo />
            </div>
          </section>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
