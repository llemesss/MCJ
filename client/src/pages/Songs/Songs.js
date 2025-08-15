import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MusicNote as MusicNoteIcon,
  PlayArrow as PlayIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import YouTubeAudioPlayer from '../../components/YouTubeAudioPlayer';
import axios from 'axios';

const Songs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);

  const genres = ['gospel', 'contemporary', 'traditional', 'worship', 'praise', 'ballad', 'rock', 'pop'];
  const difficulties = ['easy', 'medium', 'hard'];

  useEffect(() => {
    fetchSongs();
  }, [currentPage, searchTerm, genreFilter, difficultyFilter]);

  const fetchSongs = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use default ministry if user doesn't have ministries
      const ministryId = user?.ministries?.[0]?.ministry?._id || 'default-ministry-id';
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(genreFilter && { genre: genreFilter }),
        ...(difficultyFilter && { difficulty: difficultyFilter })
      });

      const response = await axios.get(`/api/songs/ministry/${ministryId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSongs(response.data.songs || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError('Erro ao carregar músicas');
      console.error('Erro ao buscar músicas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, song) => {
    setAnchorEl(event.currentTarget);
    setSelectedSong(song);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSong(null);
  };

  const handleEdit = () => {
    navigate(`/songs/${selectedSong._id}/edit`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/songs/${selectedSong._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSongs(songs.filter(s => s._id !== selectedSong._id));
      handleMenuClose();
    } catch (err) {
      setError('Erro ao excluir música');
    }
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil'
    };
    return labels[difficulty] || difficulty;
  };

  const handlePlaySong = (song) => {
    if (song.links?.youtube) {
      setCurrentSong(song);
      setIsPlayerVisible(true);
    }
  };

  const handleSongChange = (newSong) => {
    setCurrentSong(newSong);
  };

  const formatDuration = (duration) => {
    if (!duration) return '--:--';
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '60vh',
            textAlign: 'center'
          }}
        >
          <Box 
            sx={{ 
              position: 'relative',
              mb: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '80px',
                border: '3px solid',
                borderColor: 'primary.light',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }
            }}
          >
            <Box
              sx={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'rotate 2s linear infinite',
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)'
              }}
            >
              <MusicNoteIcon sx={{ color: 'white', fontSize: '2rem' }} />
            </Box>
          </Box>
          
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 600
            }}
          >
            Carregando Repertório
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              animation: 'fadeIn 1s ease-in-out infinite alternate'
            }}
          >
            Preparando suas músicas...
          </Typography>
          
          {/* Loading dots animation */}
          <Box sx={{ mt: 2, display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: `slideUp 1.4s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Repertório
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/songs/new')}
        >
          Adicionar Música
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar músicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Gênero</InputLabel>
              <Select
                value={genreFilter}
                label="Gênero"
                onChange={(e) => setGenreFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {genres.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Dificuldade</InputLabel>
              <Select
                value={difficultyFilter}
                label="Dificuldade"
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {difficulties.map((difficulty) => (
                  <MenuItem key={difficulty} value={difficulty}>
                    {getDifficultyLabel(difficulty)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {songs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Nenhuma música encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm || genreFilter || difficultyFilter 
              ? 'Tente ajustar os filtros de busca.'
              : 'Adicione músicas ao seu repertório para começar.'
            }
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: isPlayerVisible ? 10 : 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 50 }}>#</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Álbum</TableCell>
                  <TableCell>Adicionada em</TableCell>
                  <TableCell sx={{ width: 80 }}>
                    <TimeIcon />
                  </TableCell>
                  <TableCell sx={{ width: 50 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {songs.map((song, index) => (
                  <TableRow
                    key={song._id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                      '&:hover': {
                         backgroundColor: 'rgba(25, 118, 210, 0.04)',
                         transform: 'translateX(4px)',
                         boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                       },
                       '&:hover .play-button': {
                         opacity: 1,
                         transform: 'scale(1)'
                       },
                      backgroundColor: currentSong?._id === song._id ? 'action.selected' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <Typography variant="body2" color="text.secondary">
                          {index + 1}
                        </Typography>
                        <IconButton
                          className="play-button"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySong(song);
                          }}
                          sx={{
                            opacity: 0,
                            transition: 'all 0.3s ease',
                            backgroundColor: 'primary.main',
                            color: 'white',
                            transform: 'scale(0.8)',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                            }
                          }}
                        >
                          <PlayIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={song.thumbnail}
                          sx={{ 
                            width: 40, 
                            height: 40,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }
                          }}
                          variant="rounded"
                        >
                          <MusicNoteIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" noWrap>
                            {song.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {song.artist}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {song.album || '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {song.createdAt ? new Date(song.createdAt).toLocaleDateString('pt-BR') : '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(song.duration)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, song);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginação */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Player de Áudio */}
      {isPlayerVisible && currentSong && (
        <YouTubeAudioPlayer
          currentSong={currentSong}
          onSongChange={handleSongChange}
          onClose={() => setIsPlayerVisible(false)}
        />
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/songs/${selectedSong?._id}`)}>
          <MusicNoteIcon sx={{ mr: 1 }} />
          Ver Detalhes
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default Songs;