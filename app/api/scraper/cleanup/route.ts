import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminToken } from '@/lib/auth/admin'

/**
 * POST /api/scraper/cleanup
 * Nettoie les codes expirés et ceux avec trop de signalements
 * Utilisé par le cron job Render
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '').trim()

    if (!isAdminToken(token || null)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results = {
      expiredCodes: 0,
      reportedCodes: 0,
    }

    // 1. Marquer les codes expirés (date d'expiration passée)
    const expiredUpdate = await prisma.promoCode.updateMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
        status: {
          not: 'EXPIRED',
        },
      },
      data: {
        status: 'EXPIRED',
        isActive: false,
      },
    })

    results.expiredCodes = expiredUpdate.count

    // 2. Désactiver les codes avec >= 3 signalements
    // D'abord, trouver les codes concernés
    const reportedCodes = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        reports: {
          some: {},
        },
      },
      include: {
        _count: {
          select: {
            reports: true,
          },
        },
      },
    })

    // Filtrer ceux qui ont >= 3 signalements et les désactiver
    for (const code of reportedCodes) {
      if (code._count.reports >= 3) {
        await prisma.promoCode.update({
          where: { id: code.id },
          data: {
            isActive: false,
            status: 'EXPIRED',
          },
        })

        results.reportedCodes++
      }
    }

    console.log('[Cleanup] Cleanup completed:', results)

    return NextResponse.json({
      message: 'Cleanup completed',
      ...results,
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: String(error) },
      { status: 500 }
    )
  }
}
