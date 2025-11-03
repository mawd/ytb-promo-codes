import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminToken } from '@/lib/auth/admin'
import { getRecentVideos, getVideosByIds } from '@/lib/youtube'
import { detectPromoCodes } from '@/lib/promo'

/**
 * POST /api/scraper/run
 * Lance le scraping de toutes les chaînes actives
 * Utilisé par le cron job Render
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (Bearer token ou header Authorization)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '').trim()

    if (!isAdminToken(token || null)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer toutes les chaînes actives
    const activeChannels = await prisma.channel.findMany({
      where: { isActive: true },
      include: {
        category: true,
      },
    })

    if (activeChannels.length === 0) {
      return NextResponse.json({
        message: 'No active channels to scrape',
        channelsProcessed: 0,
        videosProcessed: 0,
        codesDetected: 0,
      })
    }

    const results = {
      channelsProcessed: 0,
      channelsSucceeded: 0,
      channelsFailed: 0,
      videosProcessed: 0,
      codesDetected: 0,
      errors: [] as string[],
    }

    // Traiter chaque chaîne
    for (const channel of activeChannels) {
      try {
        console.log(`[Scraper] Processing channel: ${channel.name}`)

        // Récupérer les vidéos récentes
        const recentVideos = await getRecentVideos(channel.youtubeId, 10)

        if (recentVideos.length === 0) {
          console.log(`[Scraper] No videos found for ${channel.name}`)
          continue
        }

        // Récupérer les détails complets
        const videoIds = recentVideos.map(v => v.id)
        const videosWithDetails = await getVideosByIds(videoIds)

        // Traiter chaque vidéo
        for (const videoDetails of videosWithDetails) {
          // Vérifier si la vidéo existe déjà
          let video = await prisma.video.findUnique({
            where: { youtubeId: videoDetails.id },
          })

          // Créer la vidéo si elle n'existe pas
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

          // Si déjà scrapée, passer à la suivante
          if (video.hasBeenScraped) {
            continue
          }

          // Détecter les codes promo
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

            results.codesDetected++
          }

          // Marquer comme scrapée
          await prisma.video.update({
            where: { id: video.id },
            data: { hasBeenScraped: true },
          })

          results.videosProcessed++
        }

        // Mettre à jour la date de dernier scraping
        await prisma.channel.update({
          where: { id: channel.id },
          data: { lastScrapedAt: new Date() },
        })

        results.channelsSucceeded++

        // Petit délai pour ne pas surcharger l'API YouTube
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`[Scraper] Error processing channel ${channel.name}:`, error)
        results.channelsFailed++
        results.errors.push(`${channel.name}: ${String(error)}`)
      }

      results.channelsProcessed++
    }

    console.log('[Scraper] Scraping completed:', results)

    return NextResponse.json({
      message: 'Scraping completed',
      ...results,
    })
  } catch (error) {
    console.error('[Scraper] Fatal error:', error)
    return NextResponse.json(
      { error: 'Scraping failed', details: String(error) },
      { status: 500 }
    )
  }
}
