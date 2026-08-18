import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function ChatPreview() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const accelerated = router.query.accelerated === '1'

  async function startCheckout() {
    if (!accepted || busy) return
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/chat/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accelerated })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.url) throw new Error(data.error || 'Checkout indisponible')
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white px-5 py-10">
    <Head><title>Prototype chat — facturation 39,90 € / 10 min</title></Head>
    <main className="max-w-3xl mx-auto">
      <div className="text-center">
        <div className="text-3xl">☾ ✦ ☽</div>
        <div className="text-xs uppercase tracking-[0.24em] text-amber-100/60 mt-3">Prototype hors production</div>
        <h1 className="text-4xl font-serif mt-3">Consultation privée avec Nanou</h1>
        <p className="mt-4 text-violet-200">39,90 € pour les 10 premières minutes, puis 39,90 € par tranche supplémentaire de 10 minutes.</p>
      </div>

      <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl">
        <h2 className="font-serif text-2xl">Avant de commencer</h2>
        <p className="mt-3 leading-7 text-violet-100">Le paiement initial de 39,90 € ouvre les 10 premières minutes. Tant que la consultation reste active, une nouvelle tranche de 10 minutes à 39,90 € est débitée automatiquement. Un message d’alerte apparaît 1 minute avant chaque nouveau débit.</p>
        <label className="mt-5 flex gap-3 items-start rounded-2xl bg-black/15 border border-white/10 p-4">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1" />
          <span>J’accepte le paiement initial de 39,90 € et les débits automatiques de 39,90 € toutes les 10 minutes tant que la consultation reste active.</span>
        </label>
        <button disabled={!accepted || busy} onClick={startCheckout} className="mt-6 w-full rounded-full bg-amber-200 text-violet-950 py-4 font-semibold disabled:opacity-40">{busy ? 'Ouverture du paiement…' : 'Commencer la consultation · 39,90 €'}</button>
        {error && <p className="mt-4 text-red-200">{error}</p>}
      </section>

      <div className="mt-5 text-center text-xs text-violet-400">Mode test Stripe uniquement. Après paiement, une salle privée client / Nanou est créée automatiquement et Nanou reçoit son lien par e-mail.</div>
      {accelerated && <div className="mt-2 text-center text-xs text-amber-100/70">Simulation accélérée active : 60 s = 10 min, avertissement 10 s avant débit.</div>}
    </main>
  </div>
}
