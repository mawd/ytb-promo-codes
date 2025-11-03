import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * POST /api/promo-codes/[id]/reject
 * Rejeter un code promo (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const { id } = await params
    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
      include: {
        video: true,
        channel: true,
      },
    })

    return NextResponse.json(promoCode)
  } catch (error: any) {
    console.error('Error rejecting promo code:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reject promo code' },
      { status: 500 }
    )
  }
}
