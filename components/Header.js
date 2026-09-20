import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Header({ locale }) {
  const router = useRouter()
  const lang = locale || (router.query.lang === 'en' ? 'en' : 'fr')
  const offerPage = router.pathname === '/fr/lecture-premium' || router.pathname === '/en/premium-reading'
  const switchLang = (lng) => {
    const q = { ...router.query, lang: lng }
    router.push({ pathname: router.pathname, query: q }, undefined, { shallow: true })
  }
  return <header className="p-4 flex flex-wrap items-center justify-between gap-4">
    <Link href={lang === 'fr' ? '/' : '/?lang=en'} className="flex items-center gap-2">
      <img src="/logo-nanou.svg" alt="" className="w-10 h-10" />
      <span><span className="block font-semibold text-lg">{lang === 'fr' ? 'Les Tarots de Nanou' : 'Nanou’s Tarot'}</span><span className="block text-xs text-violet-200">{lang === 'fr' ? 'par 1001 Perspectives' : 'by 1001 Perspectives'}</span></span>
    </Link>
    <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'}>
      <Link href={lang === 'fr' ? '/' : '/?lang=en'} className="px-3 py-2 rounded bg-white/10">{lang === 'fr' ? 'Tirage gratuit' : 'Free reading'}</Link>
      <Link href={lang === 'fr' ? '/fr/lecture-premium' : '/en/premium-reading'} className="px-3 py-2 rounded bg-white/10">{lang === 'fr' ? 'Lecture Premium · 19 €' : 'Premium reading · €19'}</Link>
      <Link href="/jeu" className="px-3 py-2 rounded bg-white/10">{lang === 'fr' ? 'Voir le jeu' : 'View deck'}</Link>
      {offerPage ? <><Link href="/fr/lecture-premium" hrefLang="fr" lang="fr" className="px-2 py-2 rounded bg-white/10">FR</Link><Link href="/en/premium-reading" hrefLang="en" lang="en" className="px-2 py-2 rounded bg-white/10">EN</Link></> : <><button type="button" onClick={() => switchLang('fr')} className={`px-2 py-2 rounded ${lang === 'fr' ? 'bg-white/20' : 'bg-white/10'}`}>FR</button><button type="button" onClick={() => switchLang('en')} className={`px-2 py-2 rounded ${lang === 'en' ? 'bg-white/20' : 'bg-white/10'}`}>EN</button></>}
    </nav>
  </header>
}
