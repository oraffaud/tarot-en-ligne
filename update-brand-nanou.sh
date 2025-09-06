#!/usr/bin/env bash
set -e
mkdir -p .backup_tarot public
timestamp="$(date +%Y%m%d_%H%M%S)"

# --- Header ---
HEADER="components/Header.js"
[ -f "$HEADER" ] && cp "$HEADER" ".backup_tarot/Header.js.$timestamp"
cat > "$HEADER" <<'JS'
export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-yellow-400 text-violet-900 flex items-center justify-center font-bold">
          N
        </div>
        <span className="font-semibold text-lg">Les tarots de Nanou</span>
      </div>
    </header>
  );
}
JS
echo "✅ Header mis à jour"

# --- SEO (Head) ---
PAGE="pages/index.js"
[ -f "$PAGE" ] && cp "$PAGE" ".backup_tarot/index.js.$timestamp"
awk '
/<Head>/,/<\/Head>/ {
  if (!printed) {
    print "      <Head>";
    print "        <title>Les tarots de Nanou — Tarot en ligne</title>";
    print "        <meta name=\"description\" content=\"Tirages gratuits et lectures premium de tarot en ligne.\" />";
    print "        <link rel=\"icon\" href=\"/favicon.svg\" />";
    print "        <meta property=\"og:title\" content=\"Les tarots de Nanou\" />";
    print "        <meta property=\"og:description\" content=\"Tirages gratuits et lectures premium de tarot en ligne.\" />";
    print "        <meta property=\"og:type\" content=\"website\" />";
    print "        <meta property=\"og:url\" content=\"/\" />";
    print "        <meta property=\"og:image\" content=\"/cards/19.jpg\" />";
    print "      </Head>";
    printed=1
  }
  next
}
{ print }
' "$PAGE" > "$PAGE.tmp" && mv "$PAGE.tmp" "$PAGE"
echo "✅ Bloc <Head> mis à jour"

# --- Favicon ---
FAV="public/favicon.svg"
cp "$FAV" ".backup_tarot/favicon.svg.$timestamp" 2>/dev/null || true
cat > "$FAV" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#g)"/>
  <text x="32" y="38" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" fill="#3B0764">N</text>
</svg>
SVG
echo "✅ Favicon mis à jour avec la lettre N"

echo "🎉 Branding changé → Les tarots de Nanou (N)"
echo "   Sauvegardes dans .backup_tarot/"
