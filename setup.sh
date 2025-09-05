#!/bin/bash
# ==============================================
# 🚀 Script d'installation automatique - Tarot en Ligne
# ==============================================

# Vérification des arguments
if [ -z "$1" ]; then
  echo "❌ Usage: ./setup.sh https://github.com/TON-UTILISATEUR/tarot-en-ligne.git"
  exit 1
fi

REPO_URL=$1

# Étape 1 : Initialisation du dépôt Git
echo "🔧 Initialisation du dépôt Git..."
git init
git branch -M main
git remote add origin $REPO_URL

# Étape 2 : Ajout des fichiers de configuration
echo "📂 Copie des fichiers README.md, .env.example et vercel.json..."
cp README.md ./README.md 2>/dev/null || true
cp .env.example ./.env.example 2>/dev/null || true
cp vercel.json ./vercel.json 2>/dev/null || true

# Étape 3 : Ajout et commit initial
echo "📦 Ajout et commit initial..."
git add .
git commit -m "Initial commit - Site Tarot en Ligne (auto-setup)"

# Étape 4 : Push vers GitHub
echo "🚀 Push vers GitHub..."
git push -u origin main

echo "✅ Installation terminée !"
echo "Vous pouvez maintenant déployer sur Vercel."
