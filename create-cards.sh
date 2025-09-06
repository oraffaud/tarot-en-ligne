#!/usr/bin/env bash
set -euo pipefail

DEST="public/cards"
mkdir -p "$DEST"

names=(
"Le Mat (0)"
"Le Magicien (I)"
"La Papesse (II)"
"L’Impératrice (III)"
"L’Empereur (IV)"
"Le Pape (V)"
"Les Amoureux (VI)"
"Le Chariot (VII)"
"La Justice (VIII)"
"L’Hermite (IX)"
"La Roue de Fortune (X)"
"La Force (XI)"
"Le Pendu (XII)"
"La Mort (XIII)"
"Tempérance (XIV)"
"Le Diable (XV)"
"La Tour (XVI)"
"L’Étoile (XVII)"
"La Lune (XVIII)"
"Le Soleil (XIX)"
"Le Jugement (XX)"
"Le Monde (XXI)"
)

for i in $(seq 0 21); do
  name="${names[$i]}"
  cat > "$DEST/${i}.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6D28D9"/>
      <stop offset="100%" stop-color="#3B82F6"/>
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

echo "✅ 22 SVG créés dans $DEST"
