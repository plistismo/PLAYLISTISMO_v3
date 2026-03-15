import { createClient } from 'supabase'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  try {
    if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Get all playlists to sync
    const { data: playlists, error: plError } = await supabase
      .from('playlists')
      .select('name, youtube_id')
      .not('youtube_id', 'is', null)

    if (plError) throw plError

    const results = []

    for (const pl of playlists) {
      console.log(`Syncing playlist: ${pl.name} (${pl.youtube_id})`)
      
      // 2. Fetch items from YouTube
      const ytUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${pl.youtube_id}&key=${YOUTUBE_API_KEY}`
      const response = await fetch(ytUrl)
      const ytData = await response.json()

      if (ytData.error) {
        console.error(`YouTube API error for ${pl.name}:`, ytData.error)
        continue
      }

      const items = ytData.items || []
      
      for (const item of items) {
        const title = item.snippet.title
        const videoId = item.snippet.resourceId.videoId
        
        // Basic title parsing: "Artist - Song"
        let artista = 'Unknown Artist'
        let musica = title
        
        if (title.includes(' - ')) {
          const parts = title.split(' - ')
          artista = parts[0].trim()
          musica = parts.slice(1).join(' - ').trim()
        }

        // Clean up title (remove common suffixes)
        musica = musica.replace(/\(Official Video\)/gi, '')
                      .replace(/\(Official Music Video\)/gi, '')
                      .replace(/\[Official Video\]/gi, '')
                      .replace(/HD/gi, '')
                      .trim()

        // 3. Upsert into musicas_backup
        // Note: Using video_id as the unique identifier
        const { error: upsertError } = await supabase
          .from('musicas_backup')
          .upsert({
            video_id: videoId,
            artista: artista,
            musica: musica,
            playlist: pl.name,
            // You can add more fields if needed
          }, { onConflict: 'video_id' })

        if (upsertError) {
          console.error(`Error upserting ${videoId}:`, upsertError)
        }
      }
      
      results.push({ playlist: pl.name, itemsFound: items.length })
    }

    return new Response(JSON.stringify({ message: 'Sync completed', detail: results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
