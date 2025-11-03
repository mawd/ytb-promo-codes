import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/admin/stats
 * Statistiques globales pour l'admin
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    // Récupérer les statistiques en parallèle
    const [
      totalCodes,
      pendingCodes,
      approvedCodes,
      rejectedCodes,
      expiredCodes,
      activeChannels,
      totalChannels,
      totalVideos,
      recentCodes,
    ] = await Promise.all([
      // Total codes
      prisma.promoCode.count(),

      // Codes par statut
      prisma.promoCode.count({ where: { status: 'PENDING' } }),
      prisma.promoCode.count({ where: { status: 'APPROVED' } }),
      prisma.promoCode.count({ where: { status: 'REJECTED' } }),
      prisma.promoCode.count({ where: { status: 'EXPIRED' } }),

      // Chaînes
      prisma.channel.count({ where: { isActive: true } }),
      prisma.channel.count(),

      // Vidéos
      prisma.video.count(),

      // Codes récents (7 derniers jours)
      prisma.promoCode.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    // Top catégories avec le plus de codes
    const topCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            channels: true,
          },
        },
      },
      take: 5,
    })

    // Codes nécessitant une modération
    const needsModeration = await prisma.promoCode.findMany({
      where: { status: 'PENDING' },
      include: {
        channel: true,
        video: {
          select: {
            title: true,
            youtubeId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({
      overview: {
        totalCodes,
        totalChannels,
        activeChannels,
        totalVideos,
        recentCodes,
      },
      codesByStatus: {
        pending: pendingCodes,
        approved: approvedCodes,
        rejected: rejectedCodes,
        expired: expiredCodes,
      },
      topCategories: topCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        channelCount: cat._count.channels,
      })),
      needsModeration,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
