import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

/**
 * POST /api/promo-codes/[id]/approve
 * Approuver un code promo (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(request)
  if (authError) {
    return authError
  }

  try {
    const promoCode = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      include: {
        video: true,
        channel: true,
      },
    })

    return NextResponse.json(promoCode)
  } catch (error: any) {
    console.error('Error approving promo code:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to approve promo code' },
      { status: 500 }
    )
  }
}
