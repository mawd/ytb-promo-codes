import { youtube } from './client'

export interface VideoDetails {
  id: string
  title: string
  description: string
  publishedAt: string
  channelId: string
  channelTitle: string
  thumbnailUrl?: string
}

/**
 * Récupère les détails complets d'une vidéo (incluant la description complète)
 */
export async function getVideoDetails(videoId: string): Promise<VideoDetails | null> {
  try {
    const response = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    })

    const video = response.data.items?.[0]
    if (!video || !video.snippet) {
      return null
    }

    return {
      id: video.id!,
      title: video.snippet.title || '',
      description: video.snippet.description || '',
      publishedAt: video.snippet.publishedAt || new Date().toISOString(),
      channelId: video.snippet.channelId || '',
      channelTitle: video.snippet.channelTitle || '',
      thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || undefined,
    }
  } catch (error) {
    console.error(`Error fetching video details for ${videoId}:`, error)
    throw error
  }
}

/**
 * Récupère les détails de plusieurs vidéos en une seule requête (batch)
 */
export async function getVideosByIds(videoIds: string[]): Promise<VideoDetails[]> {
  try {
    // L'API YouTube limite à 50 vidéos par requête
    const chunkedIds = chunkArray(videoIds, 50)
    const allVideos: VideoDetails[] = []

    for (const chunk of chunkedIds) {
      const response = await youtube.videos.list({
        part: ['snippet'],
        id: chunk,
      })

      const videos = response.data.items || []

      const mappedVideos = videos
        .filter(video => video.snippet)
        .map(video => ({
          id: video.id!,
          title: video.snippet!.title || '',
          description: video.snippet!.description || '',
          publishedAt: video.snippet!.publishedAt || new Date().toISOString(),
          channelId: video.snippet!.channelId || '',
          channelTitle: video.snippet!.channelTitle || '',
          thumbnailUrl: video.snippet!.thumbnails?.high?.url || video.snippet!.thumbnails?.default?.url || undefined,
        }))

      allVideos.push(...mappedVideos)
    }

    return allVideos
  } catch (error) {
    console.error('Error fetching videos by IDs:', error)
    throw error
  }
}

/**
 * Utilitaire pour diviser un tableau en chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
