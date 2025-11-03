import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'
import { getRecentVideos, getVideosByIds } from '@/lib/youtube'
import { detectPromoCodes } from '@/lib/promo'

/**
 * POST /api/channels/[id]/scrape
 * Scraper manuellement une chaîne YouTube (admin only)
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
    // Récupérer la chaîne
    const channel = await prisma.channel.findUnique({
      where: { id: params.id },
    })

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Récupérer les vidéos récentes depuis YouTube
    const recentVideos = await getRecentVideos(channel.youtubeId, 20)

    if (recentVideos.length === 0) {
      return NextResponse.json({
        message: 'No videos found for this channel',
        videosProcessed: 0,
        codesDetected: 0,
      })
    }

    // Récupérer les détails complets (avec descriptions) pour toutes les vidéos
    const videoIds = recentVideos.map(v => v.id)
    const videosWithDetails = await getVideosByIds(videoIds)

    let videosProcessed = 0
    let totalCodesDetected = 0

    // Traiter chaque vidéo
    for (const videoDetails of videosWithDetails) {
      // Vérifier si la vidéo existe déjà en base
      let video = await prisma.video.findUnique({
        where: { youtubeId: videoDetails.id },
      })

      // Si la vidéo n'existe pas, la créer
      if (!video) {
        video = await prisma.video.create({
          data: {
            youtubeId: videoDetails.id,
            title: videoDetails.title,
            description: videoDetails.description,
            publishedAt: new Date(videoDetails.publishedAt),
            channelId: channel.id,
            thumbnailUrl: videoDetails.thumbnailUrl,
            hasBeenScraped: false,
          },
        })
      }

      // Si la vidéo a déjà été scrapée, passer à la suivante
      if (video.hasBeenScraped) {
        continue
      }

      // Détecter les codes promo dans la description
      const detectedCodes = detectPromoCodes(videoDetails.description)

      // Sauvegarder les codes détectés
      for (const detected of detectedCodes) {
        await prisma.promoCode.create({
          data: {
            code: detected.code,
            brand: detected.brand,
            product: detected.product,
            discount: detected.discount,
            description: `Confidence: ${(detected.confidence * 100).toFixed(0)}%`,
            extractedText: detected.extractedText,
            videoId: video.id,
            channelId: channel.id,
            status: 'PENDING',
            expiresAt: detected.expiresAt,
          },
        })

        totalCodesDetected++
      }

      // Marquer la vidéo comme scrapée
      await prisma.video.update({
        where: { id: video.id },
        data: { hasBeenScraped: true },
      })

      videosProcessed++
    }

    // Mettre à jour la date de dernier scraping de la chaîne
    await prisma.channel.update({
      where: { id: channel.id },
      data: { lastScrapedAt: new Date() },
    })

    return NextResponse.json({
      message: 'Scraping completed successfully',
      channelName: channel.name,
      videosProcessed,
      codesDetected: totalCodesDetected,
    })
  } catch (error) {
    console.error('Error scraping channel:', error)
    return NextResponse.json(
      { error: 'Failed to scrape channel', details: String(error) },
      { status: 500 }
    )
  }
}
