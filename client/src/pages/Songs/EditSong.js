import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  MusicNote as MusicIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MultitrackPlayer from '../../components/MultitrackPlayer';
import { processYouTubeUrl } from '../../utils/youtubeUtils';
import axios from 'axios';

const EditSong = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingSong, setLoadingSong] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [multitrackFile, setMultitrackFile] = useState(null);
  const [extractedTracks, setExtractedTracks] = useState([]);
  const [processingMultitrack, setProcessingMultitrack] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    lyrics: '',
    originalKey: '',
    bpm: '',
    duration: '',
    genre: 'louvor',
    difficulty: 'medio',
    links: {
      youtube: '',
      spotify: '',
      cifraClub: '',
      audio: '',
      sheet: ''
    },
    tags: [],
    instruments: [],
    notes: '',
    thumbnail: '',
    youtubeVideoId: ''
  });

  const [currentTag, setCurrentTag] = useState('');

  const genres = [
    { value: 'adoracao', label: 'Adoração' },
    { value: 'louvor', label: 'Louvor' },
    { value: 'contemporaneo', label: 'Contemporâneo' },
    { value: 'tradicional', label: 'Tradicional' },
    { value: 'gospel', label: 'Gospel' },
    { value: 'rock', label: 'Rock' },
    { value: 'pop', label: 'Pop' },
    { value: 'balada', label: 'Balada' },
    { value: 'outros', label: 'Outros' }
  ];

  const difficulties = [
    { value: 'facil', label: 'Fácil' },
    { value: 'medio', label: 'Médio' },
    { value: 'dificil', label: 'Difícil' }
  ];

  // Carregar dados da música
  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoadingSong(true);
        const response = await axios.get(`/api/songs/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const song = response.data;
        setFormData({
          title: song.title || '',
          artist: song.artist || '',
          album: song.album || '',
          lyrics: song.lyrics || '',
          originalKey: song.originalKey || '',
          bpm: song.bpm || '',
          duration: song.duration || '',
          genre: song.genre || 'louvor',
          difficulty: song.difficulty || 'medio',
          links: {
            youtube: song.links?.youtube || '',
            spotify: song.links?.spotify || '',
            cifraClub: song.links?.cifraClub || '',
            audio: song.links?.audio || '',
            sheet: song.links?.sheet || ''
          },
          tags: song.tags || [],
          instruments: song.instruments || [],
          notes: song.notes || ''
        });
        
        // Se há multitrack, carregar as faixas
        if (song.multitrack && song.multitrack.tracks) {
          // Garantir que as faixas tenham filePath definido
          const tracksWithFilePath = song.multitrack.tracks.map(track => ({
            ...track,
            filePath: track.filePath || track.path || '',
            path: track.path || track.filePath || ''
          }));
          setExtractedTracks(tracksWithFilePath);
        }
        
      } catch (error) {
        console.error('Erro ao carregar música:', error);
        setError('Erro ao carregar dados da música');
      } finally {
        setLoadingSong(false);
      }
    };

    fetchSong();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
      
      // Processar URL do YouTube automaticamente
      if (name === 'links.youtube') {
        const youtubeInfo = processYouTubeUrl(value);
        if (youtubeInfo) {
          setFormData(prev => ({
            ...prev,
            thumbnail: youtubeInfo.thumbnail,
            youtubeVideoId: youtubeInfo.videoId,
            [parent]: {
              ...prev[parent],
              [child]: value
            }
          }));
        } else if (value === '') {
          // Limpar campos do YouTube se o link for removido
          setFormData(prev => ({
            ...prev,
            thumbnail: '',
            youtubeVideoId: '',
            [parent]: {
              ...prev[parent],
              [child]: value
            }
          }));
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleMultitrackUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Por favor, selecione um arquivo .zip');
      return;
    }

    setMultitrackFile(file);
    setProcessingMultitrack(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('multitrack', file);

      const response = await axios.post('/api/songs/process-multitrack', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // Converter formato dos tracks para o player
      const tracksForPlayer = response.data.tracks.map(track => ({
        ...track,
        filename: track.fileName,
        url: `/uploads/${track.filePath}`
      }));
      setExtractedTracks(tracksForPlayer);
      setSuccess('Multitrack processado com sucesso!');
    } catch (error) {
      console.error('Erro ao processar multitrack:', error);
      setError('Erro ao processar arquivo multitrack');
      setMultitrackFile(null);
    } finally {
      setProcessingMultitrack(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        multitrack: extractedTracks.length > 0 ? {
          tracks: extractedTracks.map(track => ({
            name: track.name,
            filePath: track.filePath,
            fileName: track.fileName,
            instrument: track.instrument,
            volume: track.volume || 1.0,
            mute: track.mute || false,
            solo: track.solo || false
          })),
          originalFile: multitrackFile?.name
        } : undefined
      };



      await axios.put(`/api/songs/${id}`, submitData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess('Música atualizada com sucesso!');
      setTimeout(() => {
        navigate('/songs');
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar música:', error);
      setError(error.response?.data?.message || 'Erro ao atualizar música');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSong) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Editar Música
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={() => navigate('/songs')}
        >
          Cancelar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Informações Básicas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Título *"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Artista"
                    name="artist"
                    value={formData.artist}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Álbum"
                    name="album"
                    value={formData.album}
                    onChange={handleInputChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tom Original"
                    name="originalKey"
                    value={formData.originalKey}
                    onChange={handleInputChange}
                    placeholder="Ex: C, G, Am"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="BPM"
                    name="bpm"
                    type="number"
                    value={formData.bpm}
                    onChange={handleInputChange}
                    inputProps={{ min: 1, max: 300 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Gênero</InputLabel>
                    <Select
                      name="genre"
                      value={formData.genre}
                      label="Gênero"
                      onChange={handleInputChange}
                    >
                      {genres.map((genre) => (
                        <MenuItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Dificuldade</InputLabel>
                    <Select
                      name="difficulty"
                      value={formData.difficulty}
                      label="Dificuldade"
                      onChange={handleInputChange}
                    >
                      {difficulties.map((difficulty) => (
                        <MenuItem key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Letra da Música */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Letra da Música
              </Typography>
              <TextField
                fullWidth
                label="Letra"
                name="lyrics"
                value={formData.lyrics}
                onChange={handleInputChange}
                multiline
                rows={8}
                placeholder="Digite a letra da música aqui..."
              />
            </Paper>
          </Grid>

          {/* Links */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Links
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Link do YouTube"
                    name="links.youtube"
                    value={formData.links.youtube}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {formData.thumbnail && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Prévia da Thumbnail:
                      </Typography>
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail do YouTube"
                        style={{
                          width: '100%',
                          maxWidth: '200px',
                          height: 'auto',
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Link do Spotify"
                    name="links.spotify"
                    value={formData.links.spotify}
                    onChange={handleInputChange}
                    placeholder="https://open.spotify.com/track/..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cifra Club"
                    name="links.cifraClub"
                    value={formData.links.cifraClub}
                    onChange={handleInputChange}
                    placeholder="https://cifraclub.com.br/..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Link de Áudio"
                    name="links.audio"
                    value={formData.links.audio}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Multitrack Upload */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Multitrack (Arquivo .zip)
              </Typography>
              
              {extractedTracks.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Faixas Atuais:
                  </Typography>
                  <List>
                    {extractedTracks.map((track, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={track.name}
                          secondary={`Instrumento: ${track.instrument}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Para substituir o multitrack, faça upload de um novo arquivo .zip:
                  </Typography>
                </Box>
              )}
              
              {!multitrackFile ? (
                <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #ccc', borderRadius: 2 }}>
                  <input
                    accept=".zip"
                    style={{ display: 'none' }}
                    id="multitrack-upload"
                    type="file"
                    onChange={handleMultitrackUpload}
                    disabled={processingMultitrack}
                  />
                  <label htmlFor="multitrack-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      disabled={processingMultitrack}
                    >
                      {extractedTracks.length > 0 ? 'Substituir Multitrack' : 'Fazer Upload do Multitrack'}
                    </Button>
                  </label>
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    Selecione um arquivo .zip contendo as faixas individuais
                  </Typography>
                </Box>
              ) : (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle1">
                            {multitrackFile.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(multitrackFile.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        onClick={() => {
                          setMultitrackFile(null);
                          setExtractedTracks([]);
                        }}
                        disabled={processingMultitrack}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    {processingMultitrack && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                          Processando... {uploadProgress}%
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {extractedTracks.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Preview das Faixas
                  </Typography>
                  <MultitrackPlayer tracks={extractedTracks} />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Nova tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={handleAddTag}
                  disabled={!currentTag.trim()}
                >
                  Adicionar
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Notas */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Notas Adicionais
              </Typography>
              <TextField
                fullWidth
                label="Notas"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Observações, instruções especiais, etc."
              />
            </Paper>
          </Grid>

          {/* Botões de Ação */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/songs')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default EditSong;