import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

const COPY = {
  fr: {
    title: 'Consultation privée avec Nanou', intro: '39,90 € TTC pour 10 minutes, puis renouvellement automatique de 39,90 € TTC par tranche supplémentaire de 10 minutes.', before: 'Avant de commencer',
    detail: 'Le paiement initial de 39,90 € ouvre les 10 premières minutes. Tant que la consultation reste active, une nouvelle tranche de 10 minutes à 39,90 € est débitée automatiquement. Un avertissement apparaît 1 minute avant chaque renouvellement. La consultation est plafonnée à 4 tranches, soit 40 minutes et 159,60 € TTC maximum.',
    c1: 'J’accepte les CGV/CGU et la facturation automatique : 39,90 € TTC pour les 10 premières minutes, puis 39,90 € TTC par tranche supplémentaire de 10 minutes tant que je ne mets pas fin à la consultation. Un avertissement m’est présenté 1 minute avant chaque renouvellement.',
    c2: 'Je demande expressément que la consultation commence immédiatement avant l’expiration du délai légal de rétractation et reconnais les conséquences prévues par la réglementation applicable sur mon droit de rétractation une fois la prestation exécutée.',
    now: 'À payer maintenant : 39,90 € TTC', then: 'Puis : 39,90 € TTC par tranche supplémentaire de 10 minutes, dans la limite de 159,60 € TTC / 40 minutes.', button: 'Payer 39,90 € et commencer la consultation', terms: 'Lire les CGV/CGU', error: 'Checkout indisponible'
  },
  en: {
    title: 'Private consultation with Nanou', intro: '€39.90 including VAT for 10 minutes, then automatic renewal at €39.90 for each additional 10-minute block.', before: 'Before you begin',
    detail: 'The initial €39.90 payment opens the first 10 minutes. While the consultation remains active, each additional 10-minute block is automatically charged at €39.90. A warning appears 1 minute before each renewal. The consultation is capped at 4 blocks: 40 minutes and €159.60 including VAT maximum.',
    c1: 'I accept the Terms and automatic billing: €39.90 including VAT for the first 10 minutes, followed by €39.90 including VAT for each additional 10-minute block until I end the consultation. I will receive a warning 1 minute before each renewal.',
    c2: 'I expressly request that the consultation begin immediately before expiry of the statutory withdrawal period and acknowledge the consequences under applicable law for my withdrawal right once the service has been performed.',
    now: 'Pay now: €39.90 including VAT', then: 'Then: €39.90 including VAT for each additional 10-minute block, capped at €159.60 / 40 minutes.', button: 'Pay €39.90 and start consultation', terms: 'Read the Terms', error: 'Checkout unavailable'
  }
}

export default function ChatPreview() {
  const router = useRouter(); const lang = router.query.lang === 'en' ? 'en' : 'fr'; const t = COPY[lang]
  const [termsAccepted, setTermsAccepted] = useState(false); const [immediateAccepted, setImmediateAccepted] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const accelerated = router.query.accelerated === '1'
  async function startCheckout() {
    if (!termsAccepted || !immediateAccepted || busy) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/chat/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accelerated, lang, termsAccepted, immediateAccepted, termsVersion: '2026-08-18' }) })
      const data = await r.json().catch(() => ({})); if (!r.ok || !data.url) throw new Error(data.error || t.error); window.location.href = data.url
    } catch (e) { setError(e.message); setBusy(false) }
  }
  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white px-5 py-10"><Head><title>{t.title}</title></Head><main className="max-w-3xl mx-auto">
    <div className="flex justify-end gap-2"><button onClick={() => router.push({pathname:router.pathname,query:{...router.query,lang:'fr'}},undefined,{shallow:true})}>FR</button><button onClick={() => router.push({pathname:router.pathname,query:{...router.query,lang:'en'}},undefined,{shallow:true})}>EN</button></div>
    <div className="text-center"><div className="text-3xl">☾ ✦ ☽</div><h1 className="text-4xl font-serif mt-3">{t.title}</h1><p className="mt-4 text-violet-200">{t.intro}</p></div>
    <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl"><h2 className="font-serif text-2xl">{t.before}</h2><p className="mt-3 leading-7 text-violet-100">{t.detail}</p>
      <label className="mt-5 flex gap-3 items-start rounded-2xl bg-black/15 border border-white/10 p-4"><input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1"/><span>{t.c1} <a className="underline text-amber-100" href={`/conditions?lang=${lang}`} target="_blank" rel="noreferrer">{t.terms}</a>.</span></label>
      <label className="mt-3 flex gap-3 items-start rounded-2xl bg-black/15 border border-white/10 p-4"><input type="checkbox" checked={immediateAccepted} onChange={e=>setImmediateAccepted(e.target.checked)} className="mt-1"/><span>{t.c2}</span></label>
      <div className="mt-5 rounded-2xl border border-amber-200/30 bg-amber-100/10 p-4"><strong>{t.now}</strong><div className="mt-1 text-sm">{t.then}</div></div>
      <button disabled={!termsAccepted||!immediateAccepted||busy} onClick={startCheckout} className="mt-6 w-full rounded-full bg-amber-200 text-violet-950 py-4 font-semibold disabled:opacity-40">{busy?'…':t.button}</button>{error&&<p className="mt-4 text-red-200">{error}</p>}
    </section>{accelerated&&<div className="mt-2 text-center text-xs text-amber-100/70">Simulation accélérée : 60 s = 10 min.</div>}
  </main></div>
}
