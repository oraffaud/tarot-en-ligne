#!/usr/bin/env bash
set -e

COMP="components/Header.js"

# Sauvegarde avant modif
mkdir -p .backup_tarot
cp "$COMP" ".backup_tarot/Header.js.$(date +%Y%m%d_%H%M%S)" || true

# Réécriture du composant Header.js
cat > "$COMP" <<'JS'
export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-yellow-400 text-violet-900 flex items-center justify-center font-bold">
          L
        </div>
        <span className="font-semibold text-lg">Les tarots de Line</span>
      </div>
    </header>
  );
}
JS

echo "✅ Header.js mis à jour : 'Arcana' → 'Les tarots de Line' et cercle 'A' → 'L'"
