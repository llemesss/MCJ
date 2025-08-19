import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Divider,
  Alert,
  Skeleton,
  Link,
  Rating
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  YouTube as YouTubeIcon,
  MusicNote as SpotifyIcon,
  Link as LinkIcon,
  Star as StarIcon,
  School as StudyIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import YouTubePlayer from '../../components/Player/YouTubePlayer';
import { useAuth } from '../../contexts/AuthContext';
import MultitrackPlayer from '../../components/MultitrackPlayer';
import api from '../../services/api';

const SongDetail = () => {  const { id } = useParams();  const navigate = useNavigate();  const { user } = useAuth();  const [song, setSong] = useState(null);  const [loading, setLoading] = useState(true);  const [error, setError] = useState('');  const [isYouTubeLoading, setIsYouTubeLoading] = useState(false);  const [isYouTubePlaying, setIsYouTubePlaying] = useState(false);

  useEffect(() => {
    fetchSong();
  }, [id]);

  const fetchSong = async () => {
    try {
      const response = await api.get(`/songs/${id}`);
      setSong(response.data);
    } catch (err) {
      setError('Erro ao carregar música: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePlayCount = async () => {
    try {
      await api.post(`/songs/${id}/play`, {});
      // Atualizar contagem local
      setSong(prev => ({
        ...prev,
        usage: {
          ...prev.usage,
          timesPlayed: (prev.usage?.timesPlayed || 0) + 1,
          lastPlayed: new Date()
        }
      }));
    } catch (err) {
      console.error('Erro ao registrar reprodução:', err);
    }
  };

  const handleYouTubePlay = () => {
    if (!song.links?.youtube) {
      alert('URL do YouTube não disponível para esta música');
      return;
    }
    if (isYouTubePlaying) {
      // Parar o vídeo
      setIsYouTubePlaying(false);
      setIsYouTubeLoading(false);
    } else {
      // Iniciar o vídeo
      setIsYouTubeLoading(true);
      // Simular carregamento
      setTimeout(() => {
        setIsYouTubeLoading(false);
        setIsYouTubePlaying(true);
        // Abrir o YouTube em nova aba
        window.open(song.links.youtube, '_blank');
      }, 1000);
    }
  };

  const handleStudyRedirect = () => {
    navigate(`/player/${id}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'facil': return 'success';
      case 'medio': return 'warning';
      case 'dificil': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Médio';
      case 'dificil': return 'Difícil';
      default: return difficulty;
    }
  };

  const getGenreLabel = (genre) => {
    const genreMap = {
      'adoracao': 'Adoração',
      'louvor': 'Louvor',
      'contemporaneo': 'Contemporâneo',
      'tradicional': 'Tradicional',
      'gospel': 'Gospel',
      'rock': 'Rock',
      'pop': 'Pop',
      'balada': 'Balada',
      'outros': 'Outros'
    };
    return genreMap[genre] || genre;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!song) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          Música não encontrada
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/songs')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4">
            {song.title}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/songs/${id}/edit`)}
        >
          Editar
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Informações Principais */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {song.title}
                </Typography>
                {song.artist && (
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {song.artist}
                  </Typography>
                )}
                {song.album && (
                  <Typography variant="body1" color="text.secondary">
                    Álbum: {song.album}
                  </Typography>
                )}
              </Box>
              <IconButton 
                color={isYouTubePlaying ? "error" : "primary"}
                size="large"
                onClick={handleYouTubePlay}
                disabled={isYouTubeLoading}
              >
                {isYouTubeLoading ? (
                  <YouTubeIcon fontSize="large" sx={{ opacity: 0.5 }} />
                ) : isYouTubePlaying ? (
                  <StopIcon fontSize="large" />
                ) : (
                  <PlayIcon fontSize="large" />
                )}
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {song.genre && (
                <Chip label={getGenreLabel(song.genre)} color="primary" variant="outlined" />
              )}
              {song.difficulty && (
                <Chip 
                  label={getDifficultyLabel(song.difficulty)} 
                  color={getDifficultyColor(song.difficulty)} 
                  variant="outlined" 
                />
              )}
              {song.originalKey && (
                <Chip label={`Tom: ${song.originalKey}`} variant="outlined" />
              )}
              {song.bpm && (
                <Chip label={`${song.bpm} BPM`} variant="outlined" />
              )}
            </Box>

            {song.tags && song.tags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                  {song.tags.map((tag, index) => (
                    <Chip key={index} label={tag} size="small" />
                  ))}
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<StudyIcon />}
                    onClick={handleStudyRedirect}
                    sx={{ ml: 1 }}
                  >
                    Estudar
                  </Button>

                </Box>
              </Box>
            )}

            {song.lyrics && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Letra
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography 
                    variant="body1" 
                    component="pre" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.6
                    }}
                  >
                    {song.lyrics}
                  </Typography>
                </Paper>
              </>
            )}

            {song.notes && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Notas
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {song.notes}
                  </Typography>
                </Paper>
              </>
            )}
          </Paper>

          {/* Player de Multitrack */}
          {song.multitrack && song.multitrack.tracks && song.multitrack.tracks.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Player Multipista
              </Typography>
              <MultitrackPlayer 
                tracks={song.multitrack.tracks.map(track => ({
                  ...track,
                  url: `/uploads/${track.filePath}`,
                  filename: track.fileName || track.name
                }))}
                title={`${song.title} - Multitrack`}
              />
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Links */}
          {song.links && Object.values(song.links).some(link => link) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Links
                </Typography>
                {song.links.youtube && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <YouTubeIcon sx={{ mr: 1, color: 'red' }} />
                      YouTube
                    </Typography>
                    <YouTubePlayer 
                      youtubeUrl={song.links.youtube}
                      title={song.title}
                      height={200}
                    />
                  </Box>
                )}
                {song.links.spotify && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SpotifyIcon sx={{ mr: 1, color: 'green' }} />
                    <Link href={song.links.spotify} target="_blank" rel="noopener">
                      Spotify
                    </Link>
                  </Box>
                )}
                {song.links.cifraClub && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LinkIcon sx={{ mr: 1 }} />
                    <Link href={song.links.cifraClub} target="_blank" rel="noopener">
                      Cifra Club
                    </Link>
                  </Box>
                )}
                {song.links.audio && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LinkIcon sx={{ mr: 1 }} />
                    <Link href={song.links.audio} target="_blank" rel="noopener">
                      Áudio
                    </Link>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Reproduções:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {song.usage?.timesPlayed || 0}
                </Typography>
              </Box>
              {song.usage?.lastPlayed && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Última reprodução:</Typography>
                  <Typography variant="body2">
                    {formatDate(song.usage.lastPlayed)}
                  </Typography>
                </Box>
              )}
              {song.usage?.averageRating > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Avaliação:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={song.usage.averageRating} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({song.usage.averageRating.toFixed(1)})
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Informações Técnicas */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Criado por:</Typography>
                <Typography variant="body2">
                  {song.createdBy?.name || 'Desconhecido'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Data de criação:</Typography>
                <Typography variant="body2">
                  {formatDate(song.createdAt)}
                </Typography>
              </Box>
              {song.updatedAt !== song.createdAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Última atualização:</Typography>
                  <Typography variant="body2">
                    {formatDate(song.updatedAt)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SongDetail;