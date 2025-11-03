import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/channels/[id]
 * Détails d'une chaîne
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channel = await prisma.channel.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        _count: {
          select: {
            videos: true,
            promoCodes: true,
          },
        },
      },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error fetching channel:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channel' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/channels/[id]
 * Modifier une chaîne (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const body = await request.json()
    const { categoryId, isActive } = body

    const data: any = {}

    if (categoryId !== undefined) {
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

      data.categoryId = categoryId
    }

    if (isActive !== undefined) {
      data.isActive = isActive
    }

    const channel = await prisma.channel.update({
      where: { id: params.id },
      data,
      include: {
        category: true,
      },
    })

    return NextResponse.json(channel)
  } catch (error: any) {
    console.error('Error updating channel:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/channels/[id]
 * Supprimer une chaîne (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    await prisma.channel.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting channel:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    )
  }
}
