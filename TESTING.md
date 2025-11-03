# Guide de Test des APIs

Ce guide vous permet de tester toutes les fonctionnalités backend avant de créer l'interface utilisateur.

## Prérequis

- ✅ Base de données configurée et migrée
- ✅ Serveur de développement lancé (`npm run dev`)
- ✅ Clé YouTube API obtenue et configurée dans `.env`

## Outils de Test

### Option 1 : curl (Terminal)
Déjà installé sur macOS

### Option 2 : HTTPie (Recommandé)
```bash
brew install httpie
```

### Option 3 : VS Code Extension
- Thunder Client (gratuit)
- REST Client (gratuit)

---

## 1️⃣ Tester les Catégories

### Créer une catégorie (Admin)

```bash
# Avec curl
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d '{
    "name": "Tech",
    "slug": "tech",
    "description": "Chaînes tech et développement"
  }'

# Avec HTTPie
http POST localhost:3000/api/categories \
  Authorization:"Bearer changeme_admin_secret_123" \
  name="Tech" \
  slug="tech" \
  description="Chaînes tech et développement"
```

**Résultat attendu :**
```json
{
  "id": "uuid-generated",
  "name": "Tech",
  "slug": "tech",
  "description": "Chaînes tech et développement",
  "createdAt": "2025-01-04T...",
  "updatedAt": "2025-01-04T..."
}
```

### Créer plusieurs catégories

```bash
# Gaming
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d '{"name": "Gaming", "slug": "gaming"}'

# Beauté
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d '{"name": "Beauté", "slug": "beaute"}'

# Finance
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d '{"name": "Finance", "slug": "finance"}'
```

### Lister les catégories (Public)

```bash
curl http://localhost:3000/api/categories
```

---

## 2️⃣ Tester les Chaînes YouTube

### Trouver l'ID d'une chaîne YouTube

**Méthode 1 : Depuis l'URL de la chaîne**
- URL : `https://www.youtube.com/@MonsieurPhi`
- Aller sur la chaîne → Clic droit "Afficher le code source"
- Chercher `"channelId"` ou `"externalId"`
- ID : `UCqA8H22FwgBVcF3GJpp0MQw`

**Méthode 2 : Via l'API YouTube**
```bash
# Installer jq pour parser JSON
brew install jq

# Rechercher une chaîne par nom
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=Monsieur+Phi&key=VOTRE_CLE_API" | jq
```

### Ajouter une chaîne (Admin)

Exemple avec Monsieur Phi (chaîne philo/science) :

```bash
# Récupérer l'ID de la catégorie Tech
CATEGORY_ID=$(curl -s http://localhost:3000/api/categories | jq -r '.[] | select(.slug=="tech") | .id')

# Ajouter la chaîne
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d "{
    \"youtubeId\": \"UCqA8H22FwgBVcF3GJpp0MQw\",
    \"categoryId\": \"$CATEGORY_ID\"
  }"
```

**Résultat attendu :**
```json
{
  "id": "uuid",
  "youtubeId": "UCqA8H22FwgBVcF3GJpp0MQw",
  "name": "Monsieur Phi",
  "description": "...",
  "thumbnailUrl": "https://...",
  "categoryId": "...",
  "category": {
    "id": "...",
    "name": "Tech",
    ...
  },
  "isActive": true,
  ...
}
```

### Exemples de chaînes à tester

```bash
# Tech : Underscore_
# ID: UCkXKd9N9ZDkHWkgIIjOz5Ig
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d "{\"youtubeId\": \"UCkXKd9N9ZDkHWkgIIjOz5Ig\", \"categoryId\": \"$CATEGORY_ID\"}"

# Gaming : Squeezie
# ID: UC4PooiX37Pld1T8J5SYT-SQ
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d "{\"youtubeId\": \"UC4PooiX37Pld1T8J5SYT-SQ\", \"categoryId\": \"$GAMING_CATEGORY_ID\"}"
```

### Lister les chaînes

```bash
# Toutes les chaînes
curl http://localhost:3000/api/channels

# Chaînes actives uniquement
curl "http://localhost:3000/api/channels?active=true"

# Par catégorie
curl "http://localhost:3000/api/channels?category=$CATEGORY_ID"
```

---

## 3️⃣ Scraper une Chaîne

### Scraping manuel

```bash
# Récupérer l'ID d'une chaîne
CHANNEL_ID=$(curl -s http://localhost:3000/api/channels | jq -r '.[0].id')

# Lancer le scraping
curl -X POST "http://localhost:3000/api/channels/$CHANNEL_ID/scrape" \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

**Résultat attendu :**
```json
{
  "message": "Scraping completed successfully",
  "channelName": "Monsieur Phi",
  "videosProcessed": 15,
  "codesDetected": 3
}
```

### Vérifier les codes détectés

```bash
# Lister tous les codes (admin view)
curl "http://localhost:3000/api/promo-codes?status=all" \
  -H "Authorization: Bearer changeme_admin_secret_123"

# Codes en attente de modération
curl "http://localhost:3000/api/promo-codes?status=PENDING" \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

---

## 4️⃣ Modération des Codes

### Approuver un code

```bash
# Récupérer l'ID d'un code PENDING
CODE_ID=$(curl -s "http://localhost:3000/api/promo-codes?status=PENDING" | jq -r '.data[0].id')

# Approuver
curl -X POST "http://localhost:3000/api/promo-codes/$CODE_ID/approve" \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

### Rejeter un code

```bash
curl -X POST "http://localhost:3000/api/promo-codes/$CODE_ID/reject" \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

### Modifier un code avant d'approuver

```bash
curl -X PATCH "http://localhost:3000/api/promo-codes/$CODE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer changeme_admin_secret_123" \
  -d '{
    "brand": "NordVPN",
    "product": "VPN",
    "discount": "70%",
    "expiresAt": "2025-12-31T23:59:59Z"
  }'

# Puis approuver
curl -X POST "http://localhost:3000/api/promo-codes/$CODE_ID/approve" \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

---

## 5️⃣ API Publique (Codes Approuvés)

### Lister les codes publics

```bash
# Tous les codes approuvés
curl http://localhost:3000/api/promo-codes

# Avec pagination
curl "http://localhost:3000/api/promo-codes?page=1&limit=10"

# Filtrer par marque
curl "http://localhost:3000/api/promo-codes?brand=NordVPN"

# Filtrer par catégorie
curl "http://localhost:3000/api/promo-codes?category=$CATEGORY_ID"

# Recherche
curl "http://localhost:3000/api/promo-codes?search=vpn"
```

### Signaler un code expiré (Public)

```bash
curl -X POST "http://localhost:3000/api/promo-codes/$CODE_ID/report" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "EXPIRED",
    "comment": "Le code ne fonctionne plus"
  }'
```

---

## 6️⃣ Statistiques Admin

```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

**Résultat attendu :**
```json
{
  "overview": {
    "totalCodes": 25,
    "totalChannels": 3,
    "activeChannels": 3,
    "totalVideos": 45,
    "recentCodes": 8
  },
  "codesByStatus": {
    "pending": 5,
    "approved": 15,
    "rejected": 3,
    "expired": 2
  },
  "topCategories": [...],
  "needsModeration": [...]
}
```

---

## 7️⃣ Scraper Global (Cron)

```bash
# Scraper toutes les chaînes actives
curl -X POST http://localhost:3000/api/scraper/run \
  -H "Authorization: Bearer changeme_admin_secret_123"

# Cleanup codes expirés
curl -X POST http://localhost:3000/api/scraper/cleanup \
  -H "Authorization: Bearer changeme_admin_secret_123"
```

---

## 🧪 Script de Test Complet

Créer un fichier `test-api.sh` :

```bash
#!/bin/bash

API_URL="http://localhost:3000"
ADMIN_TOKEN="changeme_admin_secret_123"

echo "🧪 Test des APIs - Site Codes Promo YouTube"
echo ""

# 1. Créer une catégorie
echo "1️⃣ Création catégorie Tech..."
CATEGORY=$(curl -s -X POST "$API_URL/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "Tech", "slug": "tech"}')
CATEGORY_ID=$(echo $CATEGORY | jq -r '.id')
echo "✅ Catégorie créée : $CATEGORY_ID"

# 2. Ajouter une chaîne
echo ""
echo "2️⃣ Ajout chaîne YouTube..."
CHANNEL=$(curl -s -X POST "$API_URL/api/channels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"youtubeId\": \"UCqA8H22FwgBVcF3GJpp0MQw\", \"categoryId\": \"$CATEGORY_ID\"}")
CHANNEL_ID=$(echo $CHANNEL | jq -r '.id')
CHANNEL_NAME=$(echo $CHANNEL | jq -r '.name')
echo "✅ Chaîne ajoutée : $CHANNEL_NAME ($CHANNEL_ID)"

# 3. Scraper la chaîne
echo ""
echo "3️⃣ Scraping de la chaîne..."
SCRAPE_RESULT=$(curl -s -X POST "$API_URL/api/channels/$CHANNEL_ID/scrape" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo $SCRAPE_RESULT | jq
echo "✅ Scraping terminé"

# 4. Lister les codes détectés
echo ""
echo "4️⃣ Codes détectés (PENDING)..."
curl -s "$API_URL/api/promo-codes?status=PENDING" | jq '.data | length'
echo "codes en attente"

# 5. Stats
echo ""
echo "5️⃣ Statistiques..."
curl -s "$API_URL/api/admin/stats" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.overview'

echo ""
echo "✅ Tests terminés !"
```

Rendre exécutable et lancer :
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## ⚠️ Troubleshooting

### Erreur 401 Unauthorized
- Vérifier que `ADMIN_SECRET_KEY` dans `.env` correspond au token utilisé
- Format header : `Authorization: Bearer <token>`

### Erreur 404 YouTube channel not found
- Vérifier que l'ID YouTube est correct
- Vérifier que `YOUTUBE_API_KEY` est configurée
- Tester la clé : https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UCqA8H22FwgBVcF3GJpp0MQw&key=VOTRE_CLE

### Erreur Database connection
- Vérifier `DATABASE_URL` dans `.env`
- Tester : `npx prisma studio`

### Pas de codes détectés
- Normal si les vidéos n'ont pas de codes promo dans la description
- Essayer avec une chaîne tech qui fait souvent des partenariats
- Vérifier les logs du scraper

---

## 📊 Prochaines Étapes

Une fois les tests réussis :
1. ✅ Créer plusieurs catégories
2. ✅ Ajouter 5-10 chaînes YouTube
3. ✅ Scraper toutes les chaînes
4. ✅ Modérer les codes détectés
5. ➡️ **Créer l'interface utilisateur**

Voir [ROADMAP.md](ROADMAP.md) pour la suite.
