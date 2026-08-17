import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function PremiumStart() {
  const [message, setMessage] = useState('Préparation de votre lecture Premium…')

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const raw = window.localStorage.getItem('nanou_premium_context')
        if (!raw) throw new Error('missing context')
        const context = JSON.parse(raw)
        const r = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context })
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok || !data.url) throw new Error(data.error || 'checkout unavailable')
        if (!cancelled) window.location.replace(data.url)
      } catch (e) {
        if (!cancelled) setMessage('Impossible d’ouvrir le paiement sécurisé. Revenez au tirage et réessayez.')
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white flex items-center justify-center px-6">
    <Head><title>Lecture Premium — Paiement sécurisé</title></Head>
    <div className="max-w-xl w-full rounded-[28px] border border-white/10 bg-white/[0.055] p-8 text-center shadow-2xl">
      <div className="text-3xl">☾ ✦ ☽</div>
      <h1 className="mt-4 text-3xl font-serif">Votre lecture vous attend</h1>
      <p className="mt-4 text-violet-200 leading-7">{message}</p>
      <p className="mt-5 text-sm text-violet-400">Paiement unique de 19,90 € · sécurisé par Stripe</p>
    </div>
  </div>
}
