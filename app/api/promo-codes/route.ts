import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/promo-codes
 * Liste les codes promo avec filtres et pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Filtres
    const status = searchParams.get('status')
    const brand = searchParams.get('brand')
    const product = searchParams.get('product')
    const channelId = searchParams.get('channel')
    const categoryId = searchParams.get('category')
    const search = searchParams.get('search')

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Tri
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const where: any = {}

    // Par défaut, afficher seulement les codes approuvés et actifs pour les utilisateurs publics
    if (!status) {
      where.status = 'APPROVED'
      where.isActive = true
    } else if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (brand) {
      where.brand = {
        contains: brand,
        mode: 'insensitive',
      }
    }

    if (product) {
      where.product = {
        contains: product,
        mode: 'insensitive',
      }
    }

    if (channelId) {
      where.channelId = channelId
    }

    if (categoryId) {
      where.channel = {
        categoryId,
      }
    }

    if (search) {
      where.OR = [
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          brand: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          product: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              youtubeId: true,
            },
          },
          channel: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true,
            },
          },
        },
        orderBy: {
          [sort]: order,
        },
        skip,
        take: limit,
      }),
      prisma.promoCode.count({ where }),
    ])

    return NextResponse.json({
      data: promoCodes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo codes' },
      { status: 500 }
    )
  }
}
