import Head from 'next/head'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

const REAL_BLOCK_SECONDS = 10 * 60
const REAL_WARNING_SECONDS = 60
const FAST_BLOCK_SECONDS = 60
const FAST_WARNING_SECONDS = 10

function money(n) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n) }

export default function ChatPreview() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [billingBlock, setBillingBlock] = useState(1)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const chargedBlocks = useRef(new Set())

  const accelerated = router.query.accelerated === '1'
  const sessionId = typeof router.query.session_id === 'string' ? router.query.session_id : ''
  const blockSeconds = accelerated ? FAST_BLOCK_SECONDS : REAL_BLOCK_SECONDS
  const warningSeconds = accelerated ? FAST_WARNING_SECONDS : REAL_WARNING_SECONDS

  useEffect(() => {
    if (sessionId.startsWith('cs_test_')) {
      setRunning(true)
      setNotice('Paiement initial confirmé. La première tranche de 10 minutes est ouverte.')
    }
  }, [sessionId])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed(v => v + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const secondsIntoBlock = elapsed % blockSeconds
  const secondsRemaining = blockSeconds - secondsIntoBlock
  const shouldWarn = running && secondsRemaining <= warningSeconds && secondsRemaining > 0
  const displayedMinutes = accelerated ? Math.floor(elapsed / 6) : Math.floor(elapsed / 60)
  const totalCharged = billingBlock * 39.9

  useEffect(() => {
    if (!running || !sessionId || elapsed === 0) return
    if (elapsed % blockSeconds !== 0) return

    const nextBlock = Math.floor(elapsed / blockSeconds) + 1
    if (chargedBlocks.current.has(nextBlock)) return
    chargedBlocks.current.add(nextBlock)

    async function renew() {
      setBusy(true); setError('')
      try {
        const r = await fetch('/api/chat/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, block: nextBlock })
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok || !data.paid) throw new Error(data.detail || data.error || 'Paiement refusé')
        setBillingBlock(nextBlock)
        setNotice(`Nouvelle tranche activée : ${money(39.9)} débités. Vous disposez de 10 minutes supplémentaires.`)
      } catch (e) {
        setRunning(false)
        setError(`Le renouvellement automatique a échoué : ${e.message}. La session est mise en pause.`)
      } finally { setBusy(false) }
    }
    renew()
  }, [elapsed, running, sessionId, blockSeconds])

  async function startCheckout() {
    if (!accepted) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/chat/create-checkout', { method: 'POST' })
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.url) throw new Error(data.error || 'Checkout indisponible')
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const clock = useMemo(() => {
    const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0')
    const s = Math.floor(secondsRemaining % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }, [secondsRemaining])

  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white px-5 py-10">
    <Head><title>Prototype chat — facturation 39,90 € / 10 min</title></Head>
    <main className="max-w-3xl mx-auto">
      <div className="text-center"><div className="text-3xl">☾ ✦ ☽</div><div className="text-xs uppercase tracking-[0.24em] text-amber-100/60 mt-3">Prototype hors production</div><h1 className="text-4xl font-serif mt-3">Consultation privée avec Nanou</h1><p className="mt-4 text-violet-200">39,90 € pour les 10 premières minutes, puis 39,90 € par tranche supplémentaire de 10 minutes.</p></div>

      {!sessionId && <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl">
        <h2 className="font-serif text-2xl">Avant de commencer</h2>
        <p className="mt-3 leading-7 text-violet-100">Le paiement initial de 39,90 € ouvre les 10 premières minutes. Tant que la consultation reste active, une nouvelle tranche de 10 minutes à 39,90 € est débitée automatiquement. Un message d’alerte apparaît exactement 1 minute avant chaque nouveau débit.</p>
        <label className="mt-5 flex gap-3 items-start rounded-2xl bg-black/15 border border-white/10 p-4"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1"/><span>J’accepte le paiement initial de 39,90 € et les débits automatiques de 39,90 € toutes les 10 minutes tant que la consultation reste active.</span></label>
        <button disabled={!accepted || busy} onClick={startCheckout} className="mt-6 w-full rounded-full bg-amber-200 text-violet-950 py-4 font-semibold disabled:opacity-40">{busy ? 'Ouverture du paiement…' : 'Commencer la consultation · 39,90 €'}</button>
        {error && <p className="mt-4 text-red-200">{error}</p>}
      </section>}

      {sessionId && <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.18em] text-violet-300">Tranche active</div><div className="font-serif text-3xl mt-1">{billingBlock} × 10 min</div></div><div className="text-right"><div className="text-xs uppercase tracking-[0.18em] text-violet-300">Déjà facturé</div><div className="text-2xl font-semibold mt-1">{money(totalCharged)}</div></div></div>

        <div className="mt-7 rounded-2xl bg-black/20 border border-white/10 p-6 text-center"><div className="text-xs uppercase tracking-[0.18em] text-violet-300">Prochain renouvellement dans</div><div className="mt-2 font-mono text-5xl">{clock}</div><div className="mt-2 text-sm text-violet-300">Durée simulée : {displayedMinutes} min</div></div>

        {shouldWarn && <div className="mt-5 rounded-2xl border border-amber-200/50 bg-amber-100/10 p-5"><div className="font-semibold text-amber-100">Paiement dans 1 minute</div><p className="mt-2 text-violet-100">Dans {accelerated ? `${secondsRemaining} secondes (simulation)` : '1 minute'}, une nouvelle tranche de 10 minutes sera automatiquement débitée pour 39,90 €. Vous pouvez mettre fin à la consultation avant l’échéance pour éviter ce débit.</p></div>}
        {notice && <p className="mt-5 text-violet-100">{notice}</p>}
        {busy && <p className="mt-3 text-amber-100">Traitement du renouvellement automatique…</p>}
        {error && <p className="mt-5 text-red-200">{error}</p>}

        <div className="mt-7 rounded-2xl bg-black/15 border border-white/10 p-5 min-h-[210px]"><div className="text-xs uppercase tracking-[0.16em] text-violet-300">Zone chat — prototype</div><div className="mt-6 text-violet-200">L’interface de conversation sera branchée ici après validation du mécanisme de facturation.</div></div>
        <button onClick={() => setRunning(false)} disabled={!running} className="mt-5 w-full rounded-full bg-white/10 border border-white/15 py-3 disabled:opacity-40">Terminer la consultation</button>
      </section>}

      <div className="mt-5 text-center text-xs text-violet-400">Mode test Stripe uniquement. Aucun appel de cette branche n’accepte une clé Live et l’API refuse l’exécution en environnement Production.</div>
      {accelerated && <div className="mt-2 text-center text-xs text-amber-100/70">Simulation accélérée active : 60 s = 10 min, avertissement 10 s avant débit.</div>}
    </main>
  </div>
}
