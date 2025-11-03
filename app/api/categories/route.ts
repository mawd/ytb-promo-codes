import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/categories
 * Liste toutes les catégories
 */
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            channels: true,
          },
        },
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 * Créer une nouvelle catégorie (admin only)
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const body = await request.json()
    const { name, slug, description } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error creating category:', error)

    // Gérer l'erreur de doublon (unique constraint)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
