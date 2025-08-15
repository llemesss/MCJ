/**
 * Utilitários para processar URLs do YouTube no backend
 */

/**
 * Extrai o ID do vídeo de uma URL do YouTube
 * @param {string} url - URL do YouTube
 * @returns {string|null} - ID do vídeo ou null se inválido
 */
function extractYouTubeVideoId(url) {
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
}

/**
 * Gera URL da thumbnail do YouTube
 * @param {string} videoId - ID do vídeo do YouTube
 * @param {string} quality - Qualidade da thumbnail
 * @returns {string|null} - URL da thumbnail ou null se inválido
 */
function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Valida se uma URL é do YouTube
 * @param {string} url - URL para validar
 * @returns {boolean} - true se for uma URL válida do YouTube
 */
function isValidYouTubeUrl(url) {
  if (!url) return false;
  
  const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

/**
 * Processa URL do YouTube e retorna informações estruturadas
 * @param {string} url - URL do YouTube
 * @returns {object|null} - Objeto com videoId e thumbnail ou null se inválido
 */
function processYouTubeUrl(url) {
  if (!isValidYouTubeUrl(url)) return null;
  
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  
  return {
    videoId,
    thumbnail: getYouTubeThumbnail(videoId),
    thumbnailHD: getYouTubeThumbnail(videoId, 'maxresdefault')
  };
}

/**
 * Verifica se uma thumbnail existe fazendo uma requisição HEAD
 * @param {string} thumbnailUrl - URL da thumbnail
 * @returns {Promise<boolean>} - true se a thumbnail existe
 */
async function thumbnailExists(thumbnailUrl) {
  if (!thumbnailUrl) return false;
  
  try {
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    return new Promise((resolve) => {
      const parsedUrl = url.parse(thumbnailUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'HEAD'
      }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    return false;
  }
}

/**
 * Processa URL do YouTube com validação de thumbnail
 * @param {string} url - URL do YouTube
 * @returns {Promise<object|null>} - Objeto com videoId e thumbnail válida
 */
async function processYouTubeUrlWithValidation(url) {
  const basicInfo = processYouTubeUrl(url);
  if (!basicInfo) return null;
  
  // Tenta primeiro a thumbnail HD, depois a padrão
  const hdExists = await thumbnailExists(basicInfo.thumbnailHD);
  if (hdExists) {
    return {
      videoId: basicInfo.videoId,
      thumbnail: basicInfo.thumbnailHD
    };
  }
  
  const standardExists = await thumbnailExists(basicInfo.thumbnail);
  if (standardExists) {
    return {
      videoId: basicInfo.videoId,
      thumbnail: basicInfo.thumbnail
    };
  }
  
  // Retorna sem thumbnail se nenhuma for válida
  return {
    videoId: basicInfo.videoId,
    thumbnail: null
  };
}

module.exports = {
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  isValidYouTubeUrl,
  processYouTubeUrl,
  thumbnailExists,
  processYouTubeUrlWithValidation
};