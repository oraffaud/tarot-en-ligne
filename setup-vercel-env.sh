#!/usr/bin/env bash
set -e

# Vérifie que la CLI Vercel est installée
if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ La CLI Vercel n'est pas installée."
  echo "👉 Installe-la avec: npm install -g vercel"
  exit 1
fi

echo "➡️ Configuration des variables d'environnement Vercel"

# Liste des variables nécessaires
VARS=(
  "OPENAI_API_KEY"     # ta clé OpenAI
  "OPENAI_MODEL"       # ex: gpt-4.1-mini
  "NEXT_PUBLIC_PAYMENT_LINK_URL" # ton lien Stripe Payment
  "LOG_TO_DISK"        # false en prod (pour Vercel)
)

# Ajout interactif
for var in "${VARS[@]}"; do
  echo "-----------------------------------"
  echo "⚙️ Ajout de la variable: $var"
  case "$var" in
    OPENAI_MODEL)
      DEFAULT="gpt-4.1-mini"
      ;;
    LOG_TO_DISK)
      DEFAULT="false"
      ;;
    *)
      DEFAULT=""
      ;;
  esac

  if [ -n "$DEFAULT" ]; then
    echo "Valeur par défaut proposée: $DEFAULT"
  fi

  read -p "Entrez la valeur pour $var (laisser vide = $DEFAULT): " VAL
  if [ -z "$VAL" ]; then
    VAL="$DEFAULT"
  fi

  if [ -n "$VAL" ]; then
    # Ajoute la variable pour les 3 environnements (production, preview, development)
    echo "$VAL" | vercel env add "$var" production
    echo "$VAL" | vercel env add "$var" preview
    echo "$VAL" | vercel env add "$var" development
  else
    echo "⚠️ Variable $var ignorée (vide)."
  fi
done

echo "✅ Variables d'environnement ajoutées."
echo "   Vérifie-les avec: vercel env ls"
