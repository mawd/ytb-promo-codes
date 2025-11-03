import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'
import { getChannelInfo } from '@/lib/youtube'

/**
 * GET /api/channels
 * Liste toutes les chaînes (avec filtres optionnels)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'

    const where: any = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (activeOnly) {
      where.isActive = true
    }

    const channels = await prisma.channel.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            videos: true,
            promoCodes: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/channels
 * Ajouter une nouvelle chaîne YouTube (admin only)
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const body = await request.json()
    const { youtubeId, categoryId } = body

    if (!youtubeId || !categoryId) {
      return NextResponse.json(
        { error: 'youtubeId and categoryId are required' },
        { status: 400 }
      )
    }

    // Vérifier que la catégorie existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Récupérer les infos de la chaîne depuis YouTube
    const channelInfo = await getChannelInfo(youtubeId)

    if (!channelInfo) {
      return NextResponse.json(
        { error: 'YouTube channel not found' },
        { status: 404 }
      )
    }

    // Créer la chaîne en base
    const channel = await prisma.channel.create({
      data: {
        youtubeId: channelInfo.id,
        name: channelInfo.title,
        description: channelInfo.description,
        customUrl: channelInfo.customUrl,
        thumbnailUrl: channelInfo.thumbnailUrl,
        categoryId,
        isActive: true,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (error: any) {
    console.error('Error creating channel:', error)

    // Gérer l'erreur de doublon
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This channel is already registered' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}
