import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/promo-codes/[id]/report
 * Signaler un code promo comme expiré ou invalide (public)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { reason, comment } = body

    if (!reason || !['EXPIRED', 'INVALID', 'OTHER'].includes(reason)) {
      return NextResponse.json(
        { error: 'Valid reason is required (EXPIRED, INVALID, or OTHER)' },
        { status: 400 }
      )
    }

    // Vérifier que le code existe
    const promoCode = await prisma.promoCode.findUnique({
      where: { id: params.id },
    })

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code not found' },
        { status: 404 }
      )
    }

    // Récupérer l'IP de l'utilisateur (optionnel, pour éviter le spam)
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Créer le signalement
    await prisma.userReport.create({
      data: {
        promoCodeId: params.id,
        reason,
        comment: comment || null,
        ipAddress,
      },
    })

    // Compter le nombre total de signalements pour ce code
    const reportCount = await prisma.userReport.count({
      where: { promoCodeId: params.id },
    })

    // Si >= 3 signalements, marquer le code comme inactif automatiquement
    if (reportCount >= 3) {
      await prisma.promoCode.update({
        where: { id: params.id },
        data: {
          isActive: false,
          status: reason === 'EXPIRED' ? 'EXPIRED' : promoCode.status,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportCount,
    })
  } catch (error) {
    console.error('Error reporting promo code:', error)
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    )
  }
}
