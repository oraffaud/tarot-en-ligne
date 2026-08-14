import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'
import { MAJOR_ARCANA } from '../lib/marseilleDeck'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const drawCards = (count) =>
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx }))).slice(0, count)

function Stepper({ step, lang }) {
  const steps = lang === 'en'
    ? ['Intention', 'Spread', 'Revelation', 'Reading']
    : ['Intention', 'Tirage', 'Révélation', 'Lecture']

  return (
    <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto mb-9">
      {steps.map((label, i) => {
        const n = i + 1
        const active = step === n
        const done = step > n
        return (
          <div key={label} className="text-center">
            <div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center border ${
              active
                ? 'bg-amber-200 text-violet-950 border-amber-100 shadow-lg'
                : done
                  ? 'bg-white text-violet-950 border-white'
                  : 'bg-white/5 text-white/50 border-white/10'
            }`}>
              {done ? '✓' : n}
            </div>
            <div className={`mt-2 text-[11px] md:text-sm ${active ? 'text-amber-100' : 'text-violet-300'}`}>
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Premium() {
  const [step, setStep] = useState(1)
  const [question, setQuestion] = useState('')
  const [count, setCount] = useState(3)
  const [cards, setCards] = useState([])
  const [lang, setLang] = useState('fr')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const reading = result?.parsed

  function continueFromQuestion() {
    if (!question.trim()) {
      setError(lang === 'en'
        ? 'Please take a moment to write the question you wish to entrust to the cards.'
        : 'Prenez un instant pour écrire la question que vous souhaitez confier aux cartes.')
      return
    }
    setError('')
    setStep(2)
  }

  function performSpread() {
    setCards(drawCards(count))
    setResult(null)
    setError('')
    setStep(3)
  }

  async function revealReading() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/premium/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cards.slice(0, count),
          question,
          lang,
          consent
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.detail || data?.error || 'API error')
      }

      const data = await res.json()
      setResult(data)
      setStep(4)
      setTimeout(() => {
        document.getElementById('premium-reading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    } catch (e) {
      setError(lang === 'en'
        ? 'The reading could not be revealed. Please try again in a moment.'
        : 'La lecture n’a pas pu être révélée. Merci de réessayer dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  function restart() {
    setStep(1)
    setQuestion('')
    setCards([])
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white">
      <Head>
        <title>{lang === 'en' ? "Premium Reading — Nanou’s Tarot" : 'Lecture Premium — Les tarots de Nanou'}</title>
        <meta
          name="description"
          content={lang === 'en'
            ? 'A private Tarot de Marseille reading in four ritual steps.'
            : 'Une lecture privée du Tarot de Marseille en quatre temps.'}
        />
      </Head>

      <Header />

      <main className="max-w-5xl mx-auto px-5 md:px-6 pb-20">
        <section className="text-center pt-10 pb-5">
          <div className="text-3xl mb-3">☾ ✦ ☽</div>
          <div className="text-xs uppercase tracking-[0.30em] text-amber-100/65">
            {lang === 'en' ? 'Private premium reading' : 'Lecture Premium privée'}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif mt-4">
            {lang === 'en' ? 'Enter your reading' : 'Entrez dans votre tirage'}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-violet-100/90 leading-8">
            {lang === 'en'
              ? 'Take a quiet moment. Hold what matters to you in mind, then let the ritual unfold one step at a time.'
              : 'Prenez un instant au calme. Gardez à l’esprit ce qui compte pour vous, puis laissez le rituel se dérouler, étape après étape.'}
          </p>

          <div className="mt-5">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="text-violet-950 rounded-full px-4 py-2"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>
        </section>

        <Stepper step={step} lang={lang} />

        {step === 1 && (
          <section className="max-w-3xl mx-auto rounded-[28px] bg-white/[0.055] border border-white/10 p-7 md:p-10 shadow-2xl">
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-100/65">
                {lang === 'en' ? 'Your intention' : 'Votre intention'}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif mt-3">
                {lang === 'en'
                  ? 'What would you like to entrust to the cards?'
                  : 'Que souhaitez-vous confier aux cartes ?'}
              </h2>
              <p className="mt-4 text-violet-200 leading-7 max-w-2xl mx-auto">
                {lang === 'en'
                  ? 'There is nothing to draw yet. Begin only with your question. Let it be sincere, simple and close to what you truly wish to understand.'
                  : 'Aucune carte n’est encore tirée. Commencez seulement par votre question. Qu’elle soit sincère, simple et proche de ce que vous souhaitez réellement comprendre.'}
              </p>
            </div>

            <div className="mt-8">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-2xl p-5 text-violet-950 min-h-[170px] shadow-inner text-lg"
                rows={6}
                placeholder={lang === 'en'
                  ? 'Write your question here…'
                  : 'Écrivez votre question ici…'}
              />
            </div>

            <label className="text-sm flex items-start gap-2 mt-5 text-violet-300">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                {lang === 'en'
                  ? 'I consent to anonymized storage of this exchange to improve the service.'
                  : 'J’accepte l’enregistrement anonymisé de cet échange afin d’améliorer le service.'}
              </span>
            </label>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">
                {error}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={continueFromQuestion}
                className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition"
              >
                {lang === 'en' ? 'Open the spread ✦' : 'Ouvrir le tirage ✦'}
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="max-w-3xl mx-auto rounded-[28px] bg-white/[0.055] border border-white/10 p-7 md:p-10 shadow-2xl">
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-100/65">
                {lang === 'en' ? 'The intention is set' : 'L’intention est posée'}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif mt-3">
                {lang === 'en'
                  ? 'Choose the depth of your reading'
                  : 'Choisissez la profondeur de votre lecture'}
              </h2>
              <p className="mt-4 text-violet-200 leading-7 max-w-2xl mx-auto">
                {lang === 'en'
                  ? 'Your question is now at the heart of the ritual. Choose how deeply you would like the cards to explore it.'
                  : 'Votre question est maintenant au cœur du rituel. Choisissez jusqu’où vous souhaitez laisser les cartes l’explorer.'}
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-black/15 border border-white/10 px-5 py-4">
              <div className="text-xs uppercase tracking-[0.16em] text-violet-300">
                {lang === 'en' ? 'Your question' : 'Votre question'}
              </div>
              <p className="mt-2 italic text-violet-50 leading-7">« {question} »</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-8">
              {[
                {
                  id: 1,
                  title: lang === 'en' ? 'A light' : 'Un éclairage',
                  desc: lang === 'en' ? 'One card · essential message' : '1 carte · message essentiel'
                },
                {
                  id: 3,
                  title: lang === 'en' ? 'The path' : 'Le chemin',
                  desc: lang === 'en' ? 'Three cards · past, present, future' : '3 cartes · passé, présent, futur'
                },
                {
                  id: 5,
                  title: lang === 'en' ? 'The cross' : 'La croix',
                  desc: lang === 'en' ? 'Five cards · deeper reading' : '5 cartes · lecture approfondie'
                }
              ].map(o => (
                <button
                  key={o.id}
                  onClick={() => setCount(o.id)}
                  className={`rounded-2xl border px-5 py-6 text-left transition ${
                    count === o.id
                      ? 'border-amber-100/70 bg-amber-100/[0.10] shadow-lg'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.065]'
                  }`}
                >
                  <div className="font-serif text-xl">{o.title}</div>
                  <div className="mt-2 text-sm text-violet-300">{o.desc}</div>
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={performSpread}
                className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition"
              >
                {lang === 'en' ? 'Proceed with the spread ✦' : 'Procéder au tirage ✦'}
              </button>

              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-violet-300"
              >
                {lang === 'en' ? 'Return to my question' : 'Revenir à ma question'}
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="max-w-4xl mx-auto rounded-[28px] bg-white/[0.055] border border-white/10 p-7 md:p-10 shadow-2xl">
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.25em] text-amber-100/65">
                {lang === 'en' ? 'The cards are set' : 'Le tirage est posé'}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif mt-3">
                {lang === 'en'
                  ? 'Take a moment to look'
                  : 'Prenez un instant pour regarder'}
              </h2>
              <p className="mt-4 text-violet-200 leading-7 max-w-2xl mx-auto">
                {lang === 'en'
                  ? 'The cards have answered the call of your question. Before revealing their message, simply observe what draws your eye first.'
                  : 'Les cartes ont répondu à l’appel de votre question. Avant de révéler leur message, observez simplement ce qui attire votre regard en premier.'}
              </p>
            </div>

            <div className={`mt-9 grid gap-6 ${count === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
              {cards.map((c, i) => (
                <div
                  key={`${c.name}-${i}`}
                  className="flex justify-center animate-[fadeIn_.7s_ease-out]"
                  style={{ animationDelay: `${i * 180}ms`, animationFillMode: 'both' }}
                >
                  <TarotCard name={c.name} meaning={{ up: c.up, rev: c.rev }} index={c.idx} />
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">
                {error}
              </div>
            )}

            <div className="mt-10 text-center">
              <button
                onClick={revealReading}
                disabled={loading}
                className="bg-amber-200 hover:bg-amber-100 disabled:opacity-60 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition"
              >
                {loading
                  ? (lang === 'en' ? 'The message is unfolding…' : 'Le message se dévoile…')
                  : (lang === 'en' ? 'Reveal the reading ✦' : 'Révéler la lecture ✦')}
              </button>
            </div>
          </section>
        )}

        {step === 4 && reading && (
          <section id="premium-reading" className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-amber-100/15 bg-[#130c19]/85 shadow-2xl">
            <div className="px-6 md:px-10 py-10 text-center bg-gradient-to-b from-amber-100/[0.07] to-transparent">
              <div className="text-amber-100 text-2xl mb-2">☾ ✦ ☽</div>
              <div className="text-xs uppercase tracking-[0.25em] text-amber-100/70">
                {lang === 'en' ? 'Your personalized reading' : 'Votre lecture personnalisée'}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif mt-3">{reading.title}</h2>
              <p className="max-w-3xl mx-auto mt-5 text-violet-100 leading-8 text-[17px]">
                {reading.opening}
              </p>
            </div>

            <div className="px-5 md:px-10 pb-10 space-y-5">
              {(reading.cards || []).map((item, i) => (
                <article key={`${item.card}-${i}`} className="rounded-2xl bg-white/[0.045] border border-white/10 p-5 md:p-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs uppercase tracking-[0.18em] text-amber-100/70">{item.position}</span>
                    <h3 className="text-xl font-serif">{item.card}</h3>
                  </div>
                  <p className="mt-4 text-violet-50 leading-8">{item.reading}</p>
                  {item.shadow && (
                    <div className="mt-4 pl-4 border-l border-violet-300/30 text-violet-200 italic leading-7">
                      {item.shadow}
                    </div>
                  )}
                  {item.invitation && (
                    <div className="mt-5 rounded-xl bg-amber-100/[0.06] px-4 py-3 text-amber-50/90">
                      <span className="mr-2">✧</span>{item.invitation}
                    </div>
                  )}
                </article>
              ))}

              {reading.connections && (
                <div className="py-5 text-center max-w-3xl mx-auto">
                  <div className="text-xl mb-2">✦</div>
                  <h3 className="font-serif text-xl">
                    {lang === 'en' ? 'The dialogue between the cards' : 'Le dialogue entre les cartes'}
                  </h3>
                  <p className="mt-3 leading-8 text-violet-100">{reading.connections}</p>
                </div>
              )}

              {reading.message && (
                <div className="rounded-2xl border border-amber-100/20 bg-amber-100/[0.06] p-6 md:p-7">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                    {lang === 'en' ? 'The message of the spread' : 'Le message du tirage'}
                  </div>
                  <p className="mt-3 text-lg leading-8 text-amber-50">{reading.message}</p>
                </div>
              )}

              {reading.nanou_question && (
                <div className="text-center py-6">
                  <div className="text-xs uppercase tracking-[0.22em] text-violet-300">
                    {lang === 'en' ? 'Nanou invites you to ask yourself' : 'Nanou vous invite à vous demander'}
                  </div>
                  <blockquote className="mt-4 text-xl md:text-2xl font-serif italic text-white leading-relaxed">
                    « {reading.nanou_question} »
                  </blockquote>
                </div>
              )}

              {reading.closing && (
                <p className="max-w-3xl mx-auto text-center text-violet-200 leading-7">{reading.closing}</p>
              )}

              <div className="pt-6 border-t border-white/10">
                <div className="rounded-2xl bg-white/[0.05] p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl">
                      {lang === 'en' ? 'Would you like to go deeper?' : 'Vous souhaitez aller plus loin ?'}
                    </p>
                    <p className="text-sm text-violet-200 mt-1">
                      {lang === 'en'
                        ? 'Continue this reading privately with Nanou.'
                        : 'Prolongez cette lecture dans un échange privé avec Nanou.'}
                    </p>
                  </div>
                  <Link href="/premium/chat" className="rounded-full bg-white text-violet-950 px-5 py-3 font-semibold">
                    {lang === 'en' ? 'Chat with Nanou' : 'Échanger avec Nanou'}
                  </Link>
                </div>

                <div className="mt-7 flex justify-center">
                  <button onClick={restart} className="text-sm underline text-violet-300">
                    {lang === 'en' ? 'Begin another reading' : 'Commencer un autre tirage'}
                  </button>
                </div>

                <p className="text-xs opacity-60 mt-5 leading-5 text-center">
                  {lang === 'en'
                    ? 'Symbolic guidance intended for reflection. It does not replace medical, psychological, legal or financial professional advice.'
                    : 'Cette lecture est une guidance symbolique destinée à la réflexion. Elle ne remplace pas un avis médical, psychologique, juridique ou financier professionnel.'}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
