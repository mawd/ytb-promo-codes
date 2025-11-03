#!/bin/bash

# Script de configuration automatique sur Render
# Utilise l'API REST de Render

set -e

RENDER_API_KEY="rnd_q8Xq2bgR9ze4eKHWKkODiKSV2tr1"
API_BASE="https://api.render.com/v1"

echo "🚀 Configuration Render - Site Codes Promo YouTube"
echo ""

# Fonction pour faire des requêtes API
render_api() {
  local method=$1
  local endpoint=$2
  local data=$3

  if [ -z "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      "$API_BASE$endpoint"
  else
    curl -s -X "$method" \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE$endpoint"
  fi
}

# 1. Lister les services existants
echo "📋 Vérification des services existants..."
SERVICES=$(render_api GET "/owners/me/services")
echo "$SERVICES" | jq -r '.[] | "\(.name) (\(.type))"' 2>/dev/null || echo "Aucun service trouvé"
echo ""

# 2. Créer la base de données PostgreSQL
echo "🗄️  Création de la base de données PostgreSQL..."
read -p "Nom de la base de données (ytb-promo-codes-db) : " DB_NAME
DB_NAME=${DB_NAME:-ytb-promo-codes-db}

read -p "Nom de la database (ytb_promo_codes) : " DATABASE_NAME
DATABASE_NAME=${DATABASE_NAME:-ytb_promo_codes}

read -p "Region (frankfurt/oregon/ohio/singapore) [frankfurt] : " REGION
REGION=${REGION:-frankfurt}

DB_PAYLOAD=$(cat <<EOF
{
  "name": "$DB_NAME",
  "databaseName": "$DATABASE_NAME",
  "databaseUser": "ytb_admin",
  "region": "$REGION",
  "plan": "starter"
}
EOF
)

echo "Création en cours..."
DB_RESPONSE=$(render_api POST "/postgres" "$DB_PAYLOAD")
DB_ID=$(echo "$DB_RESPONSE" | jq -r '.id')

if [ "$DB_ID" != "null" ] && [ -n "$DB_ID" ]; then
  echo "✅ Base de données créée avec succès !"
  echo "   ID: $DB_ID"

  # Attendre que la DB soit prête
  echo "⏳ Attente de la disponibilité de la DB (cela peut prendre quelques minutes)..."
  sleep 10

  # Récupérer les infos de connexion
  DB_INFO=$(render_api GET "/postgres/$DB_ID")
  DB_HOST=$(echo "$DB_INFO" | jq -r '.host // empty')
  DB_PORT=$(echo "$DB_INFO" | jq -r '.port // empty')

  if [ -n "$DB_HOST" ]; then
    DATABASE_URL="postgresql://ytb_admin@$DB_HOST:$DB_PORT/$DATABASE_NAME"
    echo "   URL de connexion (temporaire, voir Render Dashboard pour la complète) :"
    echo "   $DATABASE_URL"
    echo ""
    echo "⚠️  IMPORTANT : Récupérez l'URL complète avec mot de passe depuis Render Dashboard"
    echo "   https://dashboard.render.com/d/$DB_ID"
  fi
else
  echo "❌ Erreur lors de la création de la base de données"
  echo "$DB_RESPONSE" | jq
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. Instructions pour créer le Web Service
echo "📦 Prochaines étapes pour le Web Service :"
echo ""
echo "1. Pousser votre code sur GitHub si ce n'est pas déjà fait :"
echo "   git remote add origin https://github.com/VOTRE_USERNAME/ytb-promo-codes.git"
echo "   git push -u origin main"
echo ""
echo "2. Aller sur Render Dashboard : https://dashboard.render.com/"
echo "3. Cliquer sur 'New +' → 'Web Service'"
echo "4. Connecter votre repository GitHub"
echo "5. Configuration :"
echo "   - Name: ytb-promo-codes"
echo "   - Environment: Node"
echo "   - Build Command: npm install && npx prisma generate && npm run build"
echo "   - Start Command: npm start"
echo "   - Plan: Starter (7\$/mois)"
echo ""
echo "6. Variables d'environnement à ajouter :"
echo "   DATABASE_URL=<URL_depuis_render_dashboard>"
echo "   YOUTUBE_API_KEY=<votre_clé_youtube>"
echo "   ADMIN_SECRET_KEY=<votre_secret_admin>"
echo "   NEXT_PUBLIC_APP_URL=<url_render_web_service>"
echo ""
echo "7. Déployer et attendre le build"
echo ""

# 4. Sauvegarder les informations
SETUP_INFO_FILE=".render-setup.json"
cat > "$SETUP_INFO_FILE" <<EOF
{
  "database": {
    "id": "$DB_ID",
    "name": "$DB_NAME",
    "region": "$REGION",
    "dashboard_url": "https://dashboard.render.com/d/$DB_ID"
  },
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "💾 Informations sauvegardées dans $SETUP_INFO_FILE"
echo ""
echo "✅ Configuration de base terminée !"
echo ""
echo "📚 Consultez SETUP_DATABASE.md pour plus de détails"
