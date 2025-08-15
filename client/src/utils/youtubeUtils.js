/**
 * Utilitários para trabalhar com links do YouTube
 */

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 * @param {string} url - URL do YouTube
 * @returns {string|null} - ID do vídeo ou null se inválido
 */
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Gera URL da thumbnail do YouTube
 * @param {string} videoId - ID do vídeo do YouTube
 * @param {string} quality - Qualidade da thumbnail (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns {string|null} - URL da thumbnail ou null se inválido
 */
export const getYouTubeThumbnail = (videoId, quality = 'hqdefault') => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Gera URL embed do YouTube
 * @param {string} videoId - ID do vídeo do YouTube
 * @param {object} options - Opções do player
 * @returns {string|null} - URL embed ou null se inválido
 */
export const getYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return null;
  
  const {
    autoplay = 0,
    controls = 1,
    start = 0,
    end = null,
    loop = 0,
    mute = 0,
    rel = 0,
    modestbranding = 1
  } = options;
  
  let url = `https://www.youtube.com/embed/${videoId}?`;
  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    controls: controls.toString(),
    rel: rel.toString(),
    modestbranding: modestbranding.toString(),
    loop: loop.toString(),
    mute: mute.toString()
  });
  
  if (start > 0) {
    params.append('start', start.toString());
  }
  
  if (end) {
    params.append('end', end.toString());
  }
  
  return url + params.toString();
};

/**
 * Valida se uma URL é do YouTube
 * @param {string} url - URL para validar
 * @returns {boolean} - true se for uma URL válida do YouTube
 */
export const isValidYouTubeUrl = (url) => {
  if (!url) return false;
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

/**
 * Processa URL do YouTube e retorna informações estruturadas
 * @param {string} url - URL do YouTube
 * @returns {object|null} - Objeto com videoId, thumbnail e embedUrl ou null se inválido
 */
export const processYouTubeUrl = (url) => {
  if (!isValidYouTubeUrl(url)) return null;
  
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  return {
    videoId,
    thumbnail: getYouTubeThumbnail(videoId),
    thumbnailHD: getYouTubeThumbnail(videoId, 'maxresdefault'),
    embedUrl: getYouTubeEmbedUrl(videoId),
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
};

/**
 * Obtém informações do vídeo via YouTube Data API (se disponível)
 * @param {string} videoId - ID do vídeo
 * @param {string} apiKey - Chave da API do YouTube
 * @returns {Promise<object|null>} - Informações do vídeo ou null se erro
 */
export const getYouTubeVideoInfo = async (videoId, apiKey) => {
  if (!videoId || !apiKey) return null;
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;
    
    const video = data.items[0];
    return {
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      duration: video.contentDetails.duration,
      publishedAt: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle
    };
  } catch (error) {
    console.error('Erro ao buscar informações do vídeo:', error);
    return null;
  }
};