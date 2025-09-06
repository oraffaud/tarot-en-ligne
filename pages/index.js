import Head from 'next/head'
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'
import TarotChat from '../components/TarotChat'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

const MAJOR_ARCANA = [
  { name: "Le Mat (0)", up: "Nouveaux départs, foi", rev: "Imprudence, naïveté" },
  { name: "Le Magicien (I)", up: "Volonté, ressources", rev: "Manipulation, illusions" },
  { name: "La Papesse (II)", up: "Intuition, mystère", rev: "Secrets, blocage" },
  { name: "L’Impératrice (III)", up: "Abondance, soin", rev: "Dépendance, stagnation" },
  { name: "L’Empereur (IV)", up: "Structure, autorité", rev: "Rigidité, domination" },
  { name: "Le Pape (V)", up: "Tradition, guidance", rev: "Dogmatisme, rébellion" },
  { name: "Les Amoureux (VI)", up: "Choix, harmonie", rev: "Dissonance, doute" },
  { name: "Le Chariot (VII)", up: "Volonté, progrès", rev: "Dispersion, indécision" },
  { name: "La Force (VIII)", up: "Courage, maîtrise", rev: "Insécurité, impulsivité" },
  { name: "L’Hermite (IX)", up: "Recherche, sagesse", rev: "Isolement, fuite" },
  { name: "La Roue de Fortune (X)", up: "Cycles, tournant", rev: "Résistance au changement" },
  { name: "La Justice (XI)", up: "Équité, vérité", rev: "Injustice, déséquilibre" },
  { name: "Le Pendu (XII)", up: "Lâcher-prise, regard neuf", rev: "Blocage, stagnation" },
  { name: "La Mort (XIII)", up: "Transformation", rev: "Attachement, peur" },
  { name: "Tempérance (XIV)", up: "Modération, alchimie", rev: "Excès, impatience" },
  { name: "Le Diable (XV)", up: "Attachements, matérialisme", rev: "Libération" },
  { name: "La Tour (XVI)", up: "Révélation, rupture", rev: "Retard du nécessaire" },
  { name: "L’Étoile (XVII)", up: "Espoir, inspiration", rev: "Doute" },
  { name: "La Lune (XVIII)", up: "Rêves, intuition", rev: "Confusion, peur" },
  { name: "Le Soleil (XIX)", up: "Joie, clarté", rev: "Arrogance" },
  { name: "Le Jugement (XX)", up: "Réveil, bilan", rev: "Auto-critique, hésitation" },
  { name: "Le Monde (XXI)", up: "Accomplissement, unité", rev: "Boucle inachevée" },
];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const drawCards = (count) =>
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx }))).slice(0, count);

export default function Home() {
  const router = useRouter();
  const lang = router.query.lang === 'en' ? 'en' : 'fr';

  const ui = lang === 'en' ? {
    title: "Nanou’s Tarot — Online",
    heroH1: "Draw the cards, light your path",
    heroP: "Instant free draw. For a detailed, personalized reading, click Premium Reading.",
    newDraw: "New draw",
    premium: "Premium Reading — €19",
    result: (n) => `Current draw (${n} card${n>1?'s':''})`,
    opt1: "1 card",
    opt3: "3 cards (Past • Present • Future)",
    opt5: "5 cards (Simple cross)"
  } : {
    title: "Les tarots de Nanou — Tarot en ligne",
    heroH1: "Tirez les cartes, éclairez votre chemin",
    heroP: "Tirage instantané gratuit. Pour une lecture détaillée et personnalisée, cliquez sur Lecture Premium.",
    newDraw: "Nouveau tirage",
    premium: "Lecture Premium — 19€",
    result: (n) => `Tirage actuel (${n} carte${n>1?'s':''})`,
    opt1: "1 carte",
    opt3: "3 cartes (Passé • Présent • Futur)",
    opt5: "5 cartes (Croix simple)"
  };

  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(3);
  const [cards, setCards] = useState([]);

  useEffect(() => { setMounted(true); setCards(drawCards(3)); }, []);

  const onNewDraw = () => setCards(drawCards(count));
  const options = useMemo(() => ([
    { id: 1, label: ui.opt1 },
    { id: 3, label: ui.opt3 },
    { id: 5, label: ui.opt5 },
  ]), [ui]);

  const previewCards = mounted && cards.length ? cards.slice(0, Math.min(3, cards.length)) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 to-violet-700 text-white">
      <Head>
        <title>{ui.title}</title>
        <meta name="description" content={lang==='en' ? "Free draws and premium tarot readings online." : "Tirages gratuits et lectures premium de tarot en ligne."} />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6">
        <section className="grid md:grid-cols-2 gap-8 items-center py-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">{ui.heroH1}</h1>
            <p className="mb-6 text-violet-100">{ui.heroP}</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onNewDraw} className="bg-white/10 px-4 py-2 rounded-lg">{ui.newDraw}</button>
              <a href={PAYMENT_LINK} className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold">{ui.premium}</a>
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              {options.map(o => (
                <button
                  key={o.id}
                  onClick={() => setCount(o.id)}
                  className={`px-3 py-1 rounded-lg border border-white/20 ${count===o.id ? 'bg-white/20' : 'bg-white/5'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="space-x-[-40px] flex items-end">
              {previewCards.length > 0 ? (
                previewCards.map((c, i) => (
                  <TarotCard key={i} name={c.name} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
                ))
              ) : (
                <>
                  <div className="w-44 h-60 bg-white/10 rounded-xl" />
                  <div className="w-44 h-60 bg-white/10 rounded-xl" />
                  <div className="w-44 h-60 bg-white/10 rounded-xl" />
                </>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">{ui.result(count)}</h2>
          <div className={`grid gap-4 ${count===1?'grid-cols-1':'grid-cols-1 md:grid-cols-3'}`}>
            {mounted && cards.length > 0 ? (
              cards.slice(0, count).map((c, i) => (
                <TarotCard key={i} name={c.name} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
              ))
            ) : (
              Array.from({length: count}).map((_,i)=>(
                <div key={i} className="w-44 h-60 bg-white/10 rounded-xl" />
              ))
            )}
          </div>
        </section>

        <TarotChat cards={cards} spreadSize={count} lang={lang} />
      </main>
    </div>
  )
}
