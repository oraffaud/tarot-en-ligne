#!/usr/bin/env bash
set -e -o pipefail

DEST="public/cards"
mkdir -p "$DEST"

UA="TarotSiteSetup/1.0 (contact: you@example.com)"
BASE="https://commons.wikimedia.org/wiki/Special:FilePath"
WIDTH="?width=800"

# URL-encode via Python (présent par défaut)
urlenc() { python3 - <<'PY'
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1]))
PY
}

download_try() {
  local url="$1" out="$2"
  local attempt=1 delay=2
  while [ $attempt -le 6 ]; do
    if curl -fsSL -A "$UA" "$url" -o "$out"; then
      # Fichier > 20KB = OK
      size=$(stat -f%z "$out" 2>/dev/null || echo 0)
      if [ "$size" -gt 20000 ]; then
        echo "   ✔︎ $(basename "$out") ($size octets)"
        return 0
      else
        echo "   ⚠️  fichier trop petit ($size), on retente…"
      fi
    else
      echo "   ⚠️  échec tentative $attempt"
    fi
    attempt=$((attempt+1)); echo "   ⏳ pause ${delay}s…"; sleep "$delay"; delay=$((delay*2))
  done
  return 1
}

fetch_one() {
  local index="$1"; shift
  local out="$DEST/${index}.jpg"
  echo "↓ Téléchargement index $index…"
  for name in "$@"; do
    enc=$(urlenc "$name")
    url="${BASE}/${enc}${WIDTH}"
    echo "   → $name"
    if download_try "$url" "$out"; then
      return 0
    fi
  done
  echo "❌ Échec pour l'index $index"
  return 1
}

# Variantes connues
C20=("RWS Tarot 20 Judgment.jpg" "RWS Tarot 20 Judgement.jpg" "RWS Tarot XX Judgment.jpg" "RWS Tarot XX Judgement.jpg" "Judgment (tarot card) - RWS.jpg" "XX Judgement.jpg")
C21=("RWS Tarot 21 World.jpg" "RWS Tarot 21 The World.jpg" "RWS Tarot XXI World.jpg" "The World (tarot card) - RWS.jpg" "XXI World.jpg")

fetch_one 20 "${C20[@]}" || true
sleep 3
fetch_one 21 "${C21[@]}" || true

echo "✅ Vérifie: $DEST/20.jpg et $DEST/21.jpg"
