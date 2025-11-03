# 🚀 Guide de Déploiement Render - Étape par Étape

## ✅ Déjà Fait

- [x] PostgreSQL Database créée sur Render
  - ID: `dpg-d44jh7umcj7s73anldrg-a`
  - Dashboard: https://dashboard.render.com/d/dpg-d44jh7umcj7s73anldrg-a
  - Plan: Free (expire dans 30 jours)

- [x] Code poussé sur GitHub
  - Repository: https://github.com/mawd/ytb-promo-codes

---

## 📝 Étapes Restantes

### 1. Obtenir la DATABASE_URL complète

1. Aller sur https://dashboard.render.com/d/dpg-d44jh7umcj7s73anldrg-a
2. Attendre que le statut soit **"Available"** (peut prendre 2-3 minutes)
3. Dans la section **"Connections"**, copier **"External Database URL"**

   Format attendu :
   ```
   postgresql://ytb_promo_codes_db_user:MOT_DE_PASSE@dpg-d44jh7umcj7s73anldrg-a.frankfurt-postgres.render.com/ytb_promo_codes_db
   ```

---

### 2. Créer le Web Service sur Render

#### Étape A : Aller sur le Dashboard
1. https://dashboard.render.com/
2. Cliquer sur **"New +"** → **"Web Service"**

#### Étape B : Connecter le Repository
1. Sélectionner **"Build and deploy from a Git repository"**
2. Cliquer sur **"Connect"** pour GitHub
3. Chercher et sélectionner : **mawd/ytb-promo-codes**
4. Cliquer sur **"Connect"**

#### Étape C : Configuration du Service

**Informations de base :**
- **Name** : `ytb-promo-codes`
- **Region** : `Frankfurt` (même région que la DB)
- **Branch** : `main`
- **Runtime** : `Node`

**Build & Deploy :**
- **Build Command** :
  ```bash
  npm install && npx prisma generate && npm run build
  ```

- **Start Command** :
  ```bash
  npm start
  ```

**Plan :**
- **Instance Type** : Sélectionner **"Starter"** ($7/mois)
  - Ou **"Free"** pour tester (mais limitations)

#### Étape D : Variables d'Environnement

Cliquer sur **"Advanced"** puis **"Add Environment Variable"** pour chaque variable :

1. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: `<coller_l_url_externe_de_la_db_postgre>`

2. **YOUTUBE_API_KEY**
   - Key: `YOUTUBE_API_KEY`
   - Value: `<votre_clé_api_youtube>`
   - ⚠️ À obtenir sur https://console.cloud.google.com/

3. **ADMIN_SECRET_KEY**
   - Key: `ADMIN_SECRET_KEY`
   - Value: `un_secret_très_sécurisé_123!`
   - ⚠️ Changez cette valeur par quelque chose de fort

4. **NEXT_PUBLIC_APP_URL**
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: Laissez vide pour l'instant
   - ℹ️ Vous l'ajouterez après avoir obtenu l'URL du service

#### Étape E : Créer le Service

1. Cliquer sur **"Create Web Service"**
2. Render va commencer à déployer
3. Vous serez redirigé vers la page du service

---

### 3. Suivre le Déploiement

#### Consulter les Logs

Une fois sur la page du service :

1. Onglet **"Logs"** → Vous verrez le build en temps réel
2. Attendez de voir :
   ```
   ✓ Compiled successfully
   Starting production server...
   Ready! Listening on http://0.0.0.0:10000
   ```

#### Logs à surveiller

**Build en cours :**
```
Installing dependencies...
npm install
...
Generating Prisma Client...
npx prisma generate
...
Building Next.js...
npm run build
```

**Succès attendu :**
```
✓ Route types generated successfully
✓ Compiled successfully
Starting server...
```

**Erreurs possibles :**

❌ **"Prisma error: Can't reach database server"**
→ DATABASE_URL incorrecte ou DB pas encore disponible

❌ **"Build failed"**
→ Vérifier les logs, peut-être une dépendance manquante

---

### 4. Finaliser la Configuration

#### A. Récupérer l'URL du Service

1. En haut de la page du service, vous verrez l'URL :
   ```
   https://ytb-promo-codes.onrender.com
   ```
2. Copier cette URL

#### B. Ajouter NEXT_PUBLIC_APP_URL

1. Dans l'onglet **"Environment"**
2. Cliquer sur **"Add Environment Variable"**
3. Key: `NEXT_PUBLIC_APP_URL`
4. Value: `https://ytb-promo-codes.onrender.com`
5. Sauvegarder

**⚠️ Cela déclenchera un nouveau déploiement automatique**

#### C. Appliquer les Migrations Prisma

Une fois le service déployé, vous devez créer les tables :

**Option 1 : Via le Shell Render (Recommandé)**
1. Dans le service, onglet **"Shell"**
2. Exécuter :
   ```bash
   npx prisma migrate deploy
   ```

**Option 2 : Via un déploiement**
- Les migrations seront appliquées au prochain déploiement si vous ajoutez `prisma migrate deploy` au build command

---

### 5. Charger les Données Initiales

Une fois les migrations appliquées :

1. Dans le Shell Render, exécuter :
   ```bash
   npm run db:seed
   ```

Cela créera les 5 catégories de base :
- Tech
- Gaming
- Lifestyle
- Finance
- Éducation

---

### 6. Tester l'Application

#### Test 1 : Accéder à l'URL
```
https://ytb-promo-codes.onrender.com
```

Vous devriez voir la page d'accueil Next.js

#### Test 2 : Tester les APIs
```bash
# Lister les catégories
curl https://ytb-promo-codes.onrender.com/api/categories

# Devrait retourner les 5 catégories
```

#### Test 3 : Ajouter une chaîne (Admin)
```bash
# Remplacer <ADMIN_SECRET> par votre ADMIN_SECRET_KEY
curl -X POST https://ytb-promo-codes.onrender.com/api/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -d '{
    "youtubeId": "UCqA8H22FwgBVcF3GJpp0MQw",
    "categoryId": "<ID_CATEGORIE_TECH>"
  }'
```

---

### 7. Configurer les Cron Jobs

Une fois que tout fonctionne :

#### A. Scraper (toutes les 12h)

1. Dans le Dashboard Render, aller dans le Web Service
2. Onglet **"Settings"** → Section **"Cron Jobs"**
3. Cliquer sur **"Add Cron Job"**

Configuration :
- **Name** : `youtube-scraper`
- **Command** :
  ```bash
  curl -X POST https://ytb-promo-codes.onrender.com/api/scraper/run -H "Authorization: Bearer VOTRE_ADMIN_SECRET_KEY"
  ```
- **Schedule (Cron expression)** : `0 */12 * * *`

#### B. Cleanup (tous les jours à 2h)

1. Ajouter un autre Cron Job
2. Configuration :
   - **Name** : `cleanup-expired`
   - **Command** :
     ```bash
     curl -X POST https://ytb-promo-codes.onrender.com/api/scraper/cleanup -H "Authorization: Bearer VOTRE_ADMIN_SECRET_KEY"
     ```
   - **Schedule** : `0 2 * * *`

---

## 📊 Checklist Finale

- [ ] PostgreSQL Database disponible
- [ ] DATABASE_URL copiée
- [ ] YouTube API Key obtenue
- [ ] Web Service créé sur Render
- [ ] Variables d'environnement configurées
- [ ] Build réussi (vérifier logs)
- [ ] NEXT_PUBLIC_APP_URL ajoutée
- [ ] Migrations Prisma appliquées (`prisma migrate deploy`)
- [ ] Seed exécuté (`npm run db:seed`)
- [ ] Application accessible via l'URL
- [ ] APIs testées et fonctionnelles
- [ ] Cron Jobs configurés

---

## 🆘 Troubleshooting

### Le build échoue

**Vérifier :**
1. Les logs de build dans Render
2. Que toutes les variables d'env sont présentes
3. Que DATABASE_URL est correcte

**Solution :**
- Cliquer sur **"Manual Deploy"** → **"Clear build cache & deploy"**

### Erreur "Can't reach database"

**Cause :** DATABASE_URL incorrecte ou DB pas prête

**Solution :**
1. Vérifier que la DB est "Available"
2. Re-copier l'External Database URL
3. Vérifier qu'elle se termine bien par `/ytb_promo_codes_db`

### Application très lente

**Normal pour le plan Free :**
- Le service s'endort après 15min d'inactivité
- Premier démarrage peut prendre 30-60 secondes

**Solution :**
- Upgrader vers Starter ($7/mois)

---

## 📚 Documentation Utile

- Render Dashboard : https://dashboard.render.com/
- Render Docs : https://render.com/docs
- Next.js Deployment : https://nextjs.org/docs/deployment
- Prisma Migrations : https://www.prisma.io/docs/concepts/components/prisma-migrate

---

**Date** : 2025-11-04
**Version** : 1.0
