#!/usr/bin/env bash
set -euo pipefail
DEST="public/cards"
mkdir -p "$DEST"

# Utilise Special:FilePath pour récupérer l'original du fichier (redirige vers l'image)
base="https://commons.wikimedia.org/wiki/Special:FilePath"

# Noms de fichiers RWS (majors 00..21) sur Wikimedia Commons
files=(
"RWS Tarot 00 Fool.jpg"
"RWS Tarot 01 Magician.jpg"
"RWS Tarot 02 High Priestess.jpg"
"RWS Tarot 03 Empress.jpg"
"RWS Tarot 04 Emperor.jpg"
"RWS Tarot 05 Hierophant.jpg"
"RWS Tarot 06 Lovers.jpg"
"RWS Tarot 07 Chariot.jpg"
"RWS Tarot 08 Strength.jpg"
"RWS Tarot 09 Hermit.jpg"
"RWS Tarot 10 Wheel of Fortune.jpg"
"RWS Tarot 11 Justice.jpg"
"RWS Tarot 12 Hanged Man.jpg"
"RWS Tarot 13 Death.jpg"
"RWS Tarot 14 Temperance.jpg"
"RWS Tarot 15 Devil.jpg"
"RWS Tarot 16 Tower.jpg"
"RWS Tarot 17 Star.jpg"
"RWS Tarot 18 Moon.jpg"
"RWS Tarot 19 Sun.jpg"
"RWS Tarot 20 Judgment.jpg"
"RWS Tarot 21 World.jpg"
)

echo "⬇️ Téléchargement des 22 arcanes majeurs (RWS) vers $DEST ..."
i=0
for f in "${files[@]}"; do
  url="$base/$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$f")"
  out="$DEST/$i.jpg"
  echo "  - [$i] $f"
  curl -fsSL "$url" -o "$out"
  i=$((i+1))
done

echo "✅ Terminé. Fichiers : $DEST/0.jpg ... $DEST/21.jpg"
