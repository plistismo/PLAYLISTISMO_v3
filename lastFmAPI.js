/**
 * LAST.FM API MODULE
 * Adaptado para Frontend (ES Module)
 */

const CONFIG = {
    API_KEY: 'd1cee856747316883bdfc15adcb51342', // Nota: Recomenda-se usar sua própria chave se esta falhar por limite de uso.
    BASE_URL: 'https://ws.audioscrobbler.com/2.0/',
    FORMAT: 'json'
};

/**
 * Remove tags HTML e limpa espaços extras
 */
const cleanText = (text) => {
    if (!text) return '';
    
    // Remove links do Last.fm e tags HTML
    let cleaned = text.replace(/<a[^>]*>.*?<\/a>/ig, ""); 
    cleaned = cleaned.replace(/Read more on Last.fm.*/, "");
    
    return cleaned
        .replace(/<[^>]*>?/gm, '') 
        .replace(/\s+/g, ' ')
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
        console.log(`[LastFM] Buscando: ${artist} - ${track}`);

        const params = new URLSearchParams({
            method: 'track.getInfo',
            api_key: CONFIG.API_KEY,
            artist: artist,
            track: track,
            format: CONFIG.FORMAT,
            autocorrect: 1, // Tenta corrigir erros de digitação automaticamente
            lang: 'pt' 
        });

        const response = await fetch(`${CONFIG.BASE_URL}?${params}`);

        if (!response.ok) {
            console.warn(`[LastFM] Erro HTTP: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.error) {
            console.warn(`[LastFM] API Error: ${data.message}`);
            return null;
        }

        if (!data.track) {
            console.warn(`[LastFM] Faixa não encontrada.`);
            return null;
        }

        const song = data.track;
        const hasWiki = song.wiki && song.wiki.content;
        
        // UX DECISION: Removemos a checagem estrita (!hasWiki && !hasTags).
        // Se a música existe, mostramos o que tiver, mesmo que seja só a capa e tags.

        const bioText = hasWiki ? cleanText(song.wiki.summary || song.wiki.content) : null;
        
        // Pega a maior imagem disponível
        const image = song.album?.image?.find(img => img.size === 'extralarge')?.['#text'] 
                      || song.album?.image?.find(img => img.size === 'large')?.['#text']
                      || null;

        const result = {
            titulo: song.name,
            artista: song.artist.name,
            album: song.album ? song.album.title : "Single / Desconhecido",
            tags: song.toptags?.tag?.map(t => t.name).slice(0, 5) || [], // Aumentado para 5 tags
            capa: image,
            curiosidade: bioText && bioText.length > 5 ? bioText : "Informações biográficas indisponíveis no momento."
        };

        console.log(`[LastFM] Dados recebidos com sucesso.`);
        return result;

    } catch (error) {
        console.error('[LastFM] Falha na requisição:', error);
        return null;
    }
}