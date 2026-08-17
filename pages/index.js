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

const drawCards = (count) =>
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx }))).slice(0, count)

function freeCardReading(card, lang) {
  if (!card) return ''
  if (lang === 'en') {
    return `${card.name} brings forward the energy of ${card.up.toLowerCase()}. It suggests that something meaningful is already moving around your question, but its full direction is not yet visible.`
  }
  return `${card.name} fait émerger une énergie de ${card.up.toLowerCase()}. Cette carte suggère que quelque chose d’important est déjà en mouvement autour de votre question, mais que sa direction complète ne se révèle pas encore.`
}

function spreadLabels(count, lang) {
  if (count === 1) return lang === 'en' ? ['Essential message'] : ['Message essentiel']
  if (count === 3) return lang === 'en'
    ? ['Past', 'Present', 'Future']
    : ['Passé', 'Présent', 'Futur']
  return lang === 'en'
    ? ['Left', 'Right', 'Top', 'Bottom', 'Centre']
    : ['Gauche', 'Droite', 'Haut', 'Bas', 'Centre']
}

export default function Home() {
  const router = useRouter()
  const lang = router.query.lang === 'en' ? 'en' : 'fr'

  const [question, setQuestion] = useState('')
  const [count, setCount] = useState(3)
  const [cards, setCards] = useState([])
  const [drawnCount, setDrawnCount] = useState(0)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  const labels = spreadLabels(count, lang)

  function openRitual() {
    if (!question.trim()) {
      setError(lang === 'en'
        ? 'Write the question you would like to entrust to the cards.'
        : 'Écrivez la question que vous souhaitez confier aux cartes.')
      return
    }
    setError('')
    setStep(2)
  }

  function startSpread() {
    setCards(drawCards(count))
    setDrawnCount(0)
    setError('')
    setStep(3)
  }

  function drawNextCard() {
    if (drawnCount >= count) return
    setDrawnCount(v => Math.min(v + 1, count))
  }

  function restart() {
    setQuestion('')
    setCount(3)
    setCards([])
    setDrawnCount(0)
    setStep(1)
    setError('')
  }

  async function goPremium() {
    try {
      const context = {
        question: question.trim(),
        lang,
        count,
        cards: cards.map(c => ({ name: c.name, up: c.up, rev: c.rev, idx: c.idx }))
      }

      const r = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      })

      if (!r.ok) throw new Error('Checkout unavailable')
      const data = await r.json()
      if (!data.url || !data.reading_id) throw new Error('Missing checkout binding')
      window.localStorage.setItem('nanou_premium_context', JSON.stringify(context))
      window.localStorage.setItem('nanou_pending_reading_id', data.reading_id)
      window.location.href = data.url
    } catch (e) {
      setError(lang === 'en'
        ? 'Payment could not be opened. Please try again.'
        : 'Le paiement n’a pas pu être ouvert. Merci de réessayer.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white">
      <Head>
        <title>{lang === 'en' ? "Nanou’s Tarot — Free reading" : 'Les tarots de Nanou — Tirage découverte'}</title>
        <meta name="description" content={lang === 'en' ? 'Ask your question, draw the Tarot de Marseille cards yourself and discover a first symbolic reading.' : 'Posez votre question, tirez vous-même les cartes du Tarot de Marseille et découvrez un premier éclairage symbolique.'} />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Header />
      <main className="max-w-5xl mx-auto px-5 md:px-6 pb-20">
        {step === 1 && <section className="max-w-3xl mx-auto text-center pt-14 md:pt-20"><div className="text-3xl mb-4">☾ ✦ ☽</div><div className="text-xs uppercase tracking-[0.30em] text-amber-100/65">{lang === 'en' ? 'A first opening' : 'Un premier passage'}</div><h1 className="text-4xl md:text-6xl font-serif mt-4 leading-tight">{lang === 'en' ? 'A question keeps returning?' : 'Une question revient sans cesse ?'}</h1><p className="mt-5 max-w-2xl mx-auto text-violet-100/90 leading-8 text-lg">{lang === 'en' ? 'Take a quiet moment. Think of what you would truly like to understand, then entrust it to the Tarot de Marseille.' : 'Prenez un instant au calme. Pensez à ce que vous aimeriez réellement comprendre, puis confiez-le au Tarot de Marseille.'}</p><div className="mt-10 rounded-[28px] bg-white/[0.055] border border-white/10 p-6 md:p-8 shadow-2xl text-left"><label className="block text-sm uppercase tracking-[0.18em] text-violet-300 mb-3">{lang === 'en' ? 'Your question' : 'Votre question'}</label><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} className="w-full rounded-2xl p-5 text-violet-950 min-h-[150px] shadow-inner text-lg" placeholder={lang === 'en' ? 'What would you like the cards to illuminate today?' : 'Qu’aimeriez-vous que les cartes viennent éclairer aujourd’hui ?'} />{error && <div className="mt-4 rounded-xl border border-red-200/20 bg-red-200/10 px-4 py-3 text-red-100">{error}</div>}<div className="mt-6 text-center"><button onClick={openRitual} className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition">{lang === 'en' ? 'Open my reading ✦' : 'Ouvrir mon tirage ✦'}</button></div></div><p className="mt-6 text-sm text-violet-400">{lang === 'en' ? 'A first symbolic reading offered · no account required' : 'Un premier éclairage symbolique offert · sans création de compte'}</p></section>}
        {step === 2 && <section className="max-w-3xl mx-auto rounded-[28px] bg-white/[0.055] border border-white/10 p-7 md:p-10 shadow-2xl mt-12"><div className="text-center"><div className="text-xs uppercase tracking-[0.25em] text-amber-100/65">{lang === 'en' ? 'The intention is set' : 'L’intention est posée'}</div><h2 className="text-2xl md:text-4xl font-serif mt-3">{lang === 'en' ? 'Choose how the cards will answer' : 'Choisissez comment les cartes vont vous répondre'}</h2><p className="mt-4 text-violet-200 leading-7">{lang === 'en' ? 'The deeper the spread, the more nuances appear.' : 'Plus le tirage est profond, plus les nuances apparaissent.'}</p></div><div className="mt-6 rounded-2xl bg-black/15 border border-white/10 px-5 py-4"><div className="text-xs uppercase tracking-[0.16em] text-violet-300">{lang === 'en' ? 'Your question' : 'Votre question'}</div><p className="mt-2 italic text-violet-50 leading-7">« {question} »</p></div><div className="grid md:grid-cols-3 gap-4 mt-8">{[{id:1,title:lang==='en'?'The sign':'Le signe',desc:lang==='en'?'1 card · a direct message':'1 carte · un message direct'},{id:3,title:lang==='en'?'The path':'Le chemin',desc:lang==='en'?'3 cards · past, present, future':'3 cartes · passé, présent, futur'},{id:5,title:lang==='en'?'The cross':'La croix',desc:lang==='en'?'5 cards · a deeper symbolic map':'5 cartes · une lecture plus profonde'}].map(o => <button key={o.id} onClick={() => setCount(o.id)} className={`rounded-2xl border px-5 py-6 text-left transition ${count === o.id ? 'border-amber-100/70 bg-amber-100/[0.10] shadow-lg' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.065]'}`}><div className="font-serif text-xl">{o.title}</div><div className="mt-2 text-sm text-violet-300">{o.desc}</div></button>)}</div><div className="mt-8 flex flex-wrap justify-center gap-3"><button onClick={startSpread} className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition">{lang === 'en' ? 'Begin the ritual ✦' : 'Commencer le rituel ✦'}</button><button onClick={() => setStep(1)} className="px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 text-violet-300">{lang === 'en' ? 'Change my question' : 'Modifier ma question'}</button></div></section>}
        {step === 3 && <section className="max-w-4xl mx-auto rounded-[28px] bg-white/[0.055] border border-white/10 p-7 md:p-10 shadow-2xl mt-12"><div className="text-center"><div className="text-xs uppercase tracking-[0.25em] text-amber-100/65">{lang === 'en' ? 'The ritual begins' : 'Le rituel commence'}</div><h2 className="text-2xl md:text-4xl font-serif mt-3">{drawnCount < count ? (lang === 'en' ? 'Draw the cards yourself' : 'Tirez vous-même les cartes') : (lang === 'en' ? 'Your spread is set' : 'Votre tirage est posé')}</h2><p className="mt-4 text-violet-200 leading-7 max-w-2xl mx-auto">{drawnCount < count ? (lang === 'en' ? 'Keep your question in mind. Touch the deck each time you feel ready.' : 'Gardez votre question à l’esprit. Touchez le jeu chaque fois que vous vous sentez prêt.') : (lang === 'en' ? 'The cards have taken their place. Observe them before discovering the first message.' : 'Les cartes ont trouvé leur place. Observez-les avant de découvrir leur premier message.')}</p></div>{drawnCount < count && <div className="mt-9 flex flex-col items-center"><button onClick={drawNextCard} className="free-tarot-deck" aria-label={lang === 'en' ? 'Draw the next card' : 'Tirer la carte suivante'}><span className="free-deck-shadow free-deck-shadow-1" /><span className="free-deck-shadow free-deck-shadow-2" /><span className="free-deck-face"><span className="free-deck-moon">☾</span><span className="free-deck-star">✦</span><span className="free-deck-moon free-deck-moon-right">☽</span></span></button><div className="mt-5 text-sm uppercase tracking-[0.16em] text-amber-100/70">{lang === 'en' ? `Card ${drawnCount + 1} of ${count}` : `Carte ${drawnCount + 1} sur ${count}`}</div><div className="mt-2 text-violet-300 text-sm">{lang === 'en' ? 'Touch the deck' : 'Touchez le jeu'}</div></div>}{drawnCount > 0 && (count === 5 ? <div className="tarot-cross mt-9 mx-auto">{cards.slice(0, drawnCount).map((c, i) => { const positions = ['cross-left','cross-right','cross-top','cross-bottom','cross-center']; return <div key={`${c.name}-${i}`} className={`cross-card ${positions[i]} animate-[cardReveal_.75s_cubic-bezier(.2,.8,.2,1)]`} style={{animationFillMode:'both'}}><div className="cross-label">{i + 1} · {labels[i]}</div><TarotCard name={c.name} meaning={{up:c.up,rev:c.rev}} index={c.idx} /></div> })}</div> : <div className={`mt-9 grid gap-6 ${count === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-3 max-w-3xl mx-auto'}`}>{cards.slice(0, drawnCount).map((c, i) => <div key={`${c.name}-${i}`} className="flex flex-col items-center animate-[cardReveal_.75s_cubic-bezier(.2,.8,.2,1)]" style={{animationFillMode:'both'}}><div className="cross-label mb-2">{i + 1} · {labels[i]}</div><TarotCard name={c.name} meaning={{up:c.up,rev:c.rev}} index={c.idx} /></div>)}</div>)}{drawnCount === count && <div className="mt-10 text-center"><button onClick={() => setStep(4)} className="bg-amber-200 hover:bg-amber-100 text-violet-950 px-8 py-3.5 rounded-full font-semibold shadow-lg transition">{lang === 'en' ? 'Discover the first message ✦' : 'Découvrir le premier message ✦'}</button></div>}</section>}
        {step === 4 && <section className="max-w-4xl mx-auto mt-12"><div className="text-center"><div className="text-2xl text-amber-100">☾ ✦ ☽</div><div className="text-xs uppercase tracking-[0.25em] text-amber-100/65 mt-3">{lang === 'en' ? 'Your first reading' : 'Votre premier éclairage'}</div><h2 className="text-3xl md:text-5xl font-serif mt-3">{lang === 'en' ? 'The cards have begun to speak' : 'Les cartes ont commencé à parler'}</h2><p className="mt-4 max-w-2xl mx-auto text-violet-200 leading-8">{lang === 'en' ? 'Each card reveals a fragment. The deeper meaning appears in the way they answer one another.' : 'Chaque carte révèle un fragment. Le sens le plus profond apparaît dans la manière dont elles se répondent.'}</p></div><div className="mt-8 space-y-4">{cards.map((c, i) => <article key={`${c.name}-${i}`} className="rounded-2xl bg-white/[0.055] border border-white/10 p-5 md:p-6"><div className="text-xs uppercase tracking-[0.18em] text-amber-100/65">{labels[i]}</div><h3 className="font-serif text-xl mt-1">{c.name}</h3><p className="mt-3 leading-8 text-violet-100">{freeCardReading(c, lang)}</p></article>)}</div><div className="mt-8 rounded-[28px] border border-amber-100/25 bg-gradient-to-b from-amber-100/[0.09] to-white/[0.03] p-7 md:p-9 text-center shadow-2xl"><div className="text-2xl">✦</div><h2 className="text-2xl md:text-4xl font-serif mt-3">{lang === 'en' ? 'Your spread holds more than five separate messages' : 'Votre tirage contient bien plus que des cartes isolées'}</h2><p className="mt-4 max-w-2xl mx-auto text-violet-100 leading-8">{lang === 'en' ? 'The full reading reveals what links the cards together, what remains hidden, where tensions appear and what direction the spread may be opening.' : 'La lecture complète révèle ce qui relie les cartes entre elles, ce qui reste encore dans l’ombre, où se situent les tensions et quelle direction le tirage semble ouvrir.'}</p><div className="grid md:grid-cols-3 gap-3 mt-7 text-left">{[lang === 'en' ? 'The dialogue between the cards' : 'Le dialogue entre les cartes', lang === 'en' ? 'What your question awakens' : 'Ce que votre question met en mouvement', lang === 'en' ? 'The deeper symbolic message' : 'Le message symbolique profond'].map(label => <div key={label} className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="text-xl text-amber-100/70">✦</div><div className="mt-3 text-violet-100">{label}</div></div>)}</div><button onClick={goPremium} className="mt-8 bg-amber-200 hover:bg-amber-100 text-violet-950 px-9 py-4 rounded-full font-semibold shadow-lg transition text-lg">{lang === 'en' ? 'Unlock my complete reading · €19 ✦' : 'Débloquer ma lecture complète · 19 € ✦'}</button><p className="mt-4 text-sm text-violet-400">{lang === 'en' ? 'Secure payment by Stripe. Your question and spread are preserved.' : 'Paiement sécurisé par Stripe. Votre question et votre tirage sont conservés.'}</p></div><div className="mt-8 rounded-[28px] bg-white/[0.045] border border-white/10 p-6 md:p-8"><div className="text-center"><div className="text-xs uppercase tracking-[0.22em] text-violet-300">{lang === 'en' ? 'And if a question remains…' : 'Et si une question demeure…'}</div><h3 className="text-2xl md:text-3xl font-serif mt-3">{lang === 'en' ? 'Continue privately with Nanou' : 'Poursuivez en privé avec Nanou'}</h3><p className="mt-3 text-violet-200 leading-7 max-w-2xl mx-auto">{lang === 'en' ? 'After the Premium reading, you can continue the exchange directly with Nanou in the secure private chat.' : 'Après la lecture Premium, vous pourrez prolonger l’échange directement avec Nanou dans le chat privé sécurisé.'}</p></div><div className="mt-6"><LiveChatPromo /></div></div><div className="mt-8 flex flex-wrap justify-center gap-4"><button onClick={restart} className="text-sm underline text-violet-300">{lang === 'en' ? 'Begin another reading' : 'Commencer un autre tirage'}</button><a href="/jeu" className="text-sm underline text-violet-300">{lang === 'en' ? 'View the Tarot de Marseille deck' : 'Voir le jeu du Tarot de Marseille'}</a></div></section>}
      </main>
      <style jsx global>{`
        @keyframes cardReveal { 0% { opacity:0; transform:translateY(-20px) rotateY(90deg) scale(.94); } 55% { opacity:1; transform:translateY(4px) rotateY(12deg) scale(1.02); } 100% { opacity:1; transform:translateY(0) rotateY(0) scale(1); } }
        .free-tarot-deck { position:relative; width:168px; height:258px; border:0; padding:0; background:transparent; cursor:pointer; filter:drop-shadow(0 22px 28px rgba(0,0,0,.42)); transition:transform .25s ease,filter .25s ease; }
        .free-tarot-deck:hover { transform:translateY(-5px) scale(1.025); filter:drop-shadow(0 28px 32px rgba(0,0,0,.48)); }
        .free-tarot-deck:active { transform:translateY(2px) scale(.985); }
        .free-deck-shadow,.free-deck-face { position:absolute; inset:0; border-radius:16px; }
        .free-deck-shadow { background:#281538; border:1px solid rgba(255,240,205,.22); }
        .free-deck-shadow-1 { transform:translate(9px,8px) rotate(2.2deg); opacity:.70; }
        .free-deck-shadow-2 { transform:translate(5px,4px) rotate(1deg); opacity:.86; }
        .free-deck-face { display:flex; align-items:center; justify-content:center; color:#f0dca6; background:radial-gradient(circle at center,rgba(245,216,153,.15) 0 20%,transparent 21%),repeating-radial-gradient(circle at center,transparent 0 12px,rgba(245,216,153,.08) 13px 14px),linear-gradient(145deg,#3b1d50,#1b1026); border:2px solid rgba(245,216,153,.58); box-shadow:inset 0 0 0 8px rgba(20,8,28,.62); overflow:hidden; }
        .free-deck-star { font-size:54px; text-shadow:0 0 22px rgba(240,220,166,.38); }
        .free-deck-moon { position:absolute; top:30px; left:24px; font-size:25px; opacity:.82; }
        .free-deck-moon-right { top:auto; left:auto; right:24px; bottom:30px; }
        .tarot-cross { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); grid-template-rows:repeat(3,auto); align-items:center; justify-items:center; width:100%; max-width:760px; gap:10px; }
        .cross-card { display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:0; }
        .cross-left { grid-column:1; grid-row:2; } .cross-right { grid-column:3; grid-row:2; } .cross-top { grid-column:2; grid-row:1; } .cross-bottom { grid-column:2; grid-row:3; } .cross-center { grid-column:2; grid-row:2; }
        .cross-label { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:rgba(245,230,255,.65); white-space:nowrap; }
        @media (max-width:639px) { .tarot-cross { max-width:390px; gap:0; } .cross-card { width:108px; height:205px; } .cross-card > div:last-child { transform:scale(.60); transform-origin:center center; } .cross-label { margin-bottom:-22px; font-size:9px; z-index:2; } }
      `}</style>
    </div>
  )
}
