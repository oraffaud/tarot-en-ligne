#!/usr/bin/env bash
set -e

mkdir -p public .backup_tarot
timestamp="$(date +%Y%m%d_%H%M%S)"

# ---------- 1) Créer/Maj du SVG maître ----------
SVG_ICON="public/favicon.svg"
[ -f "$SVG_ICON" ] && cp "$SVG_ICON" ".backup_tarot/favicon.svg.$timestamp"

cat > "$SVG_ICON" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#gold)" stroke="#3B0764" stroke-width="3"/>
  <text x="32" y="40" text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-size="32" font-weight="700"
        fill="#3B0764">N</text>
</svg>
SVG
echo "✅ SVG maître écrit → $SVG_ICON"

# ---------- 2) Rasteriser en PNG (32x32, 180x180, 512x512) ----------
render_with_imagemagick() {
  local size="$1" out="$2"
  if command -v magick >/dev/null 2>&1; then
    magick -background none "$SVG_ICON" -resize "${size}x${size}" "$out"
  else
    convert -background none "$SVG_ICON" -resize "${size}x${size}" "$out"
  fi
}

render_with_rsvg() {
  local size="$1" out="$2"
  rsvg-convert -w "$size" -h "$size" "$SVG_ICON" -o "$out"
}

render_with_inkscape() {
  local size="$1" out="$2"
  inkscape "$SVG_ICON" --export-type=png -o "$out" -w "$size" -h "$size" >/dev/null 2>&1
}

render_png() {
  local size="$1" out="$2"
  if command -v magick >/dev/null 2>&1 || command -v convert >/dev/null 2>&1; then
    render_with_imagemagick "$size" "$out"
  elif command -v rsvg-convert >/dev/null 2>&1; then
    render_with_rsvg "$size" "$out"
  elif command -v inkscape >/dev/null 2>&1; then
    render_with_inkscape "$size" "$out"
  else
    echo "❌ Aucun rasterizer trouvé (ImageMagick / rsvg-convert / Inkscape)."
    echo "   → Sur macOS : brew install imagemagick"
    exit 1
  fi
}

PNG_32="public/favicon-32x32.png"
PNG_180="public/apple-touch-icon.png"
PNG_512="public/icon-512.png"

render_png 32 "$PNG_32"
render_png 180 "$PNG_180"
render_png 512 "$PNG_512"

echo "✅ PNG générés → $PNG_32, $PNG_180, $PNG_512"

# ---------- 3) Manifest Web ----------
MANIFEST="public/site.webmanifest"
[ -f "$MANIFEST" ] && cp "$MANIFEST" ".backup_tarot/site.webmanifest.$timestamp"
cat > "$MANIFEST" <<JSON
{
  "name": "Les tarots de Nanou",
  "short_name": "Nanou",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B0764",
  "icons": [
    { "src": "/favicon-32x32.png", "sizes": "32x32", "type": "image/png" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
JSON
echo "✅ Manifest écrit → $MANIFEST"

# ---------- 4) Mettre à jour <Head> dans pages/index.js ----------
PAGE="pages/index.js"
[ -f "$PAGE" ] || { echo "❌ $PAGE introuvable"; exit 1; }
cp "$PAGE" ".backup_tarot/index.js.$timestamp"

awk '
/<Head>/,/<\/Head>/ {
  if (!printed) {
    print "      <Head>";
    print "        <title>Les tarots de Nanou — Tarot en ligne</title>";
    print "        <meta name=\"description\" content=\"Tirages gratuits et lectures premium de tarot en ligne.\" />";
    print "        <link rel=\"icon\" href=\"/favicon.svg\" />";
    print "        <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/favicon-32x32.png\" />";
    print "        <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/apple-touch-icon.png\" />";
    print "        <link rel=\"manifest\" href=\"/site.webmanifest\" />";
    print "        <meta name=\"theme-color\" content=\"#3B0764\" />";
    print "        <meta property=\"og:title\" content=\"Les tarots de Nanou\" />";
    print "        <meta property=\"og:description\" content=\"Tirages gratuits et lectures premium de tarot en ligne.\" />";
    print "        <meta property=\"og:type\" content=\"website\" />";
    print "        <meta property=\"og:image\" content=\"/icon-512.png\" />";
    print "      </Head>";
    printed=1
  }
  next
}
{ print }
' "$PAGE" > "$PAGE.tmp" && mv "$PAGE.tmp" "$PAGE"

echo "✅ <Head> mis à jour dans $PAGE"

echo "🎉 Favicons multi-format prêts. Sauvegardes dans .backup_tarot/"
