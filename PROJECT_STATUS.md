# État du Projet - Site Codes Promo YouTube

**Dernière mise à jour** : 2025-11-03

## ✅ Phases Complétées

### Phase 1 : Configuration Initiale ✓
- [x] Projet Next.js 14 avec TypeScript, Tailwind CSS, ESLint
- [x] Prisma ORM configuré
- [x] Schéma de base de données complet (4 tables + 2 enums)
- [x] Git initialisé avec 3 commits
- [x] Variables d'environnement (.env.example et .env)
- [x] Client Prisma singleton créé

### Phase 2 : Services Backend ✓
- [x] Service YouTube API (client, channels, videos)
- [x] Détection automatique codes promo (regex + patterns)
- [x] Middleware authentification admin
- [x] Gestion des erreurs et validations

### Phase 3 : API Routes Complètes ✓

#### Routes Publiques
- [x] `GET /api/categories` - Liste catégories
- [x] `GET /api/channels` - Liste chaînes (avec filtres)
- [x] `GET /api/channels/[id]` - Détails chaîne
- [x] `GET /api/promo-codes` - Liste codes (filtres + pagination)
- [x] `GET /api/promo-codes/[id]` - Détails code
- [x] `POST /api/promo-codes/[id]/report` - Signaler code

#### Routes Admin
- [x] `POST /api/categories` - Créer catégorie
- [x] `POST /api/channels` - Ajouter chaîne YouTube
- [x] `PATCH /api/channels/[id]` - Modifier chaîne
- [x] `DELETE /api/channels/[id]` - Supprimer chaîne
- [x] `POST /api/channels/[id]/scrape` - Scraper manuellement
- [x] `PATCH /api/promo-codes/[id]` - Modifier code
- [x] `DELETE /api/promo-codes/[id]` - Supprimer code
- [x] `POST /api/promo-codes/[id]/approve` - Approuver code
- [x] `POST /api/promo-codes/[id]/reject` - Rejeter code
- [x] `GET /api/admin/stats` - Statistiques dashboard

#### Routes Scraper (pour Cron Jobs)
- [x] `POST /api/scraper/run` - Scraper toutes les chaînes actives
- [x] `POST /api/scraper/cleanup` - Nettoyer codes expirés

## 🚧 En Attente

### Phase 4 : Interface Utilisateur (À faire)
- [ ] Layout global (Header + Footer)
- [ ] Page d'accueil
  - [ ] Liste des codes promo
  - [ ] Barre de recherche
  - [ ] Filtres (catégorie, marque, produit)
  - [ ] Pagination
  - [ ] Bouton "Copier le code"
  - [ ] Modal signalement
- [ ] Pages Admin
  - [ ] Dashboard avec statistiques
  - [ ] Gestion des chaînes
  - [ ] Modération des codes
  - [ ] Gestion des catégories
  - [ ] Authentification admin

### Phase 5 : Déploiement Render (À faire)
- [ ] Créer base de données PostgreSQL sur Render
- [ ] Créer Web Service sur Render
- [ ] Configurer variables d'environnement
- [ ] Exécuter migrations Prisma en production
- [ ] Configurer Cron Jobs :
  - Scraper : toutes les 12h
  - Cleanup : tous les jours à 2h
- [ ] Tester le déploiement

### Phase 6 : Configuration YouTube API (À faire)
- [ ] Créer projet Google Cloud
- [ ] Activer YouTube Data API v3
- [ ] Générer clé API
- [ ] Ajouter la clé dans .env

## 📁 Structure du Projet

```
ytb-code/
├── app/
│   ├── api/
│   │   ├── categories/          ✓ Routes catégories
│   │   ├── channels/             ✓ Routes chaînes + scrape
│   │   ├── promo-codes/          ✓ Routes codes promo
│   │   ├── scraper/              ✓ Routes scraper
│   │   └── admin/                ✓ Routes admin
│   ├── layout.tsx                ⚠ À personnaliser
│   └── page.tsx                  ⚠ À créer (page d'accueil)
├── lib/
│   ├── auth/
│   │   └── admin.ts              ✓ Middleware admin
│   ├── promo/
│   │   ├── detector.ts           ✓ Détection codes
│   │   └── index.ts              ✓
│   ├── youtube/
│   │   ├── client.ts             ✓ Client YouTube
│   │   ├── channels.ts           ✓ Service chaînes
│   │   ├── videos.ts             ✓ Service vidéos
│   │   └── index.ts              ✓
│   └── prisma.ts                 ✓ Client Prisma
├── prisma/
│   └── schema.prisma             ✓ Schéma DB complet
├── .env.example                  ✓
├── ROADMAP.md                    ✓ Roadmap détaillée
└── PROJECT_STATUS.md             ✓ Ce fichier
```

## 🗄️ Schéma de Base de Données

### Tables
1. **categories** - Catégories de chaînes (Tech, Gaming, etc.)
2. **channels** - Chaînes YouTube surveillées
3. **videos** - Vidéos analysées
4. **promo_codes** - Codes promotionnels détectés
5. **user_reports** - Signalements utilisateurs

### Relations
- Category ↔ Channel (1:N)
- Channel ↔ Video (1:N)
- Channel ↔ PromoCode (1:N)
- Video ↔ PromoCode (1:N)
- PromoCode ↔ UserReport (1:N)

## 🔧 Technologies Utilisées

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Styling** : Tailwind CSS
- **ORM** : Prisma
- **Base de données** : PostgreSQL (à configurer sur Render)
- **API externe** : YouTube Data API v3
- **Déploiement** : Render (prévu)

## 🚀 Commandes Utiles

### Développement
```bash
npm run dev                  # Lancer le serveur de développement
npx prisma studio           # Explorer la base de données
npx prisma generate         # Générer le client Prisma
npx prisma migrate dev      # Créer une migration
```

### Production (Render)
```bash
npm run build               # Build pour production
npm start                   # Démarrer en production
npx prisma migrate deploy   # Appliquer les migrations
```

## 📊 Prochaines Étapes Prioritaires

### 1. Tester les API Routes (Recommandé maintenant)
Avant de créer l'interface, il faudrait :
- [ ] Configurer une base de données PostgreSQL locale ou Render
- [ ] Obtenir une clé YouTube API
- [ ] Tester les endpoints avec un outil comme Postman ou curl
- [ ] Créer quelques catégories et chaînes de test
- [ ] Tester le scraping manuel

### 2. Créer l'Interface Utilisateur
Une fois les APIs testées et fonctionnelles :
- [ ] Créer les composants UI réutilisables
- [ ] Développer la page d'accueil
- [ ] Développer les pages admin
- [ ] Ajouter l'authentification admin simple

### 3. Déployer sur Render
- [ ] Configurer Render (DB + Web Service)
- [ ] Déployer l'application
- [ ] Configurer les Cron Jobs
- [ ] Ajouter les premières chaînes en production

## ⚠️ Points d'Attention

### Variables d'environnement requises
```env
DATABASE_URL="postgresql://..."      # ⚠ À configurer
YOUTUBE_API_KEY=""                   # ⚠ À obtenir
NEXT_PUBLIC_APP_URL="http://..."    # ✓ Défini
ADMIN_SECRET_KEY="..."               # ✓ Défini (à changer)
```

### Quotas YouTube API
- **Limite** : 10,000 unités/jour
- **Coût par opération** :
  - `channels.list` : 1 unité
  - `videos.list` : 1 unité
  - `search.list` : 100 unités
- **Estimation** : ~200 chaînes scrapées 2x/jour = ~400 unités

### Sécurité
- ✓ Routes admin protégées par token
- ✓ Validation des entrées
- ⚠ À faire : Rate limiting sur endpoints publics
- ⚠ À faire : CORS si nécessaire

## 📝 Notes de Développement

### Fonctionnalités de Détection
Le système détecte automatiquement :
- ✓ Codes promo (CODE, PROMO, COUPON + alphanumériques)
- ✓ Marques (extraction depuis contexte)
- ✓ Produits (VPN, hébergement, formation, etc.)
- ✓ Réductions (%, €, euros, dollars)
- ✓ Dates d'expiration (formats français)
- ✓ Score de confiance (0-1)
- ✓ Filtrage des faux positifs

### Workflow de Modération
1. Scraper détecte les codes → Status: `PENDING`
2. Admin modère :
   - Approuver → Status: `APPROVED` + visible publiquement
   - Rejeter → Status: `REJECTED`
3. Utilisateurs peuvent signaler (≥3 signalements → `EXPIRED`)
4. Cron cleanup : codes expirés automatiquement

## 🎯 Objectif Final

Un site web permettant de :
1. Rechercher des codes promo YouTube par catégorie/marque/produit
2. Automatiser la détection de codes dans les descriptions
3. Modérer et valider les codes détectés
4. Permettre aux utilisateurs de signaler les codes expirés

---

**État Global** : Backend complet ✅ | Interface à créer 🚧 | Déploiement à faire 📦
