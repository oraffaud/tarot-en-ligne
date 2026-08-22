import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

function money(cents, lang) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

const I18N = {
  fr: {
    ownerTitle: 'Espace consultante — Nanou', customerTitle: 'Consultation privée avec Nanou', status: 'Statut', active: 'Consultation active', ended: 'Consultation terminée', paymentCheck: 'Paiement à vérifier', billed: 'Facturé', client: 'Client', nextBlock: 'Prochaine tranche dans',
    imminentTitle: 'Nouveau paiement imminent.', imminentBody: "Une nouvelle tranche de 10 minutes à 39,90 € sera débitée à la fin du compte à rebours. Terminez la consultation avant l'échéance pour éviter ce débit.", processing: 'Traitement en cours…', loadError: 'Impossible de charger la consultation', renewError: 'Le renouvellement a échoué', sendError: 'Envoi impossible', confirmEnd: 'Terminer cette consultation ? Aucun nouveau débit ne sera déclenché.', empty: 'La conversation peut commencer.', ownerPlaceholder: 'Répondre au client…', customerPlaceholder: 'Écrire à Nanou…', send: 'Envoyer', end: 'Terminer la consultation', diagnostic: 'Diagnostic Preview', ownerUrl: 'URL propriétaire de test',
    translationTitle: 'Traduction des messages client', translationSubtitle: 'Les messages reçus sont traduits automatiquement dans cette fenêtre, sans modifier la conversation originale.', translationEmpty: 'Aucun message client à traduire pour le moment.', translating: 'Traduction en cours…', translationError: 'La traduction automatique est momentanément indisponible.', original: 'Original', translated: 'Traduction'
  },
  en: {
    ownerTitle: 'Consultant area — Nanou', customerTitle: 'Private consultation with Nanou', status: 'Status', active: 'Consultation active', ended: 'Consultation ended', paymentCheck: 'Payment to verify', billed: 'Billed', client: 'Client', nextBlock: 'Next billing block in',
    imminentTitle: 'New payment imminent.', imminentBody: 'A new 10-minute block of €39.90 will be charged when the countdown ends. End the consultation before then to avoid this charge.', processing: 'Processing…', loadError: 'Unable to load the consultation', renewError: 'Renewal failed', sendError: 'Unable to send', confirmEnd: 'End this consultation? No further payment will be charged.', empty: 'The conversation can begin.', ownerPlaceholder: 'Reply to the client…', customerPlaceholder: 'Write to Nanou…', send: 'Send', end: 'End consultation', diagnostic: 'Preview diagnostic', ownerUrl: 'Test owner URL',
    translationTitle: 'Client message translation', translationSubtitle: 'Incoming client messages are automatically translated in this separate pane without altering the original conversation.', translationEmpty: 'No client messages to translate yet.', translating: 'Translating…', translationError: 'Automatic translation is temporarily unavailable.', original: 'Original', translated: 'Translation'
  }
}

export default function PrivateChatRoom({ id, token, role, ownerPreviewUrl = '' }) {
  const router = useRouter()
  const lang = router.query.lang === 'en' ? 'en' : 'fr'
  const t = I18N[lang]
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [translations, setTranslations] = useState({})
  const [translating, setTranslating] = useState(false)
  const [translationError, setTranslationError] = useState('')
  const renewed = useRef(new Set())
  const translationInFlight = useRef(false)

  function switchLang(nextLang) {
    const query = { ...router.query, lang: nextLang }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  async function refresh() {
    if (!id || !token) return
    const r = await fetch(`/api/chat/room?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&role=${role}`)
    const data = await r.json().catch(() => ({}))
    if (!r.ok) { setError(data.error || t.loadError); return }
    setRoom(data.session); setMessages(data.messages || [])
  }

  useEffect(() => { refresh(); const p = setInterval(refresh, 2500); return () => clearInterval(p) }, [id, token, role, lang])
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => { setTranslations({}); setTranslationError('') }, [lang])

  useEffect(() => {
    if (role !== 'owner' || !id || !token || translationInFlight.current) return
    const missing = messages.filter(m => m.role === 'customer' && !translations[m.id]).slice(0, 20)
    if (!missing.length) return

    translationInFlight.current = true
    setTranslating(true)
    setTranslationError('')
    ;(async () => {
      try {
        const r = await fetch('/api/chat/translate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, token, target_lang: lang, messages: missing.map(m => ({ id: m.id, body: m.body })) })
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || t.translationError)
        setTranslations(prev => ({ ...prev, ...(data.translations || {}) }))
      } catch {
        setTranslationError(t.translationError)
      } finally {
        translationInFlight.current = false
        setTranslating(false)
      }
    })()
  }, [messages, translations, role, id, token, lang])

  const timing = useMemo(() => {
    if (!room?.started_at) return { remaining: 0, warn: false, dueBlock: 1, elapsed: 0 }
    const blockSeconds = room.accelerated ? 60 : 600
    const elapsed = Math.max(0, Math.floor((now - new Date(room.started_at).getTime()) / 1000))
    const completedBlocks = Math.floor(elapsed / blockSeconds)
    const into = elapsed % blockSeconds
    const remaining = into === 0 && elapsed > 0 ? 0 : blockSeconds - into
    return { remaining, warn: elapsed > 0 && remaining > 0 && remaining <= (room.accelerated ? 10 : 60), dueBlock: completedBlocks + 1, elapsed }
  }, [room, now])

  useEffect(() => {
    if (role !== 'customer' || !room || room.status !== 'active') return
    const blockSeconds = room.accelerated ? 60 : 600
    const dueBlock = Math.floor((timing.elapsed || 0) / blockSeconds) + 1
    if (dueBlock <= room.billing_block || renewed.current.has(dueBlock)) return
    renewed.current.add(dueBlock)
    ;(async () => {
      setBusy(true); setError('')
      try {
        const r = await fetch('/api/chat/renew', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, block: dueBlock }) })
        const data = await r.json().catch(() => ({}))
        if (!r.ok || !data.paid) throw new Error(data.detail || data.error || t.renewError)
        await refresh()
      } catch (e) {
        renewed.current.delete(dueBlock); setError(e.message)
      } finally { setBusy(false) }
    })()
  }, [timing.elapsed, room, role, id, token, lang])

  async function send() {
    const body = text.trim(); if (!body || busy) return
    setBusy(true); setError('')
    const r = await fetch('/api/chat/room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, role, body }) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) setError(data.error || t.sendError); else setText('')
    await refresh(); setBusy(false)
  }

  async function end() {
    if (!confirm(t.confirmEnd)) return
    await fetch('/api/chat/room', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, role }) })
    await refresh()
  }

  const mm = String(Math.floor(timing.remaining / 60)).padStart(2, '0')
  const ss = String(timing.remaining % 60).padStart(2, '0')
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR'
  const customerMessages = messages.filter(m => m.role === 'customer')

  return <main className="max-w-5xl mx-auto px-5 py-8 text-white">
    <div className="flex justify-end gap-2 mb-2"><button onClick={() => switchLang('fr')} className={`px-3 py-1 rounded-full text-sm ${lang === 'fr' ? 'bg-white/20' : 'bg-white/10'}`}>FR</button><button onClick={() => switchLang('en')} className={`px-3 py-1 rounded-full text-sm ${lang === 'en' ? 'bg-white/20' : 'bg-white/10'}`}>EN</button></div>
    <div className="text-center"><div className="text-3xl">☾ ✦ ☽</div><h1 className="font-serif text-4xl mt-3">{role === 'owner' ? t.ownerTitle : t.customerTitle}</h1></div>

    <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[0.055] p-6">
      <div className="flex flex-wrap justify-between gap-4"><div><div className="text-xs uppercase tracking-[.18em] text-violet-300">{t.status}</div><div className="text-xl mt-1">{room?.status === 'active' ? t.active : room?.status === 'ended' ? t.ended : t.paymentCheck}</div></div><div className="text-right"><div className="text-xs uppercase tracking-[.18em] text-violet-300">{t.billed}</div><div className="text-xl mt-1">{money(room?.amount_paid || 3990, lang)}</div></div></div>
      {role === 'owner' && room?.customer_email && <div className="mt-3 text-sm text-violet-200">{t.client} : {room.customer_email}</div>}
      {room?.status === 'active' && <div className="mt-5 rounded-2xl bg-black/20 p-5 text-center"><div className="text-xs uppercase tracking-[.18em] text-violet-300">{t.nextBlock}</div><div className="font-mono text-4xl mt-2">{mm}:{ss}</div></div>}
      {role === 'customer' && timing.warn && room?.status === 'active' && <div className="mt-4 rounded-2xl border border-amber-200/50 bg-amber-100/10 p-4 text-amber-100"><strong>{t.imminentTitle}</strong> {t.imminentBody}</div>}
      {busy && <div className="mt-3 text-amber-100">{t.processing}</div>}{error && <div className="mt-3 text-red-200">{error}</div>}
    </section>

    <div className={role === 'owner' ? 'mt-5 grid lg:grid-cols-2 gap-5 items-start' : 'mt-5'}>
      <section className="rounded-[28px] border border-white/10 bg-white/[0.055] p-5">
        <div className="h-[430px] overflow-y-auto rounded-2xl bg-black/15 p-4 space-y-3">
          {messages.length === 0 && <div className="text-violet-300">{t.empty}</div>}
          {messages.map(m => <div key={m.id} className={m.role === role ? 'text-right' : 'text-left'}><div className={`inline-block max-w-[82%] rounded-2xl px-4 py-3 ${m.role === role ? 'bg-amber-100 text-violet-950' : 'bg-white/10 text-white'}`}><div className="whitespace-pre-wrap">{m.body}</div><div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div></div></div>)}
        </div>
        <div className="mt-4 flex gap-3"><textarea value={text} onChange={e => setText(e.target.value)} disabled={room?.status !== 'active'} rows={2} className="flex-1 rounded-2xl p-3 text-violet-950" placeholder={role === 'owner' ? t.ownerPlaceholder : t.customerPlaceholder} /><button onClick={send} disabled={busy || room?.status !== 'active'} className="rounded-2xl bg-amber-200 text-violet-950 px-5 font-semibold disabled:opacity-40">{t.send}</button></div>
        <button onClick={end} disabled={room?.status !== 'active'} className="mt-4 w-full rounded-full bg-white/10 border border-white/15 py-3 disabled:opacity-40">{t.end}</button>
      </section>

      {role === 'owner' && <section className="rounded-[28px] border border-amber-200/25 bg-amber-100/[0.06] p-5 lg:sticky lg:top-5">
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.18em] text-amber-200/80">{t.translationTitle}</div><p className="mt-2 text-sm text-violet-200 leading-6">{t.translationSubtitle}</p></div>{translating && <div className="text-xs text-amber-100 whitespace-nowrap">{t.translating}</div>}</div>
        {translationError && <div className="mt-3 rounded-xl bg-red-400/10 border border-red-300/20 p-3 text-sm text-red-200">{translationError}</div>}
        <div className="mt-4 h-[430px] overflow-y-auto rounded-2xl bg-black/20 p-4 space-y-4">
          {customerMessages.length === 0 && <div className="text-violet-300">{t.translationEmpty}</div>}
          {customerMessages.map(m => <article key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"><div className="text-[10px] uppercase tracking-[.16em] text-violet-300">{t.original}</div><div className="mt-1 text-sm text-violet-200 whitespace-pre-wrap">{m.body}</div><div className="mt-3 text-[10px] uppercase tracking-[.16em] text-amber-200">{t.translated}</div><div className="mt-1 leading-6 whitespace-pre-wrap">{translations[m.id] || (translating ? t.translating : '—')}</div><div className="mt-2 text-[10px] text-violet-400">{new Date(m.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div></article>)}
        </div>
      </section>}
    </div>

    {role === 'customer' && ownerPreviewUrl && <section className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-100/10 p-4 text-sm"><strong>{t.diagnostic} :</strong> {t.ownerUrl} : <a className="underline break-all" href={ownerPreviewUrl}>{ownerPreviewUrl}</a></section>}
  </main>
}
