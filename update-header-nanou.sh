#!/usr/bin/env bash
set -e
mkdir -p .backup_tarot

HEADER="components/Header.js"
timestamp="$(date +%Y%m%d_%H%M%S)"

# Sauvegarde
[ -f "$HEADER" ] && cp "$HEADER" ".backup_tarot/Header.js.$timestamp"

# Nouveau contenu du Header.js
cat > "$HEADER" <<'JS'
export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <img src="/logo-nanou.svg" alt="Les tarots de Nanou" className="w-10 h-10" />
        <span className="font-semibold text-lg">Les tarots de Nanou</span>
      </div>
    </header>
  );
}
JS

echo "✅ Header mis à jour pour afficher le logo Nanou"
echo "   (sauvegarde dans .backup_tarot/Header.js.$timestamp)"
