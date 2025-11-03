export interface DetectedPromoCode {
  code: string
  brand?: string
  product?: string
  discount?: string
  extractedText: string
  expiresAt?: Date
  confidence: number // 0-1
}

// Patterns regex pour détecter les codes promo
const CODE_PATTERNS = [
  /CODE[:\s-]*([A-Z0-9]{4,20})/gi,
  /PROMO[:\s-]*([A-Z0-9]{4,20})/gi,
  /COUPON[:\s-]*([A-Z0-9]{4,20})/gi,
  /\bREDUCTION[:\s-]*([A-Z0-9]{4,20})/gi,
]

// Mots-clés contextuels indiquant la présence d'un code promo
const PROMO_KEYWORDS = [
  'code promo',
  'code de réduction',
  'code réduction',
  'code promo',
  'partenariat',
  'lien affilié',
  'lien en description',
  'sponsorisé par',
  'sponsor',
  'offre spéciale',
  'réduction exclusive',
  'promotion',
  'bénéficier',
  'réduction',
  'avec le code',
]

// Patterns pour les réductions
const DISCOUNT_PATTERNS = [
  /-?\d{1,2}%/g,
  /\d+€/g,
  /\d+\s?euros?/gi,
  /\d+\s?dollars?/gi,
]

// Patterns pour les dates d'expiration
const EXPIRY_PATTERNS = [
  /jusqu'au\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  /valable jusqu'au\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  /expire le\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  /fin le\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
]

/**
 * Détecte les codes promo dans une description de vidéo
 */
export function detectPromoCodes(description: string): DetectedPromoCode[] {
  const detectedCodes: DetectedPromoCode[] = []
  const lowerDescription = description.toLowerCase()

  // Vérifier si la description contient des mots-clés pertinents
  const hasPromoKeywords = PROMO_KEYWORDS.some(keyword =>
    lowerDescription.includes(keyword.toLowerCase())
  )

  // Si pas de mots-clés, on réduit la confiance
  const baseConfidence = hasPromoKeywords ? 0.7 : 0.3

  // Détecter les codes avec les patterns
  for (const pattern of CODE_PATTERNS) {
    const matches = Array.from(description.matchAll(pattern))

    for (const match of matches) {
      const code = match[1].trim()

      // Filtrer les faux positifs (mots trop communs)
      if (isLikelyFalsePositive(code)) {
        continue
      }

      // Extraire le contexte autour du code
      const startIndex = Math.max(0, match.index! - 150)
      const endIndex = Math.min(description.length, match.index! + match[0].length + 150)
      const context = description.substring(startIndex, endIndex)

      // Détecter la marque, le produit et la réduction dans le contexte
      const brand = detectBrand(context)
      const product = detectProduct(context)
      const discount = detectDiscount(context)
      const expiresAt = detectExpiryDate(context)

      // Calculer la confiance
      let confidence = baseConfidence
      if (brand) confidence += 0.1
      if (product) confidence += 0.1
      if (discount) confidence += 0.1

      detectedCodes.push({
        code,
        brand,
        product,
        discount,
        extractedText: context,
        expiresAt,
        confidence: Math.min(confidence, 1),
      })
    }
  }

  // Dédupliquer les codes
  return deduplicateCodes(detectedCodes)
}

/**
 * Détecte si un code est probablement un faux positif
 */
function isLikelyFalsePositive(code: string): boolean {
  const falsePositives = [
    'HTTP', 'HTTPS', 'HTML', 'VIDEO', 'AUDIO', 'IMAGE',
    'YOUTUBE', 'GOOGLE', 'FACEBOOK', 'TWITTER', 'INSTAGRAM',
  ]

  return falsePositives.includes(code.toUpperCase()) || code.length < 4 || code.length > 20
}

/**
 * Tente de détecter la marque dans le contexte
 */
function detectBrand(context: string): string | undefined {
  // Chercher après "code" ou "promo" les mots en majuscules ou capitalisés
  const brandPattern = /(?:code|promo|chez|sur)\s+([A-Z][a-zA-Z0-9]{2,20})/i
  const match = context.match(brandPattern)

  if (match) {
    const brand = match[1]
    // Filtrer les mots génériques
    if (!['Code', 'Promo', 'Video', 'Youtube'].includes(brand)) {
      return brand
    }
  }

  return undefined
}

/**
 * Tente de détecter le type de produit dans le contexte
 */
function detectProduct(context: string): string | undefined {
  const productKeywords = [
    'vpn', 'hébergement', 'hosting', 'serveur', 'cloud',
    'formation', 'cours', 'livre', 'ebook',
    'logiciel', 'software', 'app', 'application',
    'abonnement', 'subscription',
  ]

  const lowerContext = context.toLowerCase()

  for (const keyword of productKeywords) {
    if (lowerContext.includes(keyword)) {
      return keyword
    }
  }

  return undefined
}

/**
 * Détecte la réduction dans le contexte
 */
function detectDiscount(context: string): string | undefined {
  for (const pattern of DISCOUNT_PATTERNS) {
    const match = context.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return undefined
}

/**
 * Détecte la date d'expiration dans le contexte
 */
function detectExpiryDate(context: string): Date | undefined {
  for (const pattern of EXPIRY_PATTERNS) {
    const match = context.match(pattern)
    if (match && match[1]) {
      try {
        // Tenter de parser la date (format basique)
        const dateString = match[1]
        const parts = dateString.split(/[\/\-]/)

        if (parts.length === 3) {
          const day = parseInt(parts[0])
          const month = parseInt(parts[1]) - 1 // Les mois JS commencent à 0
          const year = parseInt(parts[2])

          // Si l'année est sur 2 chiffres, ajouter 2000
          const fullYear = year < 100 ? 2000 + year : year

          const date = new Date(fullYear, month, day)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      } catch (error) {
        // Ignorer les erreurs de parsing
        console.error('Error parsing expiry date:', error)
      }
    }
  }

  return undefined
}

/**
 * Déduplique les codes détectés (même code trouvé plusieurs fois)
 */
function deduplicateCodes(codes: DetectedPromoCode[]): DetectedPromoCode[] {
  const uniqueCodes = new Map<string, DetectedPromoCode>()

  for (const code of codes) {
    const key = code.code.toUpperCase()

    // Garder le code avec la confiance la plus élevée
    if (!uniqueCodes.has(key) || uniqueCodes.get(key)!.confidence < code.confidence) {
      uniqueCodes.set(key, code)
    }
  }

  return Array.from(uniqueCodes.values())
}
