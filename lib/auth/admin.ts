import { NextRequest } from 'next/server'

/**
 * Vérifie si la requête contient le token admin valide
 */
export function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return false
  }

  // Format attendu: "Bearer <ADMIN_SECRET_KEY>"
  const token = authHeader.replace('Bearer ', '').trim()
  const adminSecretKey = process.env.ADMIN_SECRET_KEY

  if (!adminSecretKey) {
    console.error('ADMIN_SECRET_KEY is not configured in environment variables')
    return false
  }

  return token === adminSecretKey
}

/**
 * Middleware pour protéger les routes admin
 * Retourne une réponse d'erreur si l'utilisateur n'est pas admin
 */
export function requireAdmin(request: NextRequest): Response | null {
  if (!isAdmin(request)) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Admin authentication required',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }

  return null
}

/**
 * Vérifie le token admin depuis un header simple (non Bearer)
 * Utile pour les cron jobs
 */
export function isAdminToken(token: string | null): boolean {
  if (!token) {
    return false
  }

  const adminSecretKey = process.env.ADMIN_SECRET_KEY

  if (!adminSecretKey) {
    console.error('ADMIN_SECRET_KEY is not configured in environment variables')
    return false
  }

  return token === adminSecretKey
}
