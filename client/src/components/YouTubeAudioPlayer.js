import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  Paper,
  Avatar
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as PreviousIcon,
  SkipNext as NextIcon,
  VolumeUp as VolumeIcon,
  Close as CloseIcon,
  MusicNote as MusicNoteIcon
} from '@mui/icons-material';
import { extractYouTubeVideoId } from '../utils/youtubeUtils';

const YouTubeAudioPlayer = ({ currentSong, playlist = [], onSongChange, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  // Carregar API do YouTube
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Atualizar player quando a música mudar
  useEffect(() => {
    if (isReady && currentSong && currentSong.links?.youtube) {
      const videoId = extractYouTubeVideoId(currentSong.links.youtube);
      if (videoId && playerRef.current) {
        playerRef.current.loadVideoById(videoId);
        setCurrentTime(0);
        setIsPlaying(false);
      }
    }
  }, [currentSong, isReady]);

  const initializePlayer = () => {
    if (!currentSong || !currentSong.links?.youtube) return;

    const videoId = extractYouTubeVideoId(currentSong.links.youtube);
    if (!videoId) return;

    playerRef.current = new window.YT.Player('youtube-audio-player', {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: (event) => {
          setIsReady(true);
          setDuration(event.target.getDuration());
          event.target.setVolume(volume);
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startTimeUpdate();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            stopTimeUpdate();
          } else if (event.data === window.YT.PlayerState.ENDED) {
            handleNext();
          }
        }
      }
    });
  };

  const startTimeUpdate = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);
  };

  const stopTimeUpdate = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (event, newValue) => {
    if (playerRef.current) {
      playerRef.current.seekTo(newValue);
      setCurrentTime(newValue);
    }
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (playerRef.current) {
      playerRef.current.setVolume(newValue);
    }
  };

  const handlePrevious = () => {
    if (!playlist.length || !onSongChange) return;
    
    const currentIndex = playlist.findIndex(song => song._id === currentSong._id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    onSongChange(playlist[previousIndex]);
  };

  const handleNext = () => {
    if (!playlist.length || !onSongChange) return;
    
    const currentIndex = playlist.findIndex(song => song._id === currentSong._id);
    const nextIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    onSongChange(playlist[nextIndex]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1250,
        p: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
        transition: 'all 0.3s ease-in-out',
        animation: 'slideUp 0.4s ease-out'
      }}
    >
      {/* Player invisível do YouTube */}
      <div id="youtube-audio-player" style={{ display: 'none' }}></div>
      
      <Box sx={{ position: 'relative' }}>
        {/* Botão de fechar */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 1,
            backgroundColor: 'background.paper',
            boxShadow: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'white',
              transform: 'scale(1.1) rotate(90deg)',
              boxShadow: 4
            }
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Informações da música */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '0 0 300px' }}>
          <Avatar
              src={currentSong.thumbnail}
              sx={{ width: 40, height: 40 }}
              variant="rounded"
            >
              <MusicNoteIcon />
            </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body1" noWrap>
              {currentSong.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {currentSong.artist}
            </Typography>
          </Box>
        </Box>

        {/* Controles de reprodução */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={handlePrevious} 
              disabled={!playlist.length}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  transform: 'scale(1.1)'
                },
                '&:disabled': {
                  opacity: 0.3
                }
              }}
            >
              <PreviousIcon />
            </IconButton>
            <IconButton
              onClick={handlePlayPause}
              disabled={!isReady}
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                width: 56,
                height: 56,
                transition: 'all 0.3s ease',
                animation: isPlaying ? 'pulse 2s infinite' : 'none',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                },
                '&:disabled': {
                  backgroundColor: 'action.disabled',
                  animation: 'none'
                }
              }}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayIcon sx={{ fontSize: 32 }} />}
            </IconButton>
            <IconButton 
              onClick={handleNext} 
              disabled={!playlist.length}
              sx={{
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  transform: 'scale(1.1)'
                },
                '&:disabled': {
                  opacity: 0.3
                }
              }}
            >
              <NextIcon />
            </IconButton>
          </Box>

          {/* Barra de progresso */}
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 600, gap: 1 }}>
            <Typography variant="caption" sx={{ minWidth: 40 }}>
              {formatTime(currentTime)}
            </Typography>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleSeek}
              disabled={!isReady}
              sx={{ 
                flex: 1,
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(25, 118, 210, 0.16)',
                    transform: 'scale(1.2)'
                  }
                },
                '& .MuiSlider-track': {
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                  border: 'none',
                  height: 6
                },
                '& .MuiSlider-rail': {
                  height: 6,
                  backgroundColor: 'rgba(0,0,0,0.1)'
                }
              }}
            />
            <Typography variant="caption" sx={{ minWidth: 40 }}>
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        {/* Controle de volume */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '0 0 150px' }}>
          <VolumeIcon />
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            max={100}
            sx={{ width: 100 }}
          />
        </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default YouTubeAudioPlayer;