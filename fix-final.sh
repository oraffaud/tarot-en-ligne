#!/usr/bin/env bash
set -euo pipefail

ROOT_OK=0
[ -f package.json ] && ROOT_OK=1
[ "$ROOT_OK" -eq 1 ] || { echo "❌ Lance ce script à la racine (package.json introuvable)"; exit 1; }

mkdir -p .backup_tarot public/cards

# 1) (Re)télécharger 20.jpg et 21.jpg avec variantes + backoff (RWS)
UA="TarotSiteSetup/1.0 (contact: you@example.com)"
BASE="https://commons.wikimedia.org/wiki/Special:FilePath"
WIDTH="?width=800"
urlenc() { python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$1"; }

download_try() {
  local url="$1"; local out="$2"
  local attempt=1 delay=2
  while [ $attempt -le 6 ]; do
    if curl -fsSL -A "$UA" "$url" -o "$out"; then
      # > 20KB = OK
      if [ "$(stat -f%z "$out" 2>/dev/null || echo 0)" -gt 20000 ]; then
        echo "   ✔︎ $(basename "$out")"
        return 0
      fi
      echo "   ⚠️  fichier trop petit, on retente…"
    else
      echo "   ⚠️  tentative $attempt échouée"
    fi
    attempt=$((attempt+1)); echo "   ⏳ pause ${delay}s…"; sleep $delay; delay=$((delay*2))
  done
  return 1
}

fetch_index() {
  local idx="$1"; shift
  local out="public/cards/${idx}.jpg"
  # si déjà présent et correct, on garde
  if [ -f "$out" ] && [ "$(stat -f%z "$out" 2>/dev/null || echo 0)" -gt 20000 ]; then
    echo "✔︎ $out déjà présent"
    return 0
  fi
  echo "↓ Téléchargement index $idx…"
  for name in "$@"; do
    local enc="$(urlenc "$name")"
    local url="${BASE}/${enc}${WIDTH}"
    echo "   → $name"
    download_try "$url" "$out" && return 0
  done
  echo "❌ Impossible d'obtenir ${idx}.jpg"
  return 1
}

# Variantes communes sur Commons
C20=( "RWS Tarot 20 Judgment.jpg" "RWS Tarot 20 Judgement.jpg" "RWS Tarot XX Judgment.jpg" "RWS Tarot XX Judgement.jpg" "Judgment (tarot card) - RWS.jpg" "XX Judgement.jpg" )
C21=( "RWS Tarot 21 World.jpg" "RWS Tarot 21 The World.jpg" "RWS Tarot XXI World.jpg" "The World (tarot card) - RWS.jpg" "XXI World.jpg" )

fetch_index 20 "${C20[@]}" || true
sleep 3
fetch_index 21 "${C21[@]}" || true

# 2) Mettre le composant pour NE PAS pivoter par défaut (toggle possible via prop)
cp components/TarotCard.js ".backup_tarot/TarotCard.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cat > components/TarotCard.js <<'JS'
export default function TarotCard({ name, reversed, meaning, index, showReversed=false }) {
  const jpg = `/cards/${index}.jpg`;
  const svg = `/cards/${index}.svg`;
  const rotate = showReversed && reversed ? 'rotate-180' : ''; // pas de rotation si showReversed = false
  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <img
        src={jpg}
        alt={name}
        onError={(e) => { e.currentTarget.onerror=null; e.currentTarget.src = svg; }}
        className={`w-full h-full object-contain rounded-lg ${rotate}`}
        draggable={false}
      />
      <span className="sr-only">
        {name} — {reversed ? `Inversée: ${meaning?.rev}` : `Droite: ${meaning?.up}`}
      </span>
    </div>
  );
}
JS
echo "✔︎ components/TarotCard.js mis à jour"

# 3) Mettre l’ordre RWS (Strength VIII, Justice XI) et passer showReversed=false
cp pages/index.js ".backup_tarot/index.js.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cat > pages/index.js <<'JS'
import Head from 'next/head'
import { useMemo, useState, useEffect } from 'react'
import Header from '../components/Header'
import TarotCard from '../components/TarotCard'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_PAYMENT_LINK_URL || '#'

// Ordre RWS: 0 Fool, 1 Magician, ... 8 Strength, 11 Justice
const MAJOR_ARCANA = [
  { name: "Le Mat (0)", up: "Nouveaux départs, foi", rev: "Imprudence, naïveté" },            // 0
  { name: "Le Magicien (I)", up: "Volonté, ressources", rev: "Manipulation, illusions" },     // 1
  { name: "La Papesse (II)", up: "Intuition, mystère", rev: "Secrets, blocage" },             // 2 (High Priestess)
  { name: "L’Impératrice (III)", up: "Abondance, soin", rev: "Dépendance, stagnation" },      // 3
  { name: "L’Empereur (IV)", up: "Structure, autorité", rev: "Rigidité, domination" },        // 4
  { name: "Le Pape (V)", up: "Tradition, guidance", rev: "Dogmatisme, rébellion" },           // 5 (Hierophant)
  { name: "Les Amoureux (VI)", up: "Choix, harmonie", rev: "Dissonance, doute" },             // 6
  { name: "Le Chariot (VII)", up: "Volonté, progrès", rev: "Dispersion, indécision" },        // 7
  { name: "La Force (VIII)", up: "Courage, maîtrise", rev: "Insécurité, impulsivité" },       // 8  (Strength)
  { name: "L’Hermite (IX)", up: "Recherche, sagesse", rev: "Isolement, fuite" },              // 9
  { name: "La Roue de Fortune (X)", up: "Cycles, tournant", rev: "Résistance au changement" },// 10
  { name: "La Justice (XI)", up: "Équité, vérité", rev: "Injustice, déséquilibre" },          // 11 (Justice)
  { name: "Le Pendu (XII)", up: "Lâcher-prise, regard neuf", rev: "Blocage, stagnation" },    // 12
  { name: "La Mort (XIII)", up: "Transformation", rev: "Attachement, peur" },                 // 13
  { name: "Tempérance (XIV)", up: "Modération, alchimie", rev: "Excès, impatience" },         // 14
  { name: "Le Diable (XV)", up: "Attachements, matérialisme", rev: "Libération" },            // 15
  { name: "La Tour (XVI)", up: "Révélation, rupture", rev: "Retard du nécessaire" },          // 16
  { name: "L’Étoile (XVII)", up: "Espoir, inspiration", rev: "Doute" },                       // 17
  { name: "La Lune (XVIII)", up: "Rêves, intuition", rev: "Confusion, peur" },                // 18
  { name: "Le Soleil (XIX)", up: "Joie, clarté", rev: "Arrogance" },                          // 19
  { name: "Le Jugement (XX)", up: "Réveil, bilan", rev: "Auto-critique, hésitation" },        // 20 (Judgment)
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
const drawCards = (count) =>
  shuffle(MAJOR_ARCANA.map((c, idx) => ({ ...c, idx })))
    .slice(0, count)
    .map(c => ({ ...c, reversed: Math.random() < 0.48 }));

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(3);
  const [cards, setCards] = useState([]);
  const [showReversed, setShowReversed] = useState(false); // OFF par défaut

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
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {options.map(o => (
                <button
                  key={o.id}
                  onClick={() => setCount(o.id)}
                  className={`px-3 py-1 rounded-lg border border-white/20 ${count===o.id ? 'bg-white/20' : 'bg-white/5'}`}
                >
                  {o.label}
                </button>
              ))}
              <label className="flex items-center gap-2 cursor-pointer ml-2">
                <input type="checkbox" checked={showReversed} onChange={(e)=>setShowReversed(e.target.checked)} />
                Afficher cartes inversées
              </label>
            </div>
          </div>

          {/* Aperçu cartes */}
          <div className="flex justify-center">
            <div className="space-x-[-40px] flex items-end">
              {previewCards.length > 0 ? (
                previewCards.map((c, i) => (
                  <TarotCard key={i} name={c.name} reversed={c.reversed} meaning={{up:c.up, rev:c.rev}} index={c.idx} showReversed={showReversed} />
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
                <TarotCard key={i} name={c.name} reversed={c.reversed} meaning={{up:c.up, rev:c.rev}} index={c.idx} showReversed={showReversed} />
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
echo "✔︎ pages/index.js mis à jour (ordre RWS + toggle inversées OFF)"

echo "🎯 Étapes suivantes:"
echo "  1) npm run dev   (puis teste http://localhost:3000/cards/20.jpg et /cards/21.jpg)"
echo "  2) Ouvre la page d'accueil et vérifie: cartes bien à l'endroit."
echo "  3) Si OK, git add/commit/push pour redéployer Vercel."
