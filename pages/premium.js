import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'
import { MAJOR_ARCANA } from '../lib/marseilleDeck'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

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

export default function Premium() {
  const [count, setCount] = useState(5)
  const [cards, setCards] = useState([])
  const [question, setQuestion] = useState('')
  const [lang, setLang] = useState('fr')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setCards(drawCards(count))
  }, [])

  const options = useMemo(() => ([
    { id: 1, label: lang === 'en' ? '1 card' : '1 carte' },
    { id: 3, label: lang === 'en' ? '3 cards · Past • Present • Future' : '3 cartes · Passé • Présent • Futur' },
    { id: 5, label: lang === 'en' ? '5 cards · Simple cross' : '5 cartes · Croix simple' }
  ]), [lang])

  async function runPremium() {
    setLoading(true)
    setError('')
    setResult(null)

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
    } catch (e) {
      setError(
        lang === 'en'
          ? 'The reading could not be generated. Please try again in a moment.'
          : 'La lecture n’a pas pu être générée. Merci de réessayer dans un instant.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function sendFeedback(vote) {
    try {
      await fetch('/api/premium/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vote,
          question,
          lang,
          cards: cards.slice(0, count)
        })
      })
      alert(lang === 'en' ? 'Thank you for your feedback.' : 'Merci pour votre retour.')
    } catch {}
  }

  const reading = result?.parsed

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#241431] via-[#3d2352] to-[#17101f] text-white">
      <Head>
        <title>{lang === 'en' ? "Premium Reading — Nanou’s Tarot" : 'Lecture Premium — Les tarots de Nanou'}</title>
        <meta
          name="description"
          content={lang === 'en'
            ? 'A personalized Tarot de Marseille reading.'
            : 'Une lecture personnalisée du Tarot de Marseille.'}
        />
      </Head>

      <Header />

      <main className="max-w-5xl mx-auto p-6 pb-16">
        <section className="text-center py-8">
          <div className="text-3xl mb-3">✦</div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            {lang === 'en' ? 'Your deeper reading' : 'Votre lecture approfondie'}
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-violet-100 leading-relaxed">
            {lang === 'en'
              ? 'Take a moment, hold your question in mind and let the symbols of the Tarot de Marseille open a space for reflection.'
              : 'Prenez un instant, gardez votre question à l’esprit et laissez les symboles du Tarot de Marseille ouvrir un espace de réflexion.'}
          </p>
        </section>

        <section className="bg-white/[0.07] border border-white/10 backdrop-blur rounded-3xl p-5 md:p-7 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-violet-200">
                {lang === 'en' ? 'Your spread' : 'Votre tirage'}
              </div>
              <h2 className="text-xl font-semibold mt-1">
                {lang === 'en' ? 'Tarot de Marseille' : 'Tarot de Marseille'}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              {options.map(o => (
                <button
                  key={o.id}
                  onClick={() => {
                    setCount(o.id)
                    setCards(drawCards(o.id))
                    setResult(null)
                  }}
                  className={`px-3 py-2 rounded-full border transition ${
                    count === o.id
                      ? 'bg-white text-violet-950 border-white'
                      : 'bg-white/5 border-white/15 hover:bg-white/10'
                  }`}
                >
                  {o.label}
                </button>
              ))}
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="text-violet-950 rounded-full px-3 py-2"
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </div>
          </div>

          <div className={`grid gap-5 ${count === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>
            {cards.slice(0, count).map((c, i) => (
              <div key={`${c.name}-${i}`} className="flex justify-center">
                <TarotCard name={c.name} meaning={{ up: c.up, rev: c.rev }} index={c.idx} />
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-white/10 pt-7">
            <label className="block text-sm uppercase tracking-[0.16em] text-violet-200 mb-3">
              {lang === 'en' ? 'Your question' : 'Votre question'}
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-2xl p-4 text-violet-950 min-h-[120px] shadow-inner"
              rows={4}
              placeholder={lang === 'en'
                ? 'What would you like the cards to illuminate for you?'
                : 'Qu’aimeriez-vous que les cartes viennent éclairer pour vous ?'}
            />

            <label className="text-sm flex items-start gap-2 mt-4 text-violet-100">
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

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={runPremium}
                disabled={loading}
                className="bg-amber-200 hover:bg-amber-100 disabled:opacity-60 text-violet-950 px-6 py-3 rounded-full font-semibold shadow-lg transition"
              >
                {loading
                  ? (lang === 'en' ? 'The cards are speaking…' : 'Les cartes se dévoilent…')
                  : (lang === 'en' ? 'Reveal my reading ✦' : 'Révéler ma lecture ✦')}
              </button>

              <button
                onClick={() => {
                  setCards(drawCards(count))
                  setResult(null)
                }}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10"
              >
                {lang === 'en' ? 'Draw again' : 'Nouveau tirage'}
              </button>

              {PAYMENT_LINK !== '#' && (
                <a className="text-sm underline opacity-70" href={PAYMENT_LINK} target="_blank" rel="noreferrer">
                  {lang === 'en' ? 'Payment' : 'Paiement'}
                </a>
              )}
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">
                {error}
              </div>
            )}
          </div>
        </section>

        {reading && (
          <section className="mt-8 rounded-3xl overflow-hidden border border-amber-100/15 bg-[#160f1e]/80 shadow-2xl">
            <div className="px-6 md:px-10 py-9 text-center bg-gradient-to-b from-amber-100/[0.08] to-transparent">
              <div className="text-amber-100 text-2xl mb-2">☾ ✦ ☽</div>
              <div className="text-xs uppercase tracking-[0.25em] text-amber-100/70">
                {lang === 'en' ? 'Your personalized reading' : 'Votre interprétation personnalisée'}
              </div>
              <h2 className="text-2xl md:text-3xl font-serif mt-3">
                {reading.title}
              </h2>
              <p className="max-w-3xl mx-auto mt-5 text-violet-100 leading-8 text-[17px]">
                {reading.opening}
              </p>
            </div>

            <div className="px-5 md:px-10 pb-10 space-y-5">
              {(reading.cards || []).map((item, i) => (
                <article
                  key={`${item.card}-${i}`}
                  className="rounded-2xl bg-white/[0.055] border border-white/10 p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs uppercase tracking-[0.18em] text-amber-100/70">
                      {item.position}
                    </span>
                    <h3 className="text-xl font-serif">{item.card}</h3>
                  </div>

                  <p className="mt-4 text-violet-50 leading-8">
                    {item.reading}
                  </p>

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
                  <p className="mt-3 leading-8 text-violet-100">
                    {reading.connections}
                  </p>
                </div>
              )}

              {reading.message && (
                <div className="rounded-2xl border border-amber-100/20 bg-amber-100/[0.07] p-6 md:p-7">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                    {lang === 'en' ? 'The message of the spread' : 'Le message du tirage'}
                  </div>
                  <p className="mt-3 text-lg leading-8 text-amber-50">
                    {reading.message}
                  </p>
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
                <p className="max-w-3xl mx-auto text-center text-violet-200 leading-7">
                  {reading.closing}
                </p>
              )}

              <div className="pt-6 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {lang === 'en' ? 'Would you like to go deeper?' : 'Envie d’aller plus loin ?'}
                    </p>
                    <p className="text-sm text-violet-200 mt-1">
                      {lang === 'en'
                        ? 'Continue the exchange privately with Nanou.'
                        : 'Prolongez cet échange en privé avec Nanou.'}
                    </p>
                  </div>
                  <Link
                    href="/premium/chat"
                    className="rounded-full bg-white text-violet-950 px-5 py-3 font-semibold"
                  >
                    {lang === 'en' ? 'Chat with Nanou' : 'Échanger avec Nanou'}
                  </Link>
                </div>

                <div className="mt-6 flex items-center gap-3 text-sm text-violet-300">
                  <span>{lang === 'en' ? 'Was this reading meaningful?' : 'Cette lecture vous a-t-elle parlé ?'}</span>
                  <button onClick={() => sendFeedback('up')} className="bg-white/10 px-3 py-1.5 rounded-full">Oui 👍</button>
                  <button onClick={() => sendFeedback('down')} className="bg-white/10 px-3 py-1.5 rounded-full">Pas vraiment 👎</button>
                </div>

                <p className="text-xs opacity-60 mt-5 leading-5">
                  {lang === 'en'
                    ? 'Symbolic guidance intended for reflection. It does not replace medical, psychological, legal or financial professional advice.'
                    : 'Cette lecture est une guidance symbolique destinée à la réflexion. Elle ne remplace pas un avis médical, psychologique, juridique ou financier professionnel.'}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
