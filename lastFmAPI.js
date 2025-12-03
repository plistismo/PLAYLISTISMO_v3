
/**
 * LAST.FM API MODULE
 * Adaptado para Frontend (ES Module)
 */

const CONFIG = {
    API_KEY: 'd1cee856747316883bdfc15adcb51342',
    BASE_URL: 'https://ws.audioscrobbler.com/2.0/', // HTTPS obrigatório para GitHub Pages
    FORMAT: 'json'
};

/**
 * Remove tags HTML e limpa espaços extras
 */
const cleanText = (text) => {
    if (!text) return '';
    // Remove links do Last.fm que costumam vir no texto "Read more on Last.fm"
    let cleaned = text.replace(/<a[^>]*>.*?<\/a>/ig, ""); 
    cleaned = cleaned.replace(/Read more on Last.fm.*/, "");
    
    return cleaned
        .replace(/<[^>]*>?/gm, '') // Remove tags HTML restantes
        .replace(/\s+/g, ' ')      // Remove quebras múltiplas
        .trim();
};

/**
 * Busca detalhes da música na Last.fm
 * @param {string} artist - Nome do Artista
 * @param {string} track - Nome da Música
 */
export async function fetchTrackDetails(artist, track) {
    if (!artist || !track) return null;

    try {
        const params = new URLSearchParams({
            method: 'track.getInfo',
            api_key: CONFIG.API_KEY,
            artist: artist,
            track: track,
            format: CONFIG.FORMAT,
            autocorrect: 1,
            lang: 'pt' 
        });

        const response = await fetch(`${CONFIG.BASE_URL}?${params}`);

        if (!response.ok) return null;

        const data = await response.json();

        if (data.error || !data.track) {
            return null;
        }

        const song = data.track;
        const hasWiki = song.wiki && song.wiki.content;
        const hasTags = song.toptags && song.toptags.tag && song.toptags.tag.length > 0;

        // Se não tiver wiki nem tags, consideramos "sem dados relevantes" para mostrar na TV
        if (!hasWiki && !hasTags) return null;

        const bioText = hasWiki ? cleanText(song.wiki.summary || song.wiki.content) : null;

        // Retorna DTO simplificado
        return {
            titulo: song.name,
            artista: song.artist.name,
            album: song.album ? song.album.title : null,
            tags: song.toptags?.tag?.map(t => t.name).slice(0, 3) || [],
            capa: song.album?.image?.find(img => img.size === 'extralarge')?.['#text'] || null,
            curiosidade: bioText && bioText.length > 10 ? bioText : null
        };

    } catch (error) {
        console.warn('Last.fm API Error:', error);
        return null;
    }
}
