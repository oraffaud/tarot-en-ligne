#!/usr/bin/env bash
set -euo pipefail

root_ok=0
[ -f package.json ] && root_ok=1
if [ "$root_ok" -ne 1 ]; then
  echo "❌ Lance ce script à la racine du projet (package.json introuvable)"
  exit 1
fi

mkdir -p .backup_tarot

echo "🔎 1) Vérification/Création des 22 cartes SVG..."
mkdir -p public/cards
missing=0
for i in $(seq 0 21); do
  [ -f "public/cards/${i}.svg" ] || missing=$((missing+1))
done
if [ "$missing" -gt 0 ]; then
  echo "   → ${missing} manquantes, génération..."
  names=(
  "Le Mat (0)" "Le Magicien (I)" "La Papesse (II)" "L’Impératrice (III)" "L’Empereur (IV)"
  "Le Pape (V)" "Les Amoureux (VI)" "Le Chariot (VII)" "La Justice (VIII)" "L’Hermite (IX)"
  "La Roue de Fortune (X)" "La Force (XI)" "Le Pendu (XII)" "La Mort (XIII)" "Tempérance (XIV)"
  "Le Diable (XV)" "La Tour (XVI)" "L’Étoile (XVII)" "La Lune (XVIII)" "Le Soleil (XIX)"
  "Le Jugement (XX)" "Le Monde (XXI)"
  )
  for i in $(seq 0 21); do
    name="${names[$i]}"
    cat > "public/cards/${i}.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6D28D9"/><stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="300" height="420" rx="16" fill="url(#g)"/>
  <rect x="14" y="14" width="272" height="392" rx="12" fill="white" opacity="0.12"/>
  <text x="150" y="80" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#FFFFFF">${name}</text>
  <circle cx="150" cy="210" r="56" fill="white" opacity="0.1"/>
  <text x="150" y="220" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="48" fill="#FFFFFF">${i}</text>
  <text x="150" y="360" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#E5E7EB">Arcana — Aperçu visuel</text>
</svg>
SVG
  done
  echo "   ✅ SVG générés dans public/cards/"
else
  echo "   ✅ Les 22 SVG sont déjà présents"
fi

echo "🧩 2) Mise à jour du composant TarotCard (affichage image + rotation)..."
cp components/TarotCard.js ".backup_tarot/TarotCard.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cat > components/TarotCard.js <<'JS'
export default function TarotCard({ name, reversed, meaning, index }) {
  const src = `/cards/${index}.svg`; // 0..21 dans /public/cards
  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <img
        src={src}
        alt={name}
        className={`w-full h-full object-contain rounded-lg ${reversed ? 'rotate-180' : ''}`}
        draggable={false}
      />
      <span className="sr-only">
        {name} — {reversed ? `Inversée: ${meaning?.rev}` : `Droite: ${meaning?.up}`}
      </span>
    </div>
  );
}
JS
echo "   ✅ components/TarotCard.js mis à jour"

echo "📝 3) Mise à jour de la page index (passe l'index + hydrate sans erreur)..."
cp pages/index.js ".backup_tarot/index.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cat > pages/index.js <<'JS'
import Head from 'next/head'
import { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

// 22 Arcanes majeurs (résumé)
const MAJOR_ARCANA = [
  { name: "Le Mat (0)", up: "Nouveaux départs, foi", rev: "Imprudence, naïveté" },
  { name: "Le Magicien (I)", up: "Volonté, ressources", rev: "Manipulation, illusions" },
  { name: "La Papesse (II)", up: "Intuition, mystère", rev: "Secrets, blocage" },
  { name: "L’Impératrice (III)", up: "Abondance, soin", rev: "Dépendance, stagnation" },
  { name: "L’Empereur (IV)", up: "Structure, autorité", rev: "Rigidité, domination" },
  { name: "Le Pape (V)", up: "Tradition, guidance", rev: "Dogmatisme, rébellion" },
  { name: "Les Amoureux (VI)", up: "Choix, harmonie", rev: "Dissonance, doute" },
  { name: "Le Chariot (VII)", up: "Volonté, progrès", rev: "Dispersion, indécision" },
  { name: "La Justice (VIII)", up: "Équité, vérité", rev: "Injustice, déséquilibre" },
  { name: "L’Hermite (IX)", up: "Recherche, sagesse", rev: "Isolement, fuite" },
  { name: "La Roue de Fortune (X)", up: "Cycles, tournant", rev: "Résistance au changement" },
  { name: "La Force (XI)", up: "Courage, maîtrise", rev: "Insécurité, impulsivité" },
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
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx })))
    .slice(0, count)
    .map(c => ({ ...c, reversed: Math.random() < 0.48 }));

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
                  <TarotCard key={i} name={c.name} reversed={c.reversed} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
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
                <TarotCard key={i} name={c.name} reversed={c.reversed} meaning={{up:c.up, rev:c.rev}} index={c.idx} />
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
echo "   ✅ pages/index.js mis à jour"

echo "🧪 4) Test local: vérifie que /cards/0.svg est servi"
npx --yes http-server -p 0 ./public > /dev/null 2>&1 || true
if curl -sI "http://localhost:3000/cards/0.svg" | grep -q '200'; then
  echo "   ✅ Next.js devrait servir /cards/0.svg correctement"
else
  echo "   ℹ️ Lance 'npm run dev' puis teste http://localhost:3000/cards/0.svg dans le navigateur"
fi

echo "🎉 Terminé. Lance 'npm run dev' et recharge la page."
