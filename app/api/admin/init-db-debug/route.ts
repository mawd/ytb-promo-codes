import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/init-db-debug
 * Debug endpoint to see what EXISTS query returns
 */
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    // Check if tables already exist using raw SQL
    const tableCheck = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'categories'
      ) as exists
    `

    const rawExists = tableCheck[0]?.exists
    const boolExists = Boolean(rawExists)

    return NextResponse.json({
      success: true,
      debug: {
        tableCheckRaw: tableCheck,
        rawExists,
        rawExistsType: typeof rawExists,
        rawExistsValue: String(rawExists),
        boolExists,
        strictEqualsFalse: rawExists === false,
        strictEqualsTrue: rawExists === true,
        looseEqualsFalse: rawExists == false,
        looseEqualsTrue: rawExists == true,
        notRawExists: !rawExists,
      },
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      {
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
