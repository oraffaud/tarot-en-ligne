#!/usr/bin/env bash
set -euo pipefail

COMP="components/TarotCard.js"

# sauvegarde avant modif
mkdir -p .backup_tarot
cp "$COMP" ".backup_tarot/TarotCard.js.$(date +%Y%m%d_%H%M%S)" || true

# réécriture du fichier
cat > "$COMP" <<'JS'
export default function TarotCard({ name, reversed, meaning, index }) {
  const src = `/cards/${index}.svg`; // 0..21
  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <img
        src={src}
        alt={name}
        className={`w-full h-full object-contain rounded-lg ${reversed ? 'rotate-180' : ''}`}
        draggable={false}
      />
      {/* Accessibilité: sens et signification lisibles par lecteurs d'écran */}
      <span className="sr-only">
        {name} — {reversed ? `Inversée: ${meaning?.rev}` : `Droite: ${meaning?.up}`}
      </span>
    </div>
  );
}
JS

echo "✅ Fichier $COMP mis à jour (backup dans .backup_tarot/)"
