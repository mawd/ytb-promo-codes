# 🚀 Quick Start Guide

Guide rapide pour démarrer avec le projet en 5 minutes.

## 📋 Checklist

- [ ] Base de données PostgreSQL configurée
- [ ] Clé YouTube API obtenue
- [ ] Variables d'environnement remplies
- [ ] Migrations appliquées
- [ ] Données de test chargées

---

## Étape 1 : Base de Données (2 min)

### Option A : Render (Recommandé)

1. Aller sur https://dashboard.render.com/
2. **New +** → **PostgreSQL**
3. Nom: `ytb-promo-codes-db`, Plan: Free ou Starter
4. Copier l'**External Database URL**

### Option B : Docker (si installé)

```bash
docker run --name ytb-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ytb_promo_codes \
  -p 5432:5432 \
  -d postgres:16
```

---

## Étape 2 : Configuration (1 min)

```bash
# Copier .env.example
cp .env.example .env

# Éditer .env
code .env  # ou nano .env
```

**Remplir les valeurs :**
```env
# Coller l'URL Render ou utiliser l'URL Docker
DATABASE_URL="postgresql://..."

# Obtenir sur https://console.cloud.google.com/
YOUTUBE_API_KEY="votre_clé_api"

# URL locale
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Changer ce secret
ADMIN_SECRET_KEY="mon_secret_admin_123"
```

---

## Étape 3 : Obtenir Clé YouTube API (2 min)

1. https://console.cloud.google.com/
2. Créer un projet "YouTube Promo Codes"
3. **APIs & Services** → **Enable APIs**
4. Chercher et activer **YouTube Data API v3**
5. **Credentials** → **Create Credentials** → **API Key**
6. Copier la clé dans `.env`

---

## Étape 4 : Initialiser la Base de Données (1 min)

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables
npm run db:migrate

# Charger les données de test (5 catégories)
npm run db:seed
```

**Résultat attendu :**
```
🌱 Seeding database...
📁 Creating categories...
✅ Categories created: { tech, gaming, lifestyle, finance, education }
✅ Seed completed!
```

---

## Étape 5 : Vérifier (1 min)

```bash
# Ouvrir Prisma Studio
npm run db:studio
```

Aller sur http://localhost:5555

Vous devriez voir :
- ✅ 5 tables (categories, channels, videos, promo_codes, user_reports)
- ✅ 5 catégories dans la table categories

---

## Étape 6 : Démarrer le Serveur

```bash
npm run dev
```

Ouvrir http://localhost:3000

---

## 🧪 Premier Test

### 1. Lister les catégories

```bash
curl http://localhost:3000/api/categories
```

Vous devriez voir les 5 catégories.

### 2. Ajouter une chaîne YouTube

Exemple avec Underscore_ (chaîne tech française) :

```bash
# Trouver l'ID de la catégorie Tech
CATEGORY_ID=$(curl -s http://localhost:3000/api/categories | jq -r '.[] | select(.slug=="tech") | .id')

# Ajouter la chaîne
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mon_secret_admin_123" \
  -d "{
    \"youtubeId\": \"UCkXKd9N9ZDkHWkgIIjOz5Ig\",
    \"categoryId\": \"$CATEGORY_ID\"
  }"
```

**Résultat attendu :**
```json
{
  "id": "...",
  "youtubeId": "UCkXKd9N9ZDkHWkgIIjOz5Ig",
  "name": "Underscore_",
  "description": "...",
  "isActive": true,
  ...
}
```

### 3. Scraper la chaîne

```bash
# Récupérer l'ID de la chaîne
CHANNEL_ID=$(curl -s http://localhost:3000/api/channels | jq -r '.[0].id')

# Lancer le scraping
curl -X POST "http://localhost:3000/api/channels/$CHANNEL_ID/scrape" \
  -H "Authorization: Bearer mon_secret_admin_123"
```

**Résultat attendu :**
```json
{
  "message": "Scraping completed successfully",
  "channelName": "Underscore_",
  "videosProcessed": 15,
  "codesDetected": 2
}
```

### 4. Voir les codes détectés

```bash
# Codes en attente
curl "http://localhost:3000/api/promo-codes?status=PENDING" | jq

# Statistiques
curl "http://localhost:3000/api/admin/stats" \
  -H "Authorization: Bearer mon_secret_admin_123" | jq
```

---

## 🎯 Prochaines Étapes

### Ajouter plus de chaînes

Exemples de chaînes avec codes promo :

**Tech :**
- Underscore_ : `UCkXKd9N9ZDkHWkgIIjOz5Ig`
- Micode : `UCYnx5v0p8Bh8HvvLnCZKVIA`
- Cookie connecté : `UCO-DQkkWgVDLkTjLV9VCdWw`

**Gaming :**
- Squeezie : `UC4PooiX37Pld1T8J5SYT-SQ`

**Finance :**
- Zonebourse : `UCVf62yzjV4_nCY4ND9jJmMg`

```bash
# Remplacer YOUTUBE_ID et CATEGORY_ID
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mon_secret_admin_123" \
  -d '{"youtubeId": "YOUTUBE_ID", "categoryId": "CATEGORY_ID"}'
```

### Scraper toutes les chaînes

```bash
curl -X POST http://localhost:3000/api/scraper/run \
  -H "Authorization: Bearer mon_secret_admin_123"
```

### Modérer les codes

```bash
# Approuver un code
CODE_ID="..."  # Copier depuis la liste
curl -X POST "http://localhost:3000/api/promo-codes/$CODE_ID/approve" \
  -H "Authorization: Bearer mon_secret_admin_123"
```

---

## 📚 Documentation Complète

- [README.md](README.md) - Documentation complète
- [TESTING.md](TESTING.md) - Guide de test détaillé
- [SETUP_DATABASE.md](SETUP_DATABASE.md) - Configuration DB approfondie
- [ROADMAP.md](ROADMAP.md) - Plan de développement
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - État du projet

---

## ❓ Problèmes Courants

### Erreur : Cannot find module '@prisma/client'
```bash
npm run db:generate
```

### Erreur : Can't reach database server
Vérifier `DATABASE_URL` dans `.env`

### Erreur : YouTube channel not found
- Vérifier `YOUTUBE_API_KEY` dans `.env`
- Vérifier que l'ID YouTube est correct

### Pas de codes détectés
Normal si les vidéos n'ont pas de codes dans leurs descriptions. Essayer d'autres chaînes.

---

## ✅ Vous êtes Prêt !

Le backend est maintenant fonctionnel. Vous pouvez :
1. ✅ Ajouter des chaînes YouTube
2. ✅ Scraper automatiquement les vidéos
3. ✅ Détecter les codes promo
4. ✅ Modérer les codes
5. ➡️ **Créer l'interface utilisateur** (prochaine étape)

Pour l'interface, voir [ROADMAP.md](ROADMAP.md) Phase 5.
