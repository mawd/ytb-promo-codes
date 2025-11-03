import { youtube } from './client'

export interface ChannelInfo {
  id: string
  title: string
  description: string
  customUrl?: string
  thumbnailUrl?: string
}

/**
 * Récupère les informations d'une chaîne YouTube
 */
export async function getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
  try {
    const response = await youtube.channels.list({
      part: ['snippet'],
      id: [channelId],
    })

    const channel = response.data.items?.[0]
    if (!channel) {
      return null
    }

    return {
      id: channel.id!,
      title: channel.snippet?.title || '',
      description: channel.snippet?.description || '',
      customUrl: channel.snippet?.customUrl,
      thumbnailUrl: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url,
    }
  } catch (error) {
    console.error('Error fetching channel info:', error)
    throw error
  }
}

export interface VideoBasicInfo {
  id: string
  title: string
  publishedAt: string
  thumbnailUrl?: string
}

/**
 * Récupère les vidéos récentes d'une chaîne
 */
export async function getRecentVideos(
  channelId: string,
  maxResults: number = 10
): Promise<VideoBasicInfo[]> {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      channelId,
      maxResults,
      order: 'date',
      type: ['video'],
    })

    const videos = response.data.items || []

    return videos
      .filter(item => item.id?.videoId && item.snippet)
      .map(item => ({
        id: item.id!.videoId!,
        title: item.snippet!.title || '',
        publishedAt: item.snippet!.publishedAt || new Date().toISOString(),
        thumbnailUrl: item.snippet!.thumbnails?.high?.url || item.snippet!.thumbnails?.default?.url,
      }))
  } catch (error) {
    console.error('Error fetching recent videos:', error)
    throw error
  }
}
