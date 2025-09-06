#!/usr/bin/env bash
set -e

# Utilisation : ./deploy.sh "message de commit"
MSG="${1:-update site}"

echo "➡️  Ajout des fichiers…"
git add .

# Y a-t-il des changements indexés ?
if git diff --cached --quiet; then
  echo "ℹ️  Aucun changement indexé, pas de nouveau commit."
  COMMITTED=0
else
  echo "➡️  Commit : $MSG"
  git commit -m "$MSG"
  COMMITTED=1
fi

echo "➡️  Push vers GitHub (branche main)…"
git push origin main || true

# Récupère dernier tag
LAST_TAG=$(git tag --list "v*" --sort=-v:refname | head -n 1 || true)

# Si rien n'a été commité et que HEAD est déjà taggé, on ne tag pas/relâche pas
if [ "$COMMITTED" -eq 0 ] && [ -n "$LAST_TAG" ]; then
  if [ "$(git rev-list -n 1 HEAD)" = "$(git rev-list -n 1 "$LAST_TAG")" ]; then
    echo "ℹ️  HEAD correspond déjà au dernier tag ($LAST_TAG). Pas de nouveau tag ni Release."
    exit 0
  fi
fi

# Calcule nouveau tag vX.Y.Z
if [ -z "$LAST_TAG" ]; then
  NEW_TAG="v1.0.0"
else
  BASE=${LAST_TAG#v}
  IFS='.' read -r MAJOR MINOR PATCH <<< "$BASE"
  PATCH=$((PATCH+1))
  NEW_TAG="v$MAJOR.$MINOR.$PATCH"
fi

# Notes de release = log depuis le dernier tag
if [ -n "$LAST_TAG" ]; then
  NOTES=$(git log --pretty=format:'- %s' "${LAST_TAG}..HEAD")
else
  NOTES=$(git log --pretty=format:'- %s')
fi
[ -z "$NOTES" ] && NOTES="- Pas de changements listés."

echo "➡️  Nouveau tag : $NEW_TAG"
git tag -a "$NEW_TAG" -m "Release $NEW_TAG - $MSG"
git push origin "$NEW_TAG"

# Déterminer owner/repo depuis le remote
REMOTE_URL=$(git config --get remote.origin.url)
if [[ "$REMOTE_URL" =~ github.com[:/](.+)/(.+)\.git ]]; then
  OWNER="${BASH_REMATCH[1]}"
  REPO="${BASH_REMATCH[2]}"
else
  echo "⚠️  Impossible d’inférer owner/repo depuis $REMOTE_URL ; la Release peut échouer."
  OWNER=""
  REPO=""
fi

create_release_with_gh() {
  if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
      gh release create "$NEW_TAG" --title "Release $NEW_TAG" --notes "$NOTES" >/dev/null
      echo "✅ Release GitHub créée avec gh : $NEW_TAG"
      return 0
    fi
  fi
  return 1
}

create_release_with_api() {
  if [ -z "${GITHUB_TOKEN:-}" ] || [ -z "$OWNER" ] || [ -z "$REPO" ]; then
    return 1
  fi
  JSON=$(python3 - <<PY
import json, os, sys
print(json.dumps({
  "tag_name": os.environ["NEW_TAG"],
  "name": f"Release {os.environ['NEW_TAG']}",
  "body": os.environ["NOTES"],
  "draft": False,
  "prerelease": False
}, ensure_ascii=False))
PY
)
  curl -fsSL -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d "$JSON" \
    "https://api.github.com/repos/${OWNER}/${REPO}/releases" >/dev/null
  echo "✅ Release GitHub créée via API : $NEW_TAG"
}

echo "➡️  Création de la Release GitHub…"
export NEW_TAG NOTES
if ! create_release_with_gh; then
  if ! create_release_with_api; then
    echo "⚠️  Impossible de créer la Release (gh non connecté et GITHUB_TOKEN absent)."
    echo "   → Astuce A : gh auth login"
    echo "   → Astuce B : export GITHUB_TOKEN=... (token avec scope repo)"
  fi
fi

echo "🎉 Déploiement terminé"
echo "   Tag : $NEW_TAG"
