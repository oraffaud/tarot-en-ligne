#!/usr/bin/env bash
set -e -o pipefail

[ -f package.json ] || { echo "❌ Lance ce script à la racine du projet"; exit 1; }
mkdir -p .backup_tarot

# 1) Composant carte : AUCUNE rotation possible
cp components/TarotCard.js ".backup_tarot/TarotCard.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cat > components/TarotCard.js <<'JS'
export default function TarotCard({ name, meaning, index }) {
  const jpg = `/cards/${index}.jpg`;
  const svg = `/cards/${index}.svg`;
  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <img
        src={jpg}
        alt={name}
        onError={(e) => { e.currentTarget.onerror=null; e.currentTarget.src = svg; }}
        className="w-full h-full object-contain rounded-lg"
        draggable={false}
      />
      <span className="sr-only">
        {name}
      </span>
    </div>
  );
}
JS

# 2) Page d'accueil : ne génère JAMAIS 'reversed'; supprime le toggle
cp pages/index.js ".backup_tarot/index.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cat > pages/index.js <<'JS'
import Head from 'next/head'
import { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

// Ordre RWS
const MAJOR_ARCANA = [
  { name: "Le Mat (0)", up: "Nouveaux départs, foi", rev: "Imprudence, naïveté" },            // 0
  { name: "Le Magicien (I)", up: "Volonté, ressources", rev: "Manipulation, illusions" },     // 1
  { name: "La Papesse (II)", up: "Intuition, mystère", rev: "Secrets, blocage" },             // 2
  { name: "L’Impératrice (III)", up: "Abondance, soin", rev: "Dépendance, stagnation" },      // 3
  { name: "L’Empereur (IV)", up: "Structure, autorité", rev: "Rigidité, domination" },        // 4
  { name: "Le Pape (V)", up: "Tradition, guidance", rev: "Dogmatisme, rébellion" },           // 5
  { name: "Les Amoureux (VI)", up: "Choix, harmonie", rev: "Dissonance, doute" },             // 6
  { name: "Le Chariot (VII)", up: "Volonté, progrès", rev: "Dispersion, indécision" },        // 7
  { name: "La Force (VIII)", up: "Courage, maîtrise", rev: "Insécurité, impulsivité" },       // 8
  { name: "L’Hermite (IX)", up: "Recherche, sagesse", rev: "Isolement, fuite" },              // 9
  { name: "La Roue de Fortune (X)", up: "Cycles, tournant", rev: "Résistance au changement" },// 10
  { name: "La Justice (XI)", up: "Équité, vérité", rev: "Injustice, déséquilibre" },          // 11
  { name: "Le Pendu (XII)", up: "Lâcher-prise, regard neuf", rev: "Blocage, stagnation" },    // 12
  { name: "La Mort (XIII)", up: "Transformation", rev: "Attachement, peur" },                 // 13
  { name: "Tempérance (XIV)", up: "Modération, alchimie", rev: "Excès, impatience" },         // 14
  { name: "Le Diable (XV)", up: "Attachements, matérialisme", rev: "Libération" },            // 15
  { name: "La Tour (XVI)", up: "Révélation, rupture", rev: "Retard du nécessaire" },          // 16
  { name: "L’Étoile (XVII)", up: "Espoir, inspiration", rev: "Doute" },                       // 17
  { name: "La Lune (XVIII)", up: "Rêves, intuition", rev: "Confusion, peur" },                // 18
  { name: "Le Soleil (XIX)", up: "Joie, clarté", rev: "Arrogance" },                          // 19
  { name: "Le Jugement (XX)", up: "Réveil, bilan", rev: "Auto-critique, hésitation" },        // 20
  { name: "Le Monde (XXI)", up: "Accomplissement, unité", rev: "Boucle inachevée" },          // 21
];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ajoute l'index image et ne met JAMAIS reversed
const drawCards = (count) =>
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx, reversed: false })))
    .slice(0, count);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(3);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    setMounted(true);
    setCards(drawCards(3));
  }, []);

  const onNewDraw = () => setCards(drawCards(count));

  const options = useMemo(() => ([
    { id: 1, label: "1 carte" },
    { id: 3, label: "3 cartes (Passé • Présent • Futur)" },
    { id: 5, label: "5 cartes (Croix simple)" },
  ]), []);

  const previewCards = mounted && cards.length ? cards.slice(0, Math.min(3, cards.length)) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 to-violet-700 text-white">
      <Head>
        <title>Arcana — Tarot en ligne</title>
        <meta name="description" content="Tirage de tarot en ligne & lecture premium" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto p-6">
        {/* HERO */}
        <section className="grid md:grid-cols-2 gap-8 items-center py-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Tirez les cartes, éclairez votre chemin</h1>
            <p className="mb-6 text-violet-100">Tirage instantané gratuit. Pour une lecture détaillée et personnalisée, cliquez sur Lecture Premium.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onNewDraw} className="bg-white/10 px-4 py-2 rounded-lg">Nouveau tirage</button>
              <a href={PAYMENT_LINK} className="bg-yellow-400 text-violet-900 px-4 py-2 rounded-lg font-semibold">Lecture Premium — 19€</a>
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

          {/* Aperçu cartes */}
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

        {/* Résultat complet */}
        <section className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Tirage actuel ({count} carte{count>1?'s':''})</h2>
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
      </main>
    </div>
  )
}
JS

echo "✅ Patches appliqués. Sauvegardes dans .backup_tarot/"
echo "▶️  Maintenant : npm run dev (puis recharge la page)"
