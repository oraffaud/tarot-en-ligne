#!/usr/bin/env bash
set -e

FILE=".env.local"

echo "➡️ Configuration des variables d'environnement pour le projet Tarot"
echo

read -p "👉 Entre ta clé OpenAI (commence par sk-…): " OPENAI_KEY
OPENAI_MODEL="gpt-4.1-mini"

echo
echo "Par défaut le modèle sera: $OPENAI_MODEL"
read -p "👉 Si tu veux un autre modèle (laisser vide pour $OPENAI_MODEL): " MODEL_INPUT
if [ -n "$MODEL_INPUT" ]; then
  OPENAI_MODEL="$MODEL_INPUT"
fi

LOG_TO_DISK="true"

cat > "$FILE" <<EOF2
OPENAI_API_KEY=$OPENAI_KEY
OPENAI_MODEL=$OPENAI_MODEL
LOG_TO_DISK=$LOG_TO_DISK
EOF2

echo
echo "✅ Fichier $FILE écrit avec succès:"
cat "$FILE"
