import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/admin/force-init
 * Force database initialization - ALWAYS executes SQL
 */
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    await prisma.$connect()
    console.log('Connected to database')

    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.sql')
    console.log('Schema path:', schemaPath)

    if (!fs.existsSync(schemaPath)) {
      return NextResponse.json({
        error: 'Schema file not found',
        schemaPath,
        cwd: process.cwd(),
      }, { status: 500 })
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    console.log('Schema loaded, length:', schemaSql.length)
    console.log('First 200 chars:', schemaSql.substring(0, 200))

    // Remove comment lines, then split by semicolon
    const cleanedSql = schemaSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')

    const statements = cleanedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    console.log(`Split into ${schemaSql.split(';').length} parts, filtered to ${statements.length} statements`)

    if (statements.length === 0) {
      return NextResponse.json({
        error: 'No SQL statements found',
        schemaLength: schemaSql.length,
        preview: schemaSql.substring(0, 500),
        splitCount: schemaSql.split(';').length
      }, { status: 500 })
    }

    console.log(`Executing ${statements.length} statements...`)

    const results = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        await prisma.$executeRawUnsafe(statement)
        console.log(`✓ Statement ${i}`)
        results.push({ index: i, status: 'success' })
      } catch (err: any) {
        console.error(`✗ Statement ${i}:`, err.message)
        results.push({
          index: i,
          status: 'error',
          error: err.message,
          preview: statement.substring(0, 100)
        })
      }
    }

    // Seed categories
    const categories = [
      { name: 'Tech', slug: 'tech', description: 'Chaînes technologie et informatique' },
      { name: 'Gaming', slug: 'gaming', description: 'Chaînes de jeux vidéo' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Chaînes lifestyle et quotidien' },
      { name: 'Finance', slug: 'finance', description: 'Chaînes finance et investissement' },
      { name: 'Éducation', slug: 'education', description: 'Chaînes éducatives' },
    ]

    const categoryResults = []
    for (const cat of categories) {
      try {
        const existing = await prisma.category.findUnique({ where: { slug: cat.slug } })
        if (!existing) {
          await prisma.category.create({ data: cat })
          categoryResults.push({ action: 'created', name: cat.name })
        } else {
          categoryResults.push({ action: 'exists', name: cat.name })
        }
      } catch (err: any) {
        categoryResults.push({ action: 'error', name: cat.name, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized',
      sqlStatements: results.length,
      sqlErrors: results.filter(r => r.status === 'error').length,
      categories: categoryResults,
      executionLog: results,
    })
  } catch (error: any) {
    console.error('Fatal error:', error)
    return NextResponse.json({
      error: 'Failed to initialize',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
