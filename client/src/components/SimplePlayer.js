import React, { useState, useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';

const SimplePlayer = ({ tracks = [] }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  console.log('SimplePlayer renderizado com tracks:', tracks);

  const handlePlay = () => {
    console.log('🎵 Botão PLAY clicado!');
    console.log('Audio ref:', audioRef.current);
    
    if (audioRef.current) {
      console.log('Audio src:', audioRef.current.src);
      console.log('Audio readyState:', audioRef.current.readyState);
      console.log('Audio duration:', audioRef.current.duration);
      
      audioRef.current.play()
        .then(() => {
          console.log('✅ Áudio iniciado com sucesso!');
          setIsPlaying(true);
          
          // Atualizar tempo
          intervalRef.current = setInterval(() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              console.log('Tempo atual:', audioRef.current.currentTime);
            }
          }, 1000);
        })
        .catch(error => {
          console.error('❌ Erro ao reproduzir:', error);
        });
    } else {
      console.error('❌ Audio ref não encontrado!');
    }
  };

  const handleStop = () => {
    console.log('🛑 Botão STOP clicado!');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      console.log('✅ Áudio parado');
    }
  };

  const handleLoadedMetadata = () => {
    console.log('📊 Metadados carregados!');
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      console.log('Duração:', audioRef.current.duration);
    }
  };

  const handleError = (e) => {
    console.error('❌ Erro ao carregar áudio:', e.target.error);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Nenhuma faixa disponível</Typography>
      </Box>
    );
  }

  const firstTrack = tracks[0];

  return (
    <Box sx={{ p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Player Simples - Teste
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        Faixa: {firstTrack.filename}
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        URL: {firstTrack.url}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handlePlay}
          disabled={isPlaying}
        >
          PLAY
        </Button>
        
        <Button 
          variant="contained" 
          color="secondary"
          onClick={handleStop}
          disabled={!isPlaying}
        >
          STOP
        </Button>
      </Box>
      
      <Typography variant="body2">
        Tempo: {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
      
      <Typography variant="body2" sx={{ mt: 1 }}>
        Status: {isPlaying ? 'Reproduzindo' : 'Parado'}
      </Typography>
      
      <audio
        ref={audioRef}
        src={firstTrack.url}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleError}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default SimplePlayer;