# ROADMAP - Site de Codes Promo YouTube

## Vue d'ensemble du projet
Site web permettant de rechercher et découvrir les codes promo proposés par des YouTubeurs, organisés par catégorie/thème de chaîne.

## Architecture technique

### Stack
- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Base de données**: PostgreSQL (Render)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **API externe**: YouTube Data API v3
- **Hébergement**: Render (Web Service + PostgreSQL + Cron Jobs)
- **Versioning**: Git + GitHub

---

## Phase 1 : Configuration initiale du projet (local)

### 1.1 Initialiser le projet Next.js
- [ ] Exécuter `npx create-next-app@latest` avec les options :
  - TypeScript: Oui
  - ESLint: Oui
  - Tailwind CSS: Oui
  - App Router: Oui
  - Import alias (@/): Oui
- [ ] Vérifier que le projet démarre correctement en local (`npm run dev`)
- [ ] Nettoyer les fichiers exemple de Next.js

### 1.2 Installer les dépendances principales
```bash
npm install prisma @prisma/client
npm install googleapis
npm install zod
npm install @tanstack/react-query
npm install date-fns
npm install clsx tailwind-merge
npm install -D @types/node
```

### 1.3 Configuration Prisma
- [ ] Initialiser Prisma : `npx prisma init`
- [ ] Créer le schéma de base de données dans `prisma/schema.prisma`

#### Schéma des tables :

**Table `categories`**
- id (UUID, primary key)
- name (String, unique)
- slug (String, unique)
- description (String, optional)
- createdAt (DateTime)
- updatedAt (DateTime)

**Table `channels`**
- id (UUID, primary key)
- youtubeId (String, unique) - ID de la chaîne YouTube
- name (String)
- customUrl (String, optional)
- description (String, optional)
- thumbnailUrl (String, optional)
- categoryId (UUID, foreign key -> categories)
- isActive (Boolean, default: true)
- lastScrapedAt (DateTime, optional)
- createdAt (DateTime)
- updatedAt (DateTime)

**Table `videos`**
- id (UUID, primary key)
- youtubeId (String, unique) - ID de la vidéo YouTube
- title (String)
- description (Text)
- publishedAt (DateTime)
- channelId (UUID, foreign key -> channels)
- thumbnailUrl (String, optional)
- hasBeenScraped (Boolean, default: false)
- createdAt (DateTime)
- updatedAt (DateTime)

**Table `promo_codes`**
- id (UUID, primary key)
- code (String)
- brand (String, optional) - Marque/entreprise
- product (String, optional) - Produit concerné
- discount (String, optional) - Ex: "10%", "20€"
- description (Text, optional)
- extractedText (Text) - Texte extrait de la description
- videoId (UUID, foreign key -> videos)
- channelId (UUID, foreign key -> channels)
- status (Enum: PENDING, APPROVED, REJECTED, EXPIRED)
- isActive (Boolean, default: true)
- detectedAt (DateTime)
- approvedAt (DateTime, optional)
- expiresAt (DateTime, optional)
- createdAt (DateTime)
- updatedAt (DateTime)

**Table `user_reports`** (pour signaler codes expirés)
- id (UUID, primary key)
- promoCodeId (UUID, foreign key -> promo_codes)
- reason (Enum: EXPIRED, INVALID, OTHER)
- comment (Text, optional)
- ipAddress (String, optional)
- createdAt (DateTime)

### 1.4 Configuration Git
- [ ] Initialiser Git : `git init`
- [ ] Créer `.gitignore` (inclure `.env`, `node_modules`, `.next`, etc.)
- [ ] Créer repository GitHub
- [ ] Premier commit : `git add . && git commit -m "Initial commit: Next.js + Prisma setup"`
- [ ] Lier au repo distant : `git remote add origin <URL>`
- [ ] Push : `git push -u origin main`

### 1.5 Variables d'environnement
- [ ] Créer `.env.example` avec :
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# YouTube API
YOUTUBE_API_KEY="your_youtube_api_key_here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Admin (pour sécuriser les routes admin)
ADMIN_SECRET_KEY="your_secret_key_here"
```
- [ ] Copier vers `.env` et remplir les valeurs

---

## Phase 2 : Configuration Render

### 2.1 Créer la base de données PostgreSQL
- [ ] Se connecter à Render Dashboard
- [ ] Créer une nouvelle PostgreSQL database
- [ ] Nom suggéré : `ytb-promo-codes-db`
- [ ] Plan : Starter ($7/mois)
- [ ] Copier l'URL de connexion externe (External Database URL)

### 2.2 Configurer la base de données localement
- [ ] Mettre à jour `DATABASE_URL` dans `.env` avec l'URL Render
- [ ] Générer le client Prisma : `npx prisma generate`
- [ ] Créer les migrations : `npx prisma migrate dev --name init`
- [ ] Vérifier avec Prisma Studio : `npx prisma studio`

### 2.3 Créer le Web Service
- [ ] Dans Render Dashboard, créer un nouveau Web Service
- [ ] Connecter au repository GitHub
- [ ] Configuration :
  - **Name** : `ytb-promo-codes`
  - **Environment** : Node
  - **Build Command** : `npm install && npx prisma generate && npm run build`
  - **Start Command** : `npm start`
  - **Plan** : Starter ($7/mois)
- [ ] Ajouter les variables d'environnement :
  - `DATABASE_URL`
  - `YOUTUBE_API_KEY`
  - `ADMIN_SECRET_KEY`
  - `NEXT_PUBLIC_APP_URL` (URL de production Render)

### 2.4 Premier déploiement
- [ ] Déclencher le déploiement
- [ ] Vérifier les logs
- [ ] Tester l'URL de production

---

## Phase 3 : Intégration API YouTube

### 3.1 Obtenir la clé API YouTube
- [ ] Aller sur [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Créer un nouveau projet ou sélectionner un existant
- [ ] Activer l'API "YouTube Data API v3"
- [ ] Créer des identifiants (Clé API)
- [ ] Ajouter la clé dans `.env` : `YOUTUBE_API_KEY`
- [ ] Comprendre les quotas (10,000 unités/jour par défaut)

### 3.2 Créer le service YouTube API
Fichier : `src/lib/youtube.ts`

**Fonctionnalités à implémenter :**
- [ ] `getChannelInfo(channelId: string)` - Récupérer infos chaîne
- [ ] `getRecentVideos(channelId: string, maxResults: number)` - Récupérer vidéos récentes
- [ ] `getVideoDetails(videoId: string)` - Récupérer détails vidéo (dont description complète)
- [ ] Gestion des erreurs API (quota dépassé, clé invalide, etc.)
- [ ] Cache des résultats pour économiser le quota

**Exemple de structure :**
```typescript
import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export async function getChannelInfo(channelId: string) {
  // Implémentation
}

export async function getRecentVideos(channelId: string, maxResults = 10) {
  // Implémentation
}

export async function getVideoDetails(videoId: string) {
  // Implémentation
}
```

### 3.3 Créer le service de détection de codes promo
Fichier : `src/lib/promo-detector.ts`

**Patterns de détection à implémenter :**

- [ ] Regex pour formats courants :
  - `CODE[:\s-]*([A-Z0-9]{4,20})`
  - `PROMO[:\s-]*([A-Z0-9]{4,20})`
  - `COUPON[:\s-]*([A-Z0-9]{4,20})`
  - `([A-Z0-9]{5,15})` (après mots-clés comme "code", "réduction")
  - Pourcentages : `(-?\d{1,2})%`
  - Montants : `(-?\d+)€`

- [ ] Mots-clés contextuels :
  - "code promo"
  - "code de réduction"
  - "partenariat"
  - "lien affilié"
  - "lien en description"
  - "sponsorisé par"
  - "offre spéciale"

- [ ] Extraction marque/produit :
  - Chercher après "code" ou "promo"
  - Analyser les noms propres à proximité
  - Détecter les URLs (liens affiliés)

- [ ] Extraction date d'expiration :
  - Patterns : "jusqu'au", "valable jusqu'au", "expire le"
  - Formats de dates français et anglais

**Exemple de structure :**
```typescript
export interface DetectedPromoCode {
  code: string;
  brand?: string;
  product?: string;
  discount?: string;
  extractedText: string;
  expiresAt?: Date;
  confidence: number; // 0-1
}

export function detectPromoCodes(description: string): DetectedPromoCode[] {
  // Implémentation
}
```

### 3.4 Tests unitaires
- [ ] Créer des tests pour le détecteur de codes
- [ ] Tester avec des vraies descriptions YouTube
- [ ] Ajuster les regex selon les résultats

---

## Phase 4 : Backend API Routes

### 4.1 Utilitaires communs
Fichier : `src/lib/db.ts`
- [ ] Helper pour connexion Prisma
- [ ] Gestion des erreurs de base de données

Fichier : `src/lib/auth.ts`
- [ ] Middleware de vérification admin (vérifier ADMIN_SECRET_KEY)
- [ ] Fonction `isAdmin(request: Request): boolean`

### 4.2 API Catégories
**Fichier** : `src/app/api/categories/route.ts`
- [ ] `GET /api/categories` - Lister toutes les catégories
- [ ] `POST /api/categories` - Créer une catégorie (admin only)

**Fichier** : `src/app/api/categories/[id]/route.ts`
- [ ] `GET /api/categories/[id]` - Détails d'une catégorie
- [ ] `PUT /api/categories/[id]` - Modifier une catégorie (admin)
- [ ] `DELETE /api/categories/[id]` - Supprimer une catégorie (admin)

### 4.3 API Chaînes YouTube
**Fichier** : `src/app/api/channels/route.ts`
- [ ] `GET /api/channels` - Lister toutes les chaînes (avec filtres)
- [ ] `POST /api/channels` - Ajouter une chaîne (admin only)
  - Valider l'ID YouTube
  - Récupérer automatiquement les infos via API YouTube
  - Créer l'entrée en base

**Fichier** : `src/app/api/channels/[id]/route.ts`
- [ ] `GET /api/channels/[id]` - Détails d'une chaîne
- [ ] `PUT /api/channels/[id]` - Modifier une chaîne (admin)
- [ ] `DELETE /api/channels/[id]` - Supprimer une chaîne (admin)

**Fichier** : `src/app/api/channels/[id]/scrape/route.ts`
- [ ] `POST /api/channels/[id]/scrape` - Scraper manuellement une chaîne (admin)
  - Récupérer les vidéos récentes
  - Analyser les descriptions
  - Détecter les codes promo
  - Sauvegarder en base avec status PENDING

### 4.4 API Codes Promo
**Fichier** : `src/app/api/promo-codes/route.ts`
- [ ] `GET /api/promo-codes` - Lister les codes promo
  - Filtres : status, brand, product, channelId, categoryId
  - Tri : récent, popularité
  - Pagination
  - Par défaut : uniquement APPROVED + isActive

**Fichier** : `src/app/api/promo-codes/[id]/route.ts`
- [ ] `GET /api/promo-codes/[id]` - Détails d'un code
- [ ] `PUT /api/promo-codes/[id]` - Modifier un code (admin)
- [ ] `DELETE /api/promo-codes/[id]` - Supprimer un code (admin)

**Fichier** : `src/app/api/promo-codes/[id]/approve/route.ts`
- [ ] `POST /api/promo-codes/[id]/approve` - Approuver un code (admin)
  - Mettre status = APPROVED
  - Mettre approvedAt = now

**Fichier** : `src/app/api/promo-codes/[id]/reject/route.ts`
- [ ] `POST /api/promo-codes/[id]/reject` - Rejeter un code (admin)
  - Mettre status = REJECTED

**Fichier** : `src/app/api/promo-codes/[id]/report/route.ts`
- [ ] `POST /api/promo-codes/[id]/report` - Signaler un code expiré
  - Body : { reason: 'EXPIRED' | 'INVALID' | 'OTHER', comment?: string }
  - Créer une entrée dans user_reports
  - Si >3 signalements : mettre isActive = false automatiquement

### 4.5 API Admin (Modération)
**Fichier** : `src/app/api/admin/pending-codes/route.ts`
- [ ] `GET /api/admin/pending-codes` - Lister codes en attente de modération
  - Filtre : status = PENDING
  - Inclure infos vidéo et chaîne

**Fichier** : `src/app/api/admin/stats/route.ts`
- [ ] `GET /api/admin/stats` - Statistiques
  - Nombre total de codes (par status)
  - Nombre de chaînes actives
  - Nombre de vidéos scrapées
  - Codes ajoutés aujourd'hui

### 4.6 API Scraper (pour cron job)
**Fichier** : `src/app/api/scraper/run/route.ts`
- [ ] `POST /api/scraper/run` - Lancer le scraping de toutes les chaînes actives
  - Sécuriser avec un token secret
  - Pour chaque chaîne active :
    - Récupérer les 10 dernières vidéos
    - Analyser les descriptions
    - Sauvegarder les nouveaux codes détectés
  - Retourner un rapport (nombre de vidéos analysées, codes détectés)

---

## Phase 5 : Interface utilisateur

### 5.1 Layout et composants communs
**Fichier** : `src/app/layout.tsx`
- [ ] Header avec logo et navigation
- [ ] Footer
- [ ] Metadata SEO

**Fichier** : `src/components/ui/` (composants réutilisables)
- [ ] `Button.tsx`
- [ ] `Input.tsx`
- [ ] `Select.tsx`
- [ ] `Card.tsx`
- [ ] `Badge.tsx`
- [ ] `Loading.tsx`
- [ ] `EmptyState.tsx`

### 5.2 Page d'accueil
**Fichier** : `src/app/page.tsx`

**Composants à créer :**
- [ ] `SearchBar` - Barre de recherche
- [ ] `FilterPanel` - Panneau de filtres (marque, produit, catégorie, youtubeur)
- [ ] `PromoCodeCard` - Carte affichant un code promo
  - Code (cliquable pour copier)
  - Marque/Produit
  - Réduction
  - Nom de la chaîne YouTube
  - Date de détection
  - Badge "Nouveau" si <7 jours
  - Bouton "Signaler"
- [ ] `PromoCodeList` - Liste paginée de codes
- [ ] `CategoryFilter` - Filtre par catégorie
- [ ] `SortOptions` - Options de tri

**Fonctionnalités :**
- [ ] Récupérer les codes approuvés via API
- [ ] Filtrage en temps réel
- [ ] Pagination (ou infinite scroll)
- [ ] Copie du code au clic (avec toast de confirmation)
- [ ] Responsive design (mobile-first)

### 5.3 Page de détails d'un code
**Fichier** : `src/app/promo-codes/[id]/page.tsx`
- [ ] Afficher tous les détails du code
- [ ] Lien vers la chaîne YouTube
- [ ] Bouton "Signaler le code"
- [ ] Date d'expiration si disponible

### 5.4 Page admin - Dashboard
**Fichier** : `src/app/admin/page.tsx`
- [ ] Protection par mot de passe (simple input avec ADMIN_SECRET_KEY)
- [ ] Statistiques globales
- [ ] Nombre de codes en attente de modération
- [ ] Liens vers les sections admin

### 5.5 Page admin - Gestion des chaînes
**Fichier** : `src/app/admin/channels/page.tsx`
- [ ] Liste des chaînes avec statut (active/inactive)
- [ ] Bouton "Ajouter une chaîne"
- [ ] Formulaire pour ajouter une chaîne :
  - Input : ID ou URL de la chaîne YouTube
  - Select : Catégorie
  - Bouton "Scraper maintenant"
- [ ] Bouton "Modifier" / "Supprimer" pour chaque chaîne
- [ ] Afficher la date du dernier scraping

### 5.6 Page admin - Modération
**Fichier** : `src/app/admin/moderation/page.tsx`
- [ ] Liste des codes PENDING
- [ ] Pour chaque code :
  - Afficher le code, marque, produit
  - Afficher l'extrait de la description
  - Lien vers la vidéo YouTube
  - Boutons "Approuver" / "Rejeter"
- [ ] Possibilité de modifier avant d'approuver
- [ ] Filtres : par chaîne, par date

### 5.7 Page admin - Signalements
**Fichier** : `src/app/admin/reports/page.tsx`
- [ ] Liste des signalements utilisateurs
- [ ] Groupés par code promo
- [ ] Bouton pour marquer le code comme expiré

### 5.8 Modale de signalement
**Composant** : `src/components/ReportModal.tsx`
- [ ] Formulaire pour signaler un code
- [ ] Raisons : Expiré, Invalide, Autre
- [ ] Champ commentaire optionnel
- [ ] Envoi vers `/api/promo-codes/[id]/report`

---

## Phase 6 : Automatisation avec Render Cron Jobs

### 6.1 Créer le Cron Job de scraping
- [ ] Dans Render Dashboard, aller dans le Web Service
- [ ] Ajouter un Cron Job
- [ ] Configuration :
  - **Name** : `youtube-scraper`
  - **Command** : `curl -X POST https://[your-app].onrender.com/api/scraper/run -H "Authorization: Bearer [ADMIN_SECRET_KEY]"`
  - **Schedule** : `0 */12 * * *` (toutes les 12h)
- [ ] Sécuriser l'endpoint avec un header Authorization
- [ ] Tester manuellement

### 6.2 Créer le Cron Job de nettoyage
- [ ] Créer une API route : `src/app/api/scraper/cleanup/route.ts`
  - Marquer les codes expirés (si expiresAt < now)
  - Mettre isActive = false pour codes avec >3 signalements
- [ ] Ajouter un Cron Job :
  - **Name** : `cleanup-expired-codes`
  - **Command** : `curl -X POST https://[your-app].onrender.com/api/scraper/cleanup -H "Authorization: Bearer [ADMIN_SECRET_KEY]"`
  - **Schedule** : `0 2 * * *` (tous les jours à 2h du matin)

### 6.3 Monitoring
- [ ] Ajouter des logs dans les endpoints du scraper
- [ ] Créer une page admin pour voir les logs de scraping
- [ ] Notifications par email en cas d'erreur (optionnel)

---

## Phase 7 : Tests et optimisations

### 7.1 Tests fonctionnels
- [ ] Tester l'ajout d'une chaîne
- [ ] Tester le scraping manuel
- [ ] Tester la détection de codes promo avec vraies descriptions YouTube
- [ ] Tester la modération (approve/reject)
- [ ] Tester le signalement utilisateur
- [ ] Tester les filtres et recherche

### 7.2 Optimisations
- [ ] Ajouter des index sur les colonnes fréquemment recherchées (Prisma)
- [ ] Implémenter le cache côté client (React Query)
- [ ] Optimiser les images (Next.js Image)
- [ ] Lazy loading pour les listes longues
- [ ] Compression des requêtes API

### 7.3 SEO
- [ ] Metadata dynamiques pour chaque page
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Open Graph tags
- [ ] Schema.org markup

---

## Phase 8 : Documentation et déploiement final

### 8.1 Documentation technique
- [ ] Créer `README.md` :
  - Description du projet
  - Stack technique
  - Installation locale
  - Variables d'environnement
  - Commandes utiles
- [ ] Documenter l'API (Swagger ou README détaillé)
- [ ] Ajouter des commentaires dans le code

### 8.2 Documentation utilisateur
- [ ] Guide admin : comment ajouter une chaîne
- [ ] Guide utilisateur : comment chercher et utiliser les codes

### 8.3 Déploiement final
- [ ] Vérifier toutes les variables d'environnement sur Render
- [ ] Activer les Cron Jobs
- [ ] Tester en production
- [ ] Ajouter les premières chaînes
- [ ] Lancer le premier scraping

### 8.4 Monitoring post-lancement
- [ ] Surveiller les logs Render
- [ ] Vérifier la consommation du quota YouTube API
- [ ] Analyser les performances (temps de réponse)
- [ ] Collecter les retours utilisateurs

---

## Améliorations futures (V2)

### Fonctionnalités avancées
- [ ] Authentification utilisateur (favoris, alertes)
- [ ] Système de notation des codes promo
- [ ] Commentaires utilisateurs
- [ ] Alertes email pour nouveaux codes dans une catégorie
- [ ] API publique pour développeurs
- [ ] Extension navigateur
- [ ] Application mobile

### Détection IA
- [ ] Utiliser GPT/Claude pour analyser les descriptions ambiguës
- [ ] Améliorer la détection de marque/produit
- [ ] Détection automatique de dates d'expiration plus précise

### Analytics
- [ ] Tracking des codes les plus utilisés
- [ ] Statistiques par catégorie
- [ ] Dashboard analytics pour les admins

---

## Ressources et liens utiles

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [Render Documentation](https://render.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Quotas YouTube API
- Quota par jour : 10,000 unités
- Coût d'une requête :
  - `channels.list` : 1 unité
  - `videos.list` : 1 unité
  - `search.list` : 100 unités
- Estimation : ~200 chaînes scrapées 2x/jour = ~400 requêtes = ~400 unités

### Coûts Render
- PostgreSQL Starter : 7$/mois
- Web Service Starter : 7$/mois
- Cron Jobs : Inclus gratuitement
- **Total** : ~14$/mois

---

## Checklist de lancement

- [ ] Projet Next.js initialisé et fonctionnel
- [ ] Base de données PostgreSQL créée sur Render
- [ ] Migrations Prisma appliquées
- [ ] API YouTube configurée et testée
- [ ] Détection de codes promo fonctionnelle
- [ ] Routes API complètes et testées
- [ ] Interface utilisateur responsive et fonctionnelle
- [ ] Interface admin opérationnelle
- [ ] Cron jobs configurés sur Render
- [ ] Application déployée sur Render
- [ ] README.md à jour
- [ ] Au moins 5 chaînes ajoutées
- [ ] Premier scraping réussi
- [ ] Tests utilisateur effectués

---

## Notes importantes

### Sécurité
- Ne JAMAIS commiter les fichiers `.env`
- Utiliser HTTPS uniquement (Render le fait automatiquement)
- Protéger les routes admin avec authentification
- Valider toutes les entrées utilisateur
- Limiter le rate limiting sur les endpoints publics

### Performance
- Utiliser le cache pour éviter de surcharger l'API YouTube
- Paginer les résultats
- Optimiser les requêtes Prisma (include, select)
- Utiliser Next.js Image pour les miniatures

### Legal
- Respecter les conditions d'utilisation de YouTube API
- Ajouter une page de mentions légales
- Politique de confidentialité (RGPD si utilisateurs EU)
- Afficher clairement que les codes proviennent de YouTubeurs

---

**Date de création** : 2025-11-03
**Version** : 1.0
**Auteur** : Assistant Claude
