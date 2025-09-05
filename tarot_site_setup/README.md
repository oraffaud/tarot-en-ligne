# 🔮 Site de Tarot en Ligne

Ce projet est un site web de **tirage de tarot en ligne** avec
intégration Stripe pour la facturation et un mini back-office.

## 🚀 Fonctionnalités

-   Tirage de 1, 3 ou 5 cartes avec animations.
-   Significations des arcanes majeurs affichées.
-   Offre premium (lecture détaillée) avec paiement Stripe.
-   Facturation via **Payment Link** ou **Stripe Checkout + Webhook**.
-   Back-office protégé (liste des commandes, export CSV/PDF).
-   Version multilingue (FR/EN).

------------------------------------------------------------------------

## 🔧 Prérequis

-   [Node.js 18+](https://nodejs.org/)
-   [Git](https://git-scm.com/)
-   [Compte GitHub](https://github.com)
-   [Compte Vercel](https://vercel.com)
-   [Compte Stripe](https://stripe.com)

------------------------------------------------------------------------

## ⚙️ Installation locale

``` bash
# Cloner le projet
git clone https://github.com/TON-UTILISATEUR/tarot-en-ligne.git
cd tarot-en-ligne

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

Le site sera accessible sur <http://localhost:3000>.

------------------------------------------------------------------------

## 📦 Déploiement sur GitHub + Vercel

### 1. Créer un dépôt GitHub

1.  Sur GitHub → New repository → Nom: `tarot-en-ligne`
2.  Copier l'URL du dépôt (ex:
    `https://github.com/TON-UTILISATEUR/tarot-en-ligne.git`)

### 2. Pousser le code sur GitHub

``` bash
git init
git branch -M main
git remote add origin https://github.com/TON-UTILISATEUR/tarot-en-ligne.git
git add .
git commit -m "Initial commit - Site Tarot en Ligne"
git push -u origin main
```

### 3. Déployer sur Vercel

1.  Connectez-vous sur [Vercel](https://vercel.com)
2.  Cliquez sur **New Project** → Importez votre repo `tarot-en-ligne`
3.  Choisissez framework: **Next.js**
4.  Ajoutez vos **variables d'environnement** (voir ci-dessous)
5.  Cliquez **Deploy**

------------------------------------------------------------------------

## 🔑 Variables d'environnement

À configurer dans **Vercel → Project Settings → Environment Variables**
:

``` env
# Stripe (mode test)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PK=pk_test_xxxxx
NEXT_PUBLIC_SITE_URL=https://ton-projet.vercel.app
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

👉 En mode production, utilisez les clés **live** Stripe.

------------------------------------------------------------------------

## 💳 Paiement Stripe

### Option A --- Payment Link

-   Configurez un **Payment Link** dans Stripe.
-   Collez l'URL dans la constante `PAYMENT_LINK_URL`.

### Option B --- Stripe Checkout (recommandé)

-   Utilisez l'endpoint `/api/checkout/session` pour créer une session
    sécurisée.
-   Ajoutez un **webhook** Stripe pour écouter
    `checkout.session.completed`.

------------------------------------------------------------------------

## 🛠 Webhook Stripe

1.  Dans Stripe → Developers → Webhooks → Add endpoint
2.  URL : `https://ton-projet.vercel.app/api/stripe/webhook`
3.  Événement : `checkout.session.completed`
4.  Copier le **Signing secret** → STRIPE_WEBHOOK_SECRET

------------------------------------------------------------------------

## 🗄 Back-office

-   Accessible via un mot de passe (`ADMIN_PASS` défini dans le code).
-   Liste des commandes (localStorage par défaut).
-   Export CSV ou PDF.

------------------------------------------------------------------------

## 🎨 Identité visuelle

-   Violet mystique (#5D3FD3)
-   Or (#FFD700) pour les accents premium
-   Blanc (#FFFFFF) pour contrastes
-   Gris clair (#F5F5F5) pour fonds neutres

------------------------------------------------------------------------

## 📜 Licence

Projet développé pour usage personnel ou démonstration.\
Pensez à ajouter vos mentions légales et CGV si vous ouvrez au public.

------------------------------------------------------------------------

✨ Bon tirage et bonne mise en ligne ! 🔮
