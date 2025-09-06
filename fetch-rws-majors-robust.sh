#!/usr/bin/env bash
set -euo pipefail

DEST="public/cards"
mkdir -p "$DEST"

# Files RWS sur Wikimedia Commons (domain public)
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

# On utilise Special:FilePath avec un width (thumbnail) pour réduire le poids
# Cela diminue le risque de 429
BASE="https://commons.wikimedia.org/wiki/Special:FilePath"
WIDTH="?width=600"

UA="TarotSiteSetup/1.0 (contact: you@example.com)"

# Encodeur URL via python (présent par défaut sur macOS récent)
urlenc() { python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$1"; }

download_one() {
  local idx="$1"
  local name="$2"
  local enc="$(urlenc "$name")"
  local url="${BASE}/${enc}${WIDTH}"
  local out="${DEST}/${idx}.jpg"

  # si déjà présent et > 20KB, on suppose OK
  if [ -f "$out" ] && [ "$(stat -f%z "$out" 2>/dev/null || echo 0)" -gt 20000 ]; then
    echo "  ✔︎ [$idx] déjà présent: $(basename "$out")"
    return 0
  fi

  echo "  ↓ [$idx] $name"
  # 6 tentatives avec backoff progressif
  local attempt=1
  local delay=2
  while [ $attempt -le 6 ]; do
    if curl -fsSL -A "$UA" "$url" -o "$out"; then
      # Sanity check: fichier non vide
      if [ "$(stat -f%z "$out" 2>/dev/null || echo 0)" -gt 5000 ]; then
        echo "    ✔︎ téléchargé ($out)"
        return 0
      else
        echo "    ⚠️  fichier trop petit, on retente…"
      fi
    else
      echo "    ⚠️  échec tentative ${attempt}"
    fi
    attempt=$((attempt+1))
    echo "    ⏳ pause ${delay}s (anti-429)…"
    sleep "$delay"
    delay=$((delay*2)) # backoff exponentiel
  done

  echo "    ❌ échec après plusieurs tentatives: $name"
  return 1
}

echo "⬇️ Téléchargement des 22 arcanes majeurs (RWS) → ${DEST}"
# On télécharge en 2 salves pour être plus doux avec le CDN (et éviter 429)
for chunk in 0 11; do
  end=$((chunk+10))
  [ $end -gt 21 ] && end=21
  echo "— Salve ${chunk}..${end} —"
  for i in $(seq $chunk $end); do
    download_one "$i" "${files[$i]}"
    # petite pause aléatoire 0.5–1.5s entre fichiers
    python3 - <<'PY' 2>/dev/null || sleep 1
import time, random; time.sleep(random.uniform(0.5,1.5))
PY
  done
  echo "   • Pause 5s entre salves…"
  sleep 5
done

echo "✅ Terminé. Vérifiez: ${DEST}/0.jpg … ${DEST}/21.jpg"
