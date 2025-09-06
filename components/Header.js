import { useRouter } from 'next/router'

export default function Header() {
  const router = useRouter();
  const lang = (router.query.lang === 'en') ? 'en' : 'fr';

  const switchLang = (lng) => {
    const q = { ...router.query, lang: lng };
    router.push({ pathname: router.pathname, query: q }, undefined, { shallow: true });
  };

  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <img src="/logo-nanou.svg" alt={lang==='fr' ? "Les tarots de Nanou" : "Nanou's Tarot"} className="w-10 h-10" />
        <span className="font-semibold text-lg">
          {lang === 'fr' ? "Les tarots de Nanou" : "Nanou's Tarot"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => switchLang('fr')}
          className={`px-2 py-1 rounded ${lang==='fr' ? 'bg-white/20' : 'bg-white/10'}`}
        >FR</button>
        <button
          onClick={() => switchLang('en')}
          className={`px-2 py-1 rounded ${lang==='en' ? 'bg-white/20' : 'bg-white/10'}`}
        >EN</button>
      </div>
    </header>
  );
}
