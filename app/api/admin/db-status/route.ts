import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/db-status
 * Check database tables status (admin only)
 */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    // Check all tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    // Check if categories table exists specifically
    const categoriesExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      ) as exists
    `

    return NextResponse.json({
      success: true,
      tablesInPublicSchema: tables,
      categoriesTableExists: categoriesExists[0]?.exists,
      totalTables: tables.length,
    })
  } catch (error) {
    console.error('Error checking database status:', error)
    return NextResponse.json(
      {
        error: 'Failed to check database status',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
