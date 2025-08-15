import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Typography,
  Slider,
  Stack,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  OpenInNew
} from '@mui/icons-material';
import { getYouTubeEmbedUrl, extractYouTubeVideoId } from '../../utils/youtubeUtils';

const YouTubePlayer = ({ 
  youtubeUrl, 
  title = 'Vídeo do YouTube',
  autoplay = false,
  controls = true,
  height = 315,
  width = '100%',
  onReady,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const iframeRef = useRef(null);
  
  const videoId = extractYouTubeVideoId(youtubeUrl);
  
  useEffect(() => {
    if (!videoId) {
      setHasError(true);
      setIsLoading(false);
      onError?.('URL do YouTube inválida');
    } else {
      setHasError(false);
    }
  }, [videoId, onError]);
  
  const embedUrl = videoId ? getYouTubeEmbedUrl(videoId, {
    autoplay: autoplay ? 1 : 0,
    controls: controls ? 1 : 0,
    rel: 0,
    modestbranding: 1
  }) : null;
  
  const handleIframeLoad = () => {
    setIsLoading(false);
    onReady?.();
  };
  
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.('Erro ao carregar o vídeo');
  };
  
  const openInYouTube = () => {
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    }
  };
  
  const toggleFullscreen = () => {
    if (iframeRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframeRef.current.requestFullscreen();
      }
    }
  };
  
  if (hasError || !videoId) {
    return (
      <Card sx={{ width: '100%', maxWidth: width }}>
        <CardContent>
          <Alert severity="error">
            {!videoId ? 'URL do YouTube inválida' : 'Erro ao carregar o vídeo'}
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ width: '100%', maxWidth: width, position: 'relative' }}>
      <Box sx={{ position: 'relative' }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 1
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}
        
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          width="100%"
          height={height}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            display: 'block',
            borderRadius: '4px 4px 0 0'
          }}
        />
      </Box>
      
      <CardContent sx={{ pt: 1, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {title}
          </Typography>
          
          <Tooltip title="Abrir no YouTube">
            <IconButton size="small" onClick={openInYouTube}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Tela cheia">
            <IconButton size="small" onClick={toggleFullscreen}>
              <Fullscreen fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Componente simplificado para thumbnail clicável
export const YouTubeThumbnail = ({ 
  youtubeUrl, 
  title,
  thumbnail,
  onClick,
  width = 200,
  height = 150
}) => {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  const thumbnailUrl = thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
  
  if (!videoId || !thumbnailUrl) {
    return (
      <Box
        sx={{
          width,
          height,
          backgroundColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Sem thumbnail
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          '& .play-overlay': {
            opacity: 1
          }
        }
      }}
      onClick={onClick}
    >
      <img
        src={thumbnailUrl}
        alt={title || 'Thumbnail do YouTube'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      <Box
        className="play-overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.2s ease'
        }}
      >
        <IconButton
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 1)'
            }
          }}
        >
          <PlayArrow sx={{ fontSize: 40, color: 'red' }} />
        </IconButton>
      </Box>
      
      {title && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            p: 1
          }}
        >
          <Typography variant="caption" noWrap>
            {title}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default YouTubePlayer;