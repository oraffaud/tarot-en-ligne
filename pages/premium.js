import Head from 'next/head'
import Link from 'next/link'
import { useMemo, useState } from 'react'
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
  const [step, setStep] = useState(1)
  const [count, setCount] = useState(3)
  const [cards, setCards] = useState([])
  const [question, setQuestion] = useState('')
  const [lang, setLang] = useState('fr')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')


  const options = useMemo(() => ([
    { id: 1, label: lang === 'en' ? 'Essential message · 1 card' : 'Message essentiel · 1 carte' },
    { id: 3, label: lang === 'en' ? 'Past · Present · Future · 3 cards' : 'Passé · Présent · Futur · 3 cartes' },
    { id: 5, label: lang === 'en' ? 'Simple cross · 5 cards' : 'Croix simple · 5 cartes' }
  ]), [lang])


  function prepareSpread() {
    if (!question.trim()) {
      setError(lang === 'en' ? 'Please write the question you would like to entrust to the cards.' : 'Écrivez d’abord la question que vous souhaitez confier aux cartes.')
      return
    }
    setError('')
    setCards(drawCards(count))
    setResult(null)
    setStep(2)
  }

  function restart() {
    setQuestion('')
    setCards([])
    setResult(null)
    setError('')
    setStep(1)
  }

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
      setStep(3)
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

      <main className="max-w-5xl mx-auto px-5 md:px-6 pb-16">
        <section className="text-center pt-8 pb-5">
          <div className="text-3xl mb-3">☾ ✦ ☽</div>
          <div className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
            {lang === 'en' ? 'Private premium reading' : 'Lecture Premium privée'}
          </div>
          <h1 className="text-3xl md:text-5xl font-serif mt-3">
            {lang === 'en' ? 'A reading created for you' : 'Une lecture rien que pour vous'}
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-violet-100 leading-8">
            {lang === 'en'
              ? 'Every reading begins with an intention. Ask your question, let the cards reveal themselves, then discover what they may illuminate along your path.'
              : 'Chaque tirage commence par une intention. Posez votre question, laissez les cartes se dévoiler, puis découvrez ce qu’elles viennent éclairer sur votre chemin.'}
          </p>
        </section>

        <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto mb-8">
          {(lang === 'en' ? ['Your question','Your spread','Your reading'] : ['Votre question','Votre tirage','Votre lecture']).map((label,i)=>{
            const n=i+1, active=step===n, done=step>n
            return <div key={label} className="text-center"><div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center border ${active?'bg-amber-200 text-violet-950 border-amber-100':done?'bg-white text-violet-950 border-white':'bg-white/5 text-white/60 border-white/15'}`}>{done?'✓':n}</div><div className={`mt-2 text-xs md:text-sm ${active?'text-amber-100':'text-violet-200'}`}>{label}</div></div>
          })}
        </div>

        {step === 1 && (
          <section className="max-w-3xl mx-auto rounded-3xl bg-white/[0.07] border border-white/10 p-6 md:p-9 shadow-2xl">
            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.24em] text-amber-100/70">{lang==='en'?'Step 1':'Étape 1'}</div>
              <h2 className="text-2xl md:text-3xl font-serif mt-2">{lang==='en'?'Entrust your question to the cards':'Confiez votre question aux cartes'}</h2>
              <p className="mt-3 text-violet-200 leading-7">{lang==='en'?'Take a quiet moment and formulate what you truly wish to illuminate.':'Prenez un instant au calme et formulez ce que vous souhaitez réellement éclairer.'}</p>
            </div>

            <textarea value={question} onChange={(e)=>setQuestion(e.target.value)} className="mt-7 w-full rounded-2xl p-5 text-violet-950 min-h-[150px] shadow-inner text-lg" rows={5} placeholder={lang==='en'?'What would you like the cards to illuminate for you?':'Qu’aimeriez-vous que les cartes viennent éclairer pour vous ?'} />

            <div className="mt-7">
              <div className="text-sm uppercase tracking-[0.16em] text-violet-200 mb-3">{lang==='en'?'Choose your spread':'Choisissez votre tirage'}</div>
              <div className="grid md:grid-cols-3 gap-3">
                {options.map(o=><button key={o.id} onClick={()=>setCount(o.id)} className={`rounded-2xl border px-4 py-5 text-left transition ${count===o.id?'border-amber-100/70 bg-amber-100/[0.12] shadow-lg':'border-white/10 bg-white/[0.035] hover:bg-white/[0.07]'}`}><div className="font-semibold">{o.label}</div></button>)}
              </div>
            </div>

            <label className="text-sm flex items-start gap-2 mt-6 text-violet-200"><input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} className="mt-1"/><span>{lang==='en'?'I consent to anonymized storage of this exchange to improve the service.':'J’accepte l’enregistrement anonymisé de cet échange afin d’améliorer le service.'}</span></label>
            {error && <div className="mt-5 rounded-2xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">{error}</div>}
            <div className="mt-7 text-center"><button onClick={prepareSpread} className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-7 py-3.5 rounded-full font-semibold shadow-lg transition">{lang==='en'?'Entrust my question to the cards ✦':'Confier ma question aux cartes ✦'}</button></div>
          </section>
        )}

        {step === 2 && (
          <section className="max-w-4xl mx-auto rounded-3xl bg-white/[0.07] border border-white/10 p-6 md:p-9 shadow-2xl">
            <div className="text-center"><div className="text-xs uppercase tracking-[0.24em] text-amber-100/70">{lang==='en'?'Step 2':'Étape 2'}</div><h2 className="text-2xl md:text-3xl font-serif mt-2">{lang==='en'?'Your cards have been drawn':'Vos cartes ont été tirées'}</h2><p className="mt-3 text-violet-200 leading-7 max-w-2xl mx-auto">{lang==='en'?'Your question has been placed at the heart of the spread. Take a moment to look at the cards.':'Votre question est maintenant au cœur du tirage. Prenez un instant pour regarder les cartes avant de découvrir leur message.'}</p></div>
            <div className="mt-6 rounded-2xl bg-black/15 border border-white/10 px-5 py-4"><div className="text-xs uppercase tracking-[0.16em] text-violet-300">{lang==='en'?'Your question':'Votre question'}</div><p className="mt-2 italic text-violet-50 leading-7">« {question} »</p></div>
            <div className={`mt-8 grid gap-6 ${count===1?'grid-cols-1 max-w-xs mx-auto':'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'}`}>{cards.map((c,i)=><div key={`${c.name}-${i}`} className="flex justify-center"><TarotCard name={c.name} meaning={{up:c.up,rev:c.rev}} index={c.idx}/></div>)}</div>
            {error && <div className="mt-5 rounded-2xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">{error}</div>}
            <div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={runPremium} disabled={loading} className="bg-amber-200 hover:bg-amber-100 disabled:opacity-60 text-violet-950 px-7 py-3.5 rounded-full font-semibold shadow-lg transition">{loading?(lang==='en'?'The message is unfolding…':'Le message se dévoile…'):(lang==='en'?'Reveal my interpretation ✦':'Révéler mon interprétation ✦')}</button><button onClick={()=>setStep(1)} disabled={loading} className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-violet-200">{lang==='en'?'Change my question':'Modifier ma question'}</button></div>
          </section>
        )}

        {step === 3 && reading && (
          <section className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-amber-100/15 bg-[#160f1e]/80 shadow-2xl">
            <div className="px-6 md:px-10 py-9 text-center bg-gradient-to-b from-amber-100/[0.08] to-transparent"><div className="text-amber-100 text-2xl mb-2">☾ ✦ ☽</div><div className="text-xs uppercase tracking-[0.25em] text-amber-100/70">{lang==='en'?'Your personalized reading':'Votre lecture personnalisée'}</div><h2 className="text-2xl md:text-3xl font-serif mt-3">{reading.title}</h2><p className="max-w-3xl mx-auto mt-5 text-violet-100 leading-8 text-[17px]">{reading.opening}</p></div>
            <div className="px-5 md:px-10 pb-10 space-y-5">
              {(reading.cards||[]).map((item,i)=><article key={`${item.card}-${i}`} className="rounded-2xl bg-white/[0.055] border border-white/10 p-5 md:p-6"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-xs uppercase tracking-[0.18em] text-amber-100/70">{item.position}</span><h3 className="text-xl font-serif">{item.card}</h3></div><p className="mt-4 text-violet-50 leading-8">{item.reading}</p>{item.shadow&&<div className="mt-4 pl-4 border-l border-violet-300/30 text-violet-200 italic leading-7">{item.shadow}</div>}{item.invitation&&<div className="mt-5 rounded-xl bg-amber-100/[0.06] px-4 py-3 text-amber-50/90"><span className="mr-2">✧</span>{item.invitation}</div>}</article>)}
              {reading.connections&&<div className="py-5 text-center max-w-3xl mx-auto"><div className="text-xl mb-2">✦</div><h3 className="font-serif text-xl">{lang==='en'?'The dialogue between the cards':'Le dialogue entre les cartes'}</h3><p className="mt-3 leading-8 text-violet-100">{reading.connections}</p></div>}
              {reading.message&&<div className="rounded-2xl border border-amber-100/20 bg-amber-100/[0.07] p-6 md:p-7"><div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">{lang==='en'?'The message of the spread':'Le message du tirage'}</div><p className="mt-3 text-lg leading-8 text-amber-50">{reading.message}</p></div>}
              {reading.nanou_question&&<div className="text-center py-6"><div className="text-xs uppercase tracking-[0.22em] text-violet-300">{lang==='en'?'Nanou invites you to ask yourself':'Nanou vous invite à vous demander'}</div><blockquote className="mt-4 text-xl md:text-2xl font-serif italic text-white leading-relaxed">« {reading.nanou_question} »</blockquote></div>}
              {reading.closing&&<p className="max-w-3xl mx-auto text-center text-violet-200 leading-7">{reading.closing}</p>}
              <div className="pt-6 border-t border-white/10"><div className="rounded-2xl bg-white/[0.05] p-5 md:p-6 flex flex-wrap items-center justify-between gap-4"><div><p className="font-serif text-xl">{lang==='en'?'Would you like to go deeper?':'Vous souhaitez aller plus loin ?'}</p><p className="text-sm text-violet-200 mt-1">{lang==='en'?'Continue this reading in a private exchange with Nanou.':'Prolongez cette lecture dans un échange privé avec Nanou.'}</p></div><Link href="/premium/chat" className="rounded-full bg-white text-violet-950 px-5 py-3 font-semibold">{lang==='en'?'Chat with Nanou':'Échanger avec Nanou'}</Link></div><div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-violet-300"><span>{lang==='en'?'Did this reading resonate with you?':'Cette lecture a-t-elle résonné avec vous ?'}</span><button onClick={()=>sendFeedback('up')} className="bg-white/10 px-3 py-1.5 rounded-full">Oui 👍</button><button onClick={()=>sendFeedback('down')} className="bg-white/10 px-3 py-1.5 rounded-full">Pas vraiment 👎</button></div><div className="mt-6 text-center"><button onClick={restart} className="text-sm underline text-violet-300">{lang==='en'?'Start a new reading':'Commencer une nouvelle lecture'}</button></div><p className="text-xs opacity-60 mt-5 leading-5 text-center">{lang==='en'?'Symbolic guidance intended for reflection. It does not replace medical, psychological, legal or financial professional advice.':'Cette lecture est une guidance symbolique destinée à la réflexion. Elle ne remplace pas un avis médical, psychologique, juridique ou financier professionnel.'}</p></div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
