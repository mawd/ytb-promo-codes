# 🎬 Site Codes Promo YouTube

Plateforme web pour rechercher et découvrir les codes promo proposés par des YouTubeurs, organisés par catégorie de chaîne.

## 📋 Vue d'ensemble

Ce projet permet de :
- 🔍 Rechercher des codes promo par catégorie, marque, produit ou youtubeur
- 🤖 Détecter automatiquement les codes dans les descriptions YouTube
- ✅ Modérer et valider les codes détectés
- 📊 Signaler les codes expirés ou invalides

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **API externe** : YouTube Data API v3
- **Hébergement** : Render

## 🚀 Installation Locale

### Prérequis

- Node.js 18+
- PostgreSQL (local ou Render)
- Clé API YouTube Data v3

### Étapes

1. **Cloner le projet**
```bash
git clone <URL_REPO>
cd ytb-code
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Remplir le fichier `.env` :
```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/ytb_promo_codes"

# Clé API YouTube (obtenir sur console.cloud.google.com)
YOUTUBE_API_KEY="votre_clé_api_youtube"

# URL de l'application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Clé secrète admin (changer cette valeur)
ADMIN_SECRET_KEY="votre_mot_de_passe_admin_sécurisé"
```

4. **Créer la base de données**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 🔑 Obtenir une Clé API YouTube

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet
3. Activer **YouTube Data API v3**
4. Créer des identifiants → Clé API
5. Copier la clé dans `.env`

**Quota gratuit** : 10,000 unités/jour

## 📡 API Routes

### Routes Publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/categories` | Liste toutes les catégories |
| `GET` | `/api/channels` | Liste des chaînes (filtres disponibles) |
| `GET` | `/api/promo-codes` | Liste codes promo (pagination + filtres) |
| `POST` | `/api/promo-codes/[id]/report` | Signaler un code expiré |

### Routes Admin (Auth requise)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/categories` | Créer une catégorie |
| `POST` | `/api/channels` | Ajouter une chaîne YouTube |
| `POST` | `/api/channels/[id]/scrape` | Scraper une chaîne manuellement |
| `POST` | `/api/promo-codes/[id]/approve` | Approuver un code |
| `POST` | `/api/promo-codes/[id]/reject` | Rejeter un code |
| `GET` | `/api/admin/stats` | Statistiques dashboard |

**Authentification** : Header `Authorization: Bearer <ADMIN_SECRET_KEY>`

### Routes Cron (Render)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/scraper/run` | Scraper toutes les chaînes actives |
| `POST` | `/api/scraper/cleanup` | Nettoyer les codes expirés |

## 🗄️ Schéma de Base de Données

```
categories
  ├── id (UUID)
  ├── name (String, unique)
  ├── slug (String, unique)
  └── description (String?)

channels
  ├── id (UUID)
  ├── youtubeId (String, unique)
  ├── name (String)
  ├── categoryId (FK → categories)
  ├── isActive (Boolean)
  └── lastScrapedAt (DateTime?)

videos
  ├── id (UUID)
  ├── youtubeId (String, unique)
  ├── title (String)
  ├── description (Text)
  ├── channelId (FK → channels)
  └── hasBeenScraped (Boolean)

promo_codes
  ├── id (UUID)
  ├── code (String)
  ├── brand (String?)
  ├── product (String?)
  ├── discount (String?)
  ├── videoId (FK → videos)
  ├── channelId (FK → channels)
  ├── status (PENDING | APPROVED | REJECTED | EXPIRED)
  ├── isActive (Boolean)
  └── expiresAt (DateTime?)

user_reports
  ├── id (UUID)
  ├── promoCodeId (FK → promo_codes)
  ├── reason (EXPIRED | INVALID | OTHER)
  └── comment (Text?)
```

## 🎯 Fonctionnalités de Détection

Le système détecte automatiquement dans les descriptions :
- ✅ Codes promo (patterns : CODE, PROMO, COUPON + alphanumériques)
- ✅ Marques associées
- ✅ Types de produits (VPN, hébergement, formation, etc.)
- ✅ Réductions (pourcentages, montants)
- ✅ Dates d'expiration
- ✅ Score de confiance pour chaque détection

## 🔄 Workflow

1. **Admin ajoute une chaîne YouTube** via `/api/channels`
2. **Scraper récupère les vidéos récentes** et analyse les descriptions
3. **Codes détectés** → Status `PENDING`
4. **Admin modère** → `APPROVED` (visible) ou `REJECTED`
5. **Utilisateurs signalent** codes expirés (≥3 signalements → `EXPIRED`)
6. **Cron cleanup** nettoie automatiquement les codes expirés

## 🚀 Déploiement sur Render

### 1. Créer la base de données PostgreSQL

1. Aller sur [Render Dashboard](https://dashboard.render.com/)
2. **New** → **PostgreSQL**
3. Copier l'**External Database URL**

### 2. Créer le Web Service

1. **New** → **Web Service**
2. Connecter le repository GitHub
3. Configuration :
   - **Build Command** : `npm install && npx prisma generate && npm run build`
   - **Start Command** : `npm start`
4. Ajouter les variables d'environnement :
   - `DATABASE_URL`
   - `YOUTUBE_API_KEY`
   - `ADMIN_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL` (URL Render)

### 3. Appliquer les migrations

```bash
npx prisma migrate deploy
```

### 4. Configurer les Cron Jobs

**Scraper (toutes les 12h)**
- Command : `curl -X POST https://[votre-app].onrender.com/api/scraper/run -H "Authorization: Bearer [ADMIN_SECRET_KEY]"`
- Schedule : `0 */12 * * *`

**Cleanup (tous les jours à 2h)**
- Command : `curl -X POST https://[votre-app].onrender.com/api/scraper/cleanup -H "Authorization: Bearer [ADMIN_SECRET_KEY]"`
- Schedule : `0 2 * * *`

## 📁 Structure du Projet

```
ytb-code/
├── app/
│   ├── api/              # Routes API
│   │   ├── categories/
│   │   ├── channels/
│   │   ├── promo-codes/
│   │   ├── scraper/
│   │   └── admin/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth/             # Authentification admin
│   ├── promo/            # Détection codes promo
│   ├── youtube/          # Services YouTube API
│   └── prisma.ts         # Client Prisma
├── prisma/
│   └── schema.prisma     # Schéma BDD
├── .env.example
├── ROADMAP.md            # Plan détaillé
└── PROJECT_STATUS.md     # État du projet
```

## 📚 Documentation

- [ROADMAP.md](ROADMAP.md) - Plan détaillé phase par phase
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - État actuel du développement

## 🧪 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm start            # Serveur production
npm run lint         # Linter ESLint

npx prisma studio    # Interface graphique BDD
npx prisma generate  # Générer client Prisma
npx prisma migrate dev  # Créer migration
```

## ⚠️ Important

- **Ne jamais commiter** le fichier `.env`
- **Changer** la valeur de `ADMIN_SECRET_KEY`
- **Respecter** les quotas YouTube API (10,000 unités/jour)
- **Protéger** les routes admin en production

## 📊 Coûts Estimés

- **Render PostgreSQL** : ~7$/mois
- **Render Web Service** : ~7$/mois
- **YouTube API** : Gratuit (quota 10k/jour)
- **Total** : ~14$/mois

## 🤝 Contribution

Ce projet est personnel. Pour toute question ou suggestion, ouvrir une issue.

## 📄 Licence

Tous droits réservés.
