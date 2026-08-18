import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { MAJOR_ARCANA } from '../../lib/marseilleDeck'

function normalizeCardName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function cardImageFor(name) {
  const target = normalizeCardName(name)
  const index = MAJOR_ARCANA.findIndex(card => normalizeCardName(card.name) === target)
  return index >= 0 ? `/cards/${index}.jpg` : null
}

function CardVisual({ name, compact = false }) {
  const src = cardImageFor(name)
  if (!src) return null
  return (
    <div className={compact ? 'mt-4 flex justify-center' : 'flex justify-center md:justify-start'}>
      <div className="rounded-[18px] border border-amber-100/30 bg-[#160d1e] p-2 shadow-2xl">
        <img
          src={src}
          alt={name}
          className={`${compact ? 'w-[150px]' : 'w-[190px] md:w-[220px]'} h-auto rounded-xl object-contain`}
        />
      </div>
    </div>
  )
}

export default function PremiumResult() {
  const router = useRouter()
  const [status, setStatus] = useState('Vérification de votre paiement…')
  const [context, setContext] = useState(null)
  const [reading, setReading] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sessionId = typeof router.query.session_id === 'string' ? router.query.session_id : ''
  const readingId = typeof router.query.reading_id === 'string' ? router.query.reading_id : ''

  useEffect(() => {
    if (!router.isReady || !sessionId || !readingId) return
    let cancelled = false
    async function verify() {
      try {
        const r = await fetch(`/api/stripe/verify-checkout?session_id=${encodeURIComponent(sessionId)}&reading_id=${encodeURIComponent(readingId)}`)
        const data = await r.json()
        if (!r.ok || !data.paid) throw new Error('payment pending')
        if (!cancelled) {
          setContext(data.reading_context || null)
          setStatus('Paiement confirmé. Votre lecture est prête à être révélée.')
        }
      } catch {
        if (!cancelled) setStatus('Le paiement est en cours de confirmation. Actualisez cette page dans quelques secondes.')
      }
    }
    verify()
    return () => { cancelled = true }
  }, [router.isReady, sessionId, readingId])

  async function reveal() {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/premium/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, reading_id: readingId })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.parsed) throw new Error(data.error || 'reading unavailable')
      setReading(data.parsed)
    } catch {
      setError('La lecture n’a pas pu être révélée. Merci de réessayer dans un instant.')
    } finally { setLoading(false) }
  }

  function continueToChat() {
    router.push('/chat-preview')
  }

  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white px-5 py-12">
    <Head><title>Votre Lecture Premium — Les Tarots de Nanou</title></Head>
    <main className="max-w-4xl mx-auto">
      <div className="text-center"><div className="text-3xl">☾ ✦ ☽</div><div className="mt-3 text-xs uppercase tracking-[0.25em] text-amber-100/65">Lecture Premium</div><h1 className="mt-3 text-4xl md:text-5xl font-serif">Votre tirage se dévoile</h1><p className="mt-4 text-violet-200">{status}</p></div>

      {context && <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-6 md:p-8 shadow-2xl">
        <div className="text-xs uppercase tracking-[0.18em] text-violet-300">Votre question</div>
        <p className="mt-2 text-lg italic">« {context.question} »</p>
        <div className={`mt-6 grid gap-4 ${(context.cards || []).length === 1 ? 'max-w-sm mx-auto' : 'md:grid-cols-3'}`}>
          {(context.cards || []).map((c, i) => <div key={`${c.name}-${i}`} className="rounded-2xl bg-black/15 border border-white/10 p-4 text-center">
            <div className="text-xs text-amber-100/60">Carte {i+1}</div>
            <CardVisual name={c.name} compact />
            <div className="mt-3 font-serif text-xl">{c.name}</div>
          </div>)}
        </div>
        {!reading && <div className="mt-8 text-center"><button onClick={reveal} disabled={loading} className="bg-amber-200 hover:bg-amber-100 disabled:opacity-50 text-violet-950 px-9 py-4 rounded-full font-semibold shadow-lg transition text-lg">{loading ? 'La lecture se compose…' : 'Révéler ma lecture complète ✦'}</button></div>}
        {error && <p className="mt-4 text-center text-red-200">{error}</p>}
      </section>}

      {reading && <>
        <section className="mt-8 rounded-[28px] border border-amber-100/25 bg-gradient-to-b from-amber-100/[0.09] to-white/[0.03] p-7 md:p-9 shadow-2xl">
          <div className="text-center"><div className="text-2xl">✦</div><h2 className="mt-3 text-3xl md:text-4xl font-serif">{reading.title}</h2><p className="mt-4 leading-8 text-violet-100">{reading.opening}</p></div>
          <div className="mt-8 space-y-5">{(reading.cards || []).map((c, i) => <article key={i} className="rounded-2xl bg-black/15 border border-white/10 p-5 md:p-6">
            <div className="grid md:grid-cols-[180px_1fr] gap-6 items-start">
              <CardVisual name={c.card} />
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-amber-100/65">{c.position}</div>
                <h3 className="mt-1 text-2xl font-serif">{c.card}</h3>
                <p className="mt-3 leading-8">{c.reading}</p>
                {c.shadow && <p className="mt-3 text-violet-200">{c.shadow}</p>}
                {c.invitation && <p className="mt-3 italic text-amber-100/80">{c.invitation}</p>}
              </div>
            </div>
          </article>)}</div>
          {reading.connections && <div className="mt-6"><h3 className="font-serif text-2xl">Le fil entre les cartes</h3><p className="mt-2 leading-8 text-violet-100">{reading.connections}</p></div>}
          {reading.message && <div className="mt-6"><h3 className="font-serif text-2xl">Le message du tirage</h3><p className="mt-2 leading-8 text-violet-100">{reading.message}</p></div>}
          {reading.nanou_question && <div className="mt-6 rounded-2xl bg-white/[0.05] border border-white/10 p-5 italic">« {reading.nanou_question} »</div>}
          {reading.closing && <p className="mt-6 text-center text-violet-200 leading-7">{reading.closing}</p>}
        </section>

        <section className="mt-8 rounded-[28px] border border-amber-100/25 bg-white/[0.055] p-7 md:p-9 text-center shadow-2xl">
          <div className="text-2xl">☾ ✦ ☽</div>
          <div className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-100/65">Une question demeure ?</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-serif">Poursuivez en privé avec Nanou</h2>
          <p className="mt-4 max-w-2xl mx-auto leading-7 text-violet-100">Prolongez votre lecture dans un échange privé avec Nanou. La consultation est facturée 39,90 € pour les 10 premières minutes, puis par tranches supplémentaires de 10 minutes.</p>
          <button onClick={continueToChat} className="mt-7 bg-amber-200 hover:bg-amber-100 text-violet-950 px-9 py-4 rounded-full font-semibold shadow-lg transition text-lg">Poursuivre avec Nanou · 39,90 € ✦</button>
          <p className="mt-3 text-xs text-violet-300">Le paiement du chat est distinct de la Lecture Premium. Les modalités de renouvellement sont affichées avant validation.</p>
        </section>
      </>}
    </main>
  </div>
}
