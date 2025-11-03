import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * GET /api/promo-codes/[id]
 * Détails d'un code promo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const promoCode = await prisma.promoCode.findUnique({
      where: { id },
      include: {
        video: true,
        channel: {
          include: {
            category: true,
          },
        },
        reports: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(promoCode)
  } catch (error) {
    console.error('Error fetching promo code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promo code' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/promo-codes/[id]
 * Modifier un code promo (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { brand, product, discount, description, expiresAt, isActive } = body

    const data: any = {}

    if (brand !== undefined) data.brand = brand
    if (product !== undefined) data.product = product
    if (discount !== undefined) data.discount = discount
    if (description !== undefined) data.description = description
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (isActive !== undefined) data.isActive = isActive

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data,
      include: {
        video: true,
        channel: true,
      },
    })

    return NextResponse.json(promoCode)
  } catch (error: any) {
    console.error('Error updating promo code:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update promo code' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/promo-codes/[id]
 * Supprimer un code promo (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const { id } = await params
    await prisma.promoCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting promo code:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete promo code' },
      { status: 500 }
    )
  }
}
