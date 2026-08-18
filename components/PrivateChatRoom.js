import { useEffect, useMemo, useRef, useState } from 'react'

function money(cents) { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100) }

export default function PrivateChatRoom({ id, token, role, ownerPreviewUrl = '' }) {
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const renewed = useRef(new Set())

  async function refresh() {
    if (!id || !token) return
    const r = await fetch(`/api/chat/room?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&role=${role}`)
    const data = await r.json().catch(() => ({}))
    if (!r.ok) { setError(data.error || 'Impossible de charger la consultation'); return }
    setRoom(data.session); setMessages(data.messages || [])
  }

  useEffect(() => { refresh(); const p = setInterval(refresh, 2500); return () => clearInterval(p) }, [id, token, role])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const timing = useMemo(() => {
    if (!room?.started_at) return { remaining: 0, warn: false, dueBlock: 1, elapsed: 0 }
    const blockSeconds = room.accelerated ? 60 : 600
    const elapsed = Math.max(0, Math.floor((now - new Date(room.started_at).getTime()) / 1000))
    const completedBlocks = Math.floor(elapsed / blockSeconds)
    const into = elapsed % blockSeconds
    const remaining = into === 0 && elapsed > 0 ? 0 : blockSeconds - into
    return {
      remaining,
      warn: elapsed > 0 && remaining > 0 && remaining <= (room.accelerated ? 10 : 60),
      dueBlock: completedBlocks + 1,
      elapsed
    }
  }, [room, now])

  useEffect(() => {
    if (role !== 'customer' || !room || room.status !== 'active') return
    const blockSeconds = room.accelerated ? 60 : 600
    const elapsed = timing.elapsed || 0
    const dueBlock = Math.floor(elapsed / blockSeconds) + 1
    if (dueBlock <= room.billing_block || renewed.current.has(dueBlock)) return
    renewed.current.add(dueBlock)
    ;(async () => {
      setBusy(true); setError('')
      try {
        const r = await fetch('/api/chat/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, token, block: dueBlock })
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok || !data.paid) throw new Error(data.detail || data.error || 'Le renouvellement a échoué')
        await refresh()
      } catch (e) {
        renewed.current.delete(dueBlock)
        setError(e.message)
      } finally {
        setBusy(false)
      }
    })()
  }, [timing.elapsed, room, role, id, token])

  async function send() {
    const body = text.trim(); if (!body || busy) return
    setBusy(true); setError('')
    const r = await fetch('/api/chat/room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, role, body }) })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) setError(data.error || 'Envoi impossible'); else setText('')
    await refresh(); setBusy(false)
  }

  async function end() {
    if (!confirm('Terminer cette consultation ? Aucun nouveau débit ne sera déclenché.')) return
    await fetch('/api/chat/room', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token, role }) })
    await refresh()
  }

  const mm = String(Math.floor(timing.remaining / 60)).padStart(2, '0')
  const ss = String(timing.remaining % 60).padStart(2, '0')

  return <main className="max-w-4xl mx-auto px-5 py-8 text-white">
    <div className="text-center"><div className="text-3xl">☾ ✦ ☽</div><h1 className="font-serif text-4xl mt-3">{role === 'owner' ? 'Espace consultante — Nanou' : 'Consultation privée avec Nanou'}</h1></div>
    <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[0.055] p-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div><div className="text-xs uppercase tracking-[.18em] text-violet-300">Statut</div><div className="text-xl mt-1">{room?.status === 'active' ? 'Consultation active' : room?.status === 'ended' ? 'Consultation terminée' : 'Paiement à vérifier'}</div></div>
        <div className="text-right"><div className="text-xs uppercase tracking-[.18em] text-violet-300">Facturé</div><div className="text-xl mt-1">{money(room?.amount_paid || 3990)}</div></div>
      </div>
      {role === 'owner' && room?.customer_email && <div className="mt-3 text-sm text-violet-200">Client : {room.customer_email}</div>}
      {room?.status === 'active' && <div className="mt-5 rounded-2xl bg-black/20 p-5 text-center"><div className="text-xs uppercase tracking-[.18em] text-violet-300">Prochaine tranche dans</div><div className="font-mono text-4xl mt-2">{mm}:{ss}</div></div>}
      {role === 'customer' && timing.warn && room?.status === 'active' && <div className="mt-4 rounded-2xl border border-amber-200/50 bg-amber-100/10 p-4 text-amber-100"><strong>Nouveau paiement imminent.</strong> Une nouvelle tranche de 10 minutes à 39,90 € sera débitée à la fin du compte à rebours. Terminez la consultation avant l'échéance pour éviter ce débit.</div>}
      {busy && <div className="mt-3 text-amber-100">Traitement en cours…</div>}
      {error && <div className="mt-3 text-red-200">{error}</div>}
    </section>

    <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.055] p-5">
      <div className="h-[430px] overflow-y-auto rounded-2xl bg-black/15 p-4 space-y-3">
        {messages.length === 0 && <div className="text-violet-300">La conversation peut commencer.</div>}
        {messages.map(m => <div key={m.id} className={m.role === role ? 'text-right' : 'text-left'}><div className={`inline-block max-w-[82%] rounded-2xl px-4 py-3 ${m.role === role ? 'bg-amber-100 text-violet-950' : 'bg-white/10 text-white'}`}><div className="whitespace-pre-wrap">{m.body}</div><div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div></div>)}
      </div>
      <div className="mt-4 flex gap-3"><textarea value={text} onChange={e => setText(e.target.value)} disabled={room?.status !== 'active'} rows={2} className="flex-1 rounded-2xl p-3 text-violet-950" placeholder={role === 'owner' ? 'Répondre au client…' : 'Écrire à Nanou…'} /><button onClick={send} disabled={busy || room?.status !== 'active'} className="rounded-2xl bg-amber-200 text-violet-950 px-5 font-semibold disabled:opacity-40">Envoyer</button></div>
      <button onClick={end} disabled={room?.status !== 'active'} className="mt-4 w-full rounded-full bg-white/10 border border-white/15 py-3 disabled:opacity-40">Terminer la consultation</button>
    </section>

    {role === 'customer' && ownerPreviewUrl && <section className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-100/10 p-4 text-sm"><strong>Diagnostic Preview :</strong> URL propriétaire de test : <a className="underline break-all" href={ownerPreviewUrl}>{ownerPreviewUrl}</a></section>}
  </main>
}
