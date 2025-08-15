import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import MultitrackPlayer from '../../components/MultitrackPlayer';
import api from '../../services/api';

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [song, setSong] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log('Tentando carregar música com ID:', id);
        const response = await api.get(`/songs/${id}`);
        const songData = response.data;
        
        console.log('Dados da música carregados:', songData);
        setSong(songData);
        
        // Converter os tracks para o formato esperado pelo MultitrackPlayer
        const multitrackTracks = songData.multitrack?.tracks || [];
        console.log('Tracks encontrados:', multitrackTracks);
        console.log('Modo atual:', mode);
        
        let tracksToLoad = multitrackTracks;
        
        // No modo ensaio, carrega todas as tracks
        if (mode === 'rehearsal') {
          console.log('Modo ensaio: carregando todas as tracks');
          tracksToLoad = multitrackTracks;
        } else {
          // No modo estudo, pode filtrar tracks específicas se necessário
          console.log('Modo estudo: carregando tracks padrão');
          tracksToLoad = multitrackTracks;
        }
        
        const formattedTracks = tracksToLoad.map((track, index) => ({
          filename: track.filename || `Track ${index + 1}`,
          url: track.url || track.path,
          instrument: track.instrument || 'Instrumento',
          volume: mode === 'rehearsal' ? 0.8 : 1.0, // Volume inicial menor no ensaio
          muted: false,
          solo: false
        }));
        
        console.log('Tracks formatados:', formattedTracks);
        setTracks(formattedTracks);
      } catch (err) {
        console.error('Erro detalhado ao carregar música:', err);
        console.error('Response data:', err.response?.data);
        console.error('Status:', err.response?.status);
        
        let errorMessage = 'Erro ao carregar a música.';
        if (err.response?.status === 404) {
          errorMessage = 'Música não encontrada. Verifique se o ID está correto.';
        } else if (err.response?.status === 403) {
          errorMessage = 'Você não tem permissão para acessar esta música.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSong();
    } else {
      setError('ID da música não fornecido.');
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    navigate('/songs');
  };

  if (loading) {
    return (
      <Box sx={{ 
        bgcolor: '#1a1a1a', 
        color: 'white', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h6">Carregando...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        bgcolor: '#1a1a1a', 
        color: 'white', 
        minHeight: '100vh',
        p: 2
      }}>
        <AppBar position="static" sx={{ bgcolor: '#2d2d2d', mb: 2 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Player
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#2d2d2d' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {song?.title || 'Player'} {mode === 'rehearsal' ? '- Ensaio' : '- Estudo'}
          </Typography>
          {song?.artist && (
            <Typography variant="subtitle1" sx={{ color: '#ccc' }}>
              {song.artist}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      
      {tracks.length > 0 ? (
        <MultitrackPlayer tracks={tracks} />
      ) : (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 'calc(100vh - 64px)'
        }}>
          <Typography variant="h6" sx={{ color: '#ccc' }}>
            Nenhuma faixa encontrada para esta música
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Player;