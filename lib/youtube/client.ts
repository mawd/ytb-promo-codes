import { google, youtube_v3 } from 'googleapis'

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
})

export type YouTubeClient = youtube_v3.Youtube

export { youtube }
