# Configuration Base de Données

## Option 1 : Render PostgreSQL (Recommandé)

### Étapes :

1. **Créer la base de données sur Render**
   - Aller sur https://dashboard.render.com/
   - Cliquer sur **"New +"** → **"PostgreSQL"**
   - Configuration :
     - **Name** : `ytb-promo-codes-db`
     - **Database** : `ytb_promo_codes` (nom de la DB)
     - **User** : (généré automatiquement)
     - **Region** : Frankfurt (ou la plus proche)
     - **PostgreSQL Version** : 16
     - **Plan** : Starter ($7/mois) ou Free (avec limitations)
   - Cliquer sur **"Create Database"**

2. **Récupérer l'URL de connexion**
   - Une fois créée, aller dans l'onglet **"Connect"**
   - Copier **"External Database URL"** (commence par `postgresql://`)
   - Format : `postgresql://user:password@host:port/database`

3. **Configurer le projet local**
   ```bash
   # Ouvrir .env
   nano .env

   # Ou avec VSCode
   code .env
   ```

   Remplacer la ligne `DATABASE_URL` par l'URL Render :
   ```env
   DATABASE_URL="postgresql://user:password@dpg-xxxxx.frankfurt-postgres.render.com/ytb_promo_codes"
   ```

4. **Appliquer les migrations Prisma**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

   Vous verrez :
   ```
   ✓ Generated Prisma Client
   The following migration(s) have been created and applied from new schema changes:
   migrations/
     └─ 20250104000000_init/
         └─ migration.sql
   ```

5. **Vérifier la connexion**
   ```bash
   npx prisma studio
   ```

   Cela ouvrira une interface graphique sur http://localhost:5555
   Vous devriez voir vos 5 tables : categories, channels, videos, promo_codes, user_reports

---

## Option 2 : PostgreSQL Local (macOS)

Si vous préférez installer PostgreSQL localement :

### Installation avec Homebrew

```bash
# Installer PostgreSQL
brew install postgresql@16

# Démarrer PostgreSQL
brew services start postgresql@16

# Créer la base de données
createdb ytb_promo_codes

# Vérifier
psql -d ytb_promo_codes -c "SELECT version();"
```

### Configuration `.env`

```env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/ytb_promo_codes"
```

### Appliquer les migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
```

---

## Option 3 : Docker PostgreSQL (Alternative)

Si vous avez Docker installé :

```bash
# Lancer PostgreSQL dans Docker
docker run --name ytb-postgres \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=ytb_promo_codes \
  -p 5432:5432 \
  -d postgres:16

# Configurer .env
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/ytb_promo_codes"

# Appliquer migrations
npx prisma generate
npx prisma migrate dev --name init
```

---

## Vérification de la Configuration

### Test de connexion

```bash
# Générer le client Prisma
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio
```

Si tout fonctionne, vous verrez :
- ✅ Interface web sur http://localhost:5555
- ✅ 5 tables visibles (vides pour l'instant)

### Insérer des données de test

Vous pouvez utiliser Prisma Studio ou créer un script :

```bash
# Créer un fichier seed
touch prisma/seed.ts
```

---

## Troubleshooting

### Erreur : "Can't reach database server"

**Causes possibles :**
1. URL de connexion incorrecte
2. Base de données non démarrée (si local)
3. Firewall bloquant la connexion

**Solutions :**
```bash
# Vérifier que la DB URL est correcte
echo $DATABASE_URL

# Tester la connexion
npx prisma db push --skip-generate
```

### Erreur : "SSL connection required"

Si Render exige SSL, ajouter `?sslmode=require` :
```env
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

---

## Prochaines Étapes

Une fois la base de données configurée :

1. ✅ Créer des catégories de test
2. ✅ Obtenir une clé YouTube API
3. ✅ Tester les endpoints API
4. ✅ Ajouter une chaîne YouTube
5. ✅ Lancer un premier scraping

Voir [TESTING.md](TESTING.md) pour les tests.
