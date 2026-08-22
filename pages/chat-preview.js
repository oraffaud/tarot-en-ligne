import Head from 'next/head'
import { useRouter } from 'next/router'

const COPY = {
  fr: {
    title: 'Consultation privée avec Nanou',
    status: 'Consultation momentanément indisponible',
    intro: 'Nanou n’est pas disponible immédiatement. La prise de consultation par chat est temporairement fermée.',
    detail: 'Le service de notification par SMS est en cours de mise en place. Dès qu’il sera opérationnel, vous pourrez demander une consultation et Nanou sera sollicitée avant tout paiement.',
    button: 'Chat fermé pour le moment',
    note: 'Aucun paiement ne peut être effectué tant que le chat est fermé.',
    back: 'Revenir au tirage'
  },
  en: {
    title: 'Private consultation with Nanou',
    status: 'Consultation temporarily unavailable',
    intro: 'Nanou is not immediately available. Private chat consultations are temporarily closed.',
    detail: 'SMS notification is being configured. Once available, you will be able to request a consultation and Nanou will be contacted before any payment is taken.',
    button: 'Chat currently closed',
    note: 'No payment can be made while the chat is closed.',
    back: 'Return to the reading'
  }
}

export default function ChatPreview() {
  const router = useRouter()
  const lang = router.query.lang === 'en' ? 'en' : 'fr'
  const t = COPY[lang]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1022] via-[#2b1739] to-[#120b18] text-white px-5 py-10">
      <Head><title>{t.title}</title></Head>
      <main className="max-w-3xl mx-auto">
        <div className="flex justify-end gap-3 text-sm">
          <button onClick={() => router.push({ pathname: router.pathname, query: { ...router.query, lang: 'fr' } }, undefined, { shallow: true })}>FR</button>
          <button onClick={() => router.push({ pathname: router.pathname, query: { ...router.query, lang: 'en' } }, undefined, { shallow: true })}>EN</button>
        </div>

        <div className="text-center mt-6">
          <div className="text-3xl">☾ ✦ ☽</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-violet-200">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
            OFFLINE
          </div>
          <h1 className="text-4xl md:text-5xl font-serif mt-5">{t.title}</h1>
          <p className="mt-4 text-xl text-violet-100">{t.status}</p>
        </div>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.055] p-7 md:p-9 shadow-2xl text-center">
          <p className="text-lg leading-8 text-violet-100">{t.intro}</p>
          <p className="mt-5 leading-7 text-violet-200">{t.detail}</p>

          <button disabled className="mt-8 w-full rounded-full bg-white/10 border border-white/10 text-white/50 py-4 font-semibold cursor-not-allowed">
            {t.button}
          </button>
          <p className="mt-3 text-sm text-violet-300">{t.note}</p>

          <button onClick={() => router.back()} className="mt-7 text-sm underline underline-offset-4 text-amber-100/80 hover:text-amber-100">
            {t.back}
          </button>
        </section>
      </main>
    </div>
  )
}
