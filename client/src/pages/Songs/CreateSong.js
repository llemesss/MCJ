import React, { useState } from 'react';
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

} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  MusicNote as MusicIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MultitrackPlayer from '../../components/MultitrackPlayer';
import { processYouTubeUrl } from '../../utils/youtubeUtils';
import axios from 'axios';

const CreateSong = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [multitrackFile, setMultitrackFile] = useState(null);
  const [extractedTracks, setExtractedTracks] = useState([]);
  const [processingMultitrack, setProcessingMultitrack] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [waveformProgress, setWaveformProgress] = useState(0);
  const [processingWaveforms, setProcessingWaveforms] = useState(false);

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
    thumbnail: '',
    youtubeVideoId: '',
    tags: [],
    instruments: [],
    notes: ''
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



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      // Processar automaticamente links do YouTube
      if (parent === 'links' && child === 'youtube') {
        const youtubeInfo = processYouTubeUrl(value);
        if (youtubeInfo) {
          setFormData(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            },
            thumbnail: youtubeInfo.thumbnail,
            youtubeVideoId: youtubeInfo.videoId
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: value
            },
            thumbnail: '',
            youtubeVideoId: ''
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
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

  // Função para gerar waveform de um áudio
  const generateWaveform = async (audioUrl, trackName) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      
      audio.onloadedmetadata = async () => {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const channelData = audioBuffer.getChannelData(0);
          const samples = 1000;
          const blockSize = Math.floor(channelData.length / samples);
          const waveformData = [];
          
          for (let i = 0; i < samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(channelData[i * blockSize + j] || 0);
            }
            waveformData.push(sum / blockSize);
          }
          
          resolve(waveformData);
        } catch (error) {
          console.warn(`Erro ao gerar waveform para ${trackName}:`, error);
          // Gerar waveform simulado em caso de erro
          const simulatedWaveform = Array.from({ length: 1000 }, () => Math.random() * 0.5 + 0.1);
          resolve(simulatedWaveform);
        }
      };
      
      audio.onerror = () => {
        console.warn(`Erro ao carregar áudio para waveform: ${trackName}`);
        const simulatedWaveform = Array.from({ length: 1000 }, () => Math.random() * 0.5 + 0.1);
        resolve(simulatedWaveform);
      };
      
      audio.src = audioUrl;
    });
  };

  const handleMultitrackUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Por favor, selecione um arquivo .zip');
      return;
    }

    setMultitrackFile(file);
    setProcessingMultitrack(true);
    setUploadProgress(0);
    setWaveformProgress(0);
    setProcessingWaveforms(false);
    setError('');

    try {
      const formData = new FormData();
      formData.append('multitrack', file);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/songs/process-multitrack', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000,
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
      
      // Iniciar processamento de waveforms
      setProcessingWaveforms(true);
      setUploadProgress(100);
      
      // Gerar waveforms para todos os tracks
      const tracksWithWaveforms = [];
      for (let i = 0; i < tracksForPlayer.length; i++) {
        const track = tracksForPlayer[i];
        const waveformData = await generateWaveform(track.url, track.filename);
        
        tracksWithWaveforms.push({
          ...track,
          waveform: waveformData
        });
        
        // Atualizar progresso do waveform
        const waveformProgressPercent = Math.round(((i + 1) / tracksForPlayer.length) * 100);
        setWaveformProgress(waveformProgressPercent);
      }
      
      setExtractedTracks(tracksWithWaveforms);
      setSuccess('Multitrack processada com sucesso! Waveforms gerados e prontos para uso.');
    } catch (err) {
      let errorMessage = 'Erro ao processar multitrack';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: O arquivo é muito grande ou a conexão está lenta';
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMessage = 'Erro de rede: Verifique sua conexão com a internet';
      } else if (err.response?.data?.message) {
        const serverMessage = err.response.data.message;
        if (serverMessage.includes('ENOSPC') || serverMessage.includes('no space left')) {
          errorMessage = 'Erro: Não há espaço suficiente no disco para processar o arquivo';
        } else {
          errorMessage = serverMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setMultitrackFile(null);
    } finally {
      setProcessingMultitrack(false);
      setProcessingWaveforms(false);
      setUploadProgress(0);
      setWaveformProgress(0);
    }
  };

  const handleRemoveMultitrack = () => {
    setMultitrackFile(null);
    setExtractedTracks([]);
    setUploadProgress(0);
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
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
      notes: ''
    });
    setCurrentTag('');
    setMultitrackFile(null);
    setExtractedTracks([]);
    setUploadProgress(0);
    setWaveformProgress(0);
    setProcessingMultitrack(false);
    setProcessingWaveforms(false);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.title.trim()) {
        throw new Error('Título é obrigatório');
      }

      const token = localStorage.getItem('token');
      // Use default ministry if user doesn't have ministries
      const ministryId = user?.ministries?.[0]?.ministry?._id || 'default-ministry-id';

      const songData = {
        ...formData,
        ministry: ministryId,
        multitrack: multitrackFile ? {
          fileName: multitrackFile.name,
          tracks: extractedTracks.map(track => ({
            name: track.name,
            filePath: track.filePath,
            fileName: track.fileName,
            instrument: track.instrument,
            volume: track.volume || 1.0,
            mute: track.mute || false,
            solo: track.solo || false
          }))
        } : undefined
      };

      const response = await axios.post('/api/songs', songData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mostrar mensagem de sucesso e resetar formulário
      setSuccess('Música salva com sucesso!');
      resetForm();
      
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Adicionar Música
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
                      <Box
                        component="img"
                        src={formData.thumbnail}
                        alt="Thumbnail do YouTube"
                        sx={{
                          width: '100%',
                          maxWidth: 200,
                          height: 'auto',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
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
                      {processingMultitrack ? 'Fazendo Upload...' : 'Selecionar Arquivo .zip'}
                    </Button>
                  </label>
                  
                  {(processingMultitrack || processingWaveforms) && (
                    <Box sx={{ mt: 3, width: '100%', maxWidth: 400, mx: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="primary">
                          {uploadProgress < 100 ? `Enviando arquivo... ${uploadProgress}%` : 
                           processingWaveforms ? `Gerando waveforms... ${waveformProgress}%` :
                           'Processando multitrack...'}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={processingWaveforms ? waveformProgress : uploadProgress} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      {processingWaveforms && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Pré-carregando waveforms para otimizar a reprodução
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Faça upload de um arquivo .zip contendo as faixas individuais da música
                  </Typography>
                </Box>
              ) : (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MusicIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">
                          {multitrackFile.name}
                        </Typography>
                      </Box>
                      <IconButton onClick={handleRemoveMultitrack} color="error" disabled={processingMultitrack}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    {(processingMultitrack || processingWaveforms) && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          <Typography variant="body2" color="primary">
                            {uploadProgress < 100 ? `Enviando arquivo... ${uploadProgress}%` : 
                             processingWaveforms ? `Gerando waveforms... ${waveformProgress}%` :
                             'Processando multitrack...'}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={processingWaveforms ? waveformProgress : uploadProgress} 
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                        {processingWaveforms && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Pré-carregando waveforms para otimizar a reprodução
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {extractedTracks.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                          <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                            Multitrack Processado com Sucesso!
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {extractedTracks.length} faixas foram extraídas e estão prontas para uso
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={handleRemoveMultitrack}
                              startIcon={<DeleteIcon />}
                            >
                              Cancelar
                            </Button>
                          </Box>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
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
                  label="Adicionar tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  size="small"
                />
                <Button onClick={handleAddTag} variant="outlined">
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
                disabled={loading || processingMultitrack || processingWaveforms || (uploadProgress > 0 && uploadProgress < 100)}
              >
                {loading ? 'Salvando...' : 
                 processingMultitrack ? 'Processando Multitrack...' :
                 processingWaveforms ? 'Gerando Waveforms...' :
                 (uploadProgress > 0 && uploadProgress < 100) ? 'Enviando Arquivo...' :
                 'Salvar Música'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default CreateSong;