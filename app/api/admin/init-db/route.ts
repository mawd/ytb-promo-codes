import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

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

    // Check if tables already exist using raw SQL
    const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      ) as exists
    `

    const tablesExist = tableCheck[0]?.exists

    if (!tablesExist) {
      // Tables don't exist, create them
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.sql')
      const schemaSql = fs.readFileSync(schemaPath, 'utf8')

      // Split SQL into individual statements and execute each one
      const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement) {
          await prisma.$executeRawUnsafe(statement)
        }
      }
    }

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
