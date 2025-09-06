#!/usr/bin/env bash
set -e

# Utilisation : ./deploy.sh "ton message de commit"

MSG="${1:-update site}"

echo "➡️  Ajout des fichiers..."
git add .

echo "➡️  Commit avec message : $MSG"
git commit -m "$MSG" || echo "⚠️  Aucun changement à commit"

echo "➡️  Push vers GitHub (branche main)..."
git push origin main

echo "✅ Déploiement lancé (Vercel va redéployer automatiquement)"
