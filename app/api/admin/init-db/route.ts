import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/init-db
 * Initialize database schema and seed initial data (admin only)
 * This is a one-time setup endpoint
 */
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    // Test database connection
    await prisma.$connect()

    // Seed initial categories
    const categories = [
      { name: 'Tech', slug: 'tech', description: 'Chaînes technologie et informatique' },
      { name: 'Gaming', slug: 'gaming', description: 'Chaînes de jeux vidéo' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Chaînes lifestyle et quotidien' },
      { name: 'Finance', slug: 'finance', description: 'Chaînes finance et investissement' },
      { name: 'Éducation', slug: 'education', description: 'Chaînes éducatives' },
    ]

    const results = []

    for (const category of categories) {
      const existing = await prisma.category.findUnique({
        where: { slug: category.slug },
      })

      if (!existing) {
        const created = await prisma.category.create({
          data: category,
        })
        results.push({ action: 'created', category: created.name })
      } else {
        results.push({ action: 'exists', category: existing.name })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      results,
    })
  } catch (error) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
