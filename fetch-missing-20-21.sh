#!/usr/bin/env bash
set -euo pipefail

DEST="public/cards"
mkdir -p "$DEST"

UA="TarotSiteSetup/1.0 (contact: you@example.com)"
BASE="https://commons.wikimedia.org/wiki/Special:FilePath"
WIDTH="?width=800"  # miniature 800px = assez nette, plus léger

# URL-encoder via python
urlenc() { python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$1"; }

download_try() {
  local url="$1"
  local out="$2"
  local attempt=1
  local delay=2
  while [ $attempt -le 6 ]; do
    if curl -fsSL -A "$UA" "$url" -o "$out"; then
      # Sanity: fichier > 20KB
      if [ "$(stat -f%z "$out" 2>/dev/null || echo 0)" -gt 20000 ]; then
        echo "    ✔︎ OK: $(basename "$out")"
        return 0
      fi
      echo "    ⚠️  fichier trop petit, on retente…"
    else
      echo "    ⚠️  tentative $attempt échouée"
    fi
    attempt=$((attempt+1))
    echo "    ⏳ pause ${delay}s…"
    sleep "$delay"
    delay=$((delay*2))
  done
  return 1
}

fetch_one() {
  local index="$1"; shift
  local out="$DEST/${index}.jpg"

  # déjà présent et correct ?
  if [ -f "$out" ] && [ "$(stat -f%z "$out" 2>/dev/null || echo 0)" -gt 20000 ]; then
    echo "✔︎ $out déjà présent"
    return 0
  fi

  echo "↓ Téléchargement de l'index $index…"
  for name in "$@"; do
    local enc="$(urlenc "$name")"
    local url="${BASE}/${enc}${WIDTH}"
    echo "  → essai: $name"
    if download_try "$url" "$out"; then
      return 0
    fi
  done

  echo "❌ Échec pour l'index $index après toutes les variantes."
  return 1
}

# Variantes connues sur Commons
# 20 — Judgment/Judgement (US/UK) avec ou sans "The"
C20=(
  "RWS Tarot 20 Judgment.jpg"
  "RWS Tarot 20 Judgement.jpg"
  "RWS Tarot XX Judgment.jpg"
  "RWS Tarot XX Judgement.jpg"
  "Judgment (tarot card) - RWS.jpg"
  "XX Judgement.jpg"
)

# 21 — World (avec ou sans 'The')
C21=(
  "RWS Tarot 21 World.jpg"
  "RWS Tarot 21 The World.jpg"
  "RWS Tarot XXI World.jpg"
  "The World (tarot card) - RWS.jpg"
  "XXI World.jpg"
)

fetch_one 20 "${C20[@]}" || true
# petite pause anti-429
sleep 4
fetch_one 21 "${C21[@]}" || true

# Résumé
for i in 20 21; do
  if [ -f "$DEST/${i}.jpg" ] && [ "$(stat -f%z "$DEST/${i}.jpg" 2>/dev/null || echo 0)" -gt 20000 ]; then
    echo "✅ Index $i OK → $DEST/${i}.jpg"
  else
    echo "⚠️  Index $i manquant. Tu peux relancer le script dans 2–3 minutes (anti-429),"
    echo "    ou déposer manuellement un fichier ${i}.jpg dans public/cards/."
  fi
done
