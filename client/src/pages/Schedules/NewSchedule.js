import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MusicNote as MusicNoteIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const NewSchedule = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Para edição
  const { user } = useAuth();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'culto',
    description: '',
    members: [],
    songs: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [availableSongs, setAvailableSongs] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedSong, setSelectedSong] = useState('');
  const [memberRole, setMemberRole] = useState('musico');

  useEffect(() => {
    fetchAvailableMembers();
    fetchAvailableSongs();
    
    if (isEditing) {
      fetchScheduleData();
    }
  }, [id]);

  const fetchScheduleData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const schedule = response.data;
      setFormData({
        title: schedule.title,
        date: schedule.date.split('T')[0], // Formato YYYY-MM-DD
        time: schedule.time,
        type: schedule.type,
        description: schedule.description || '',
        members: schedule.members || [],
        songs: schedule.songs || []
      });
    } catch (err) {
      setError('Erro ao carregar dados da escala');
      console.error('Erro ao buscar escala:', err);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableMembers(response.data);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    }
  };

  const fetchAvailableSongs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/songs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSongs(response.data);
    } catch (err) {
      console.error('Erro ao buscar músicas:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMember = () => {
    if (!selectedMember) return;
    
    const member = availableMembers.find(m => m._id === selectedMember);
    if (!member) return;
    
    // Verificar se o membro já está na escala
    if (formData.members.some(m => m._id === selectedMember)) {
      setError('Este membro já está na escala');
      return;
    }
    
    const memberWithRole = {
      ...member,
      role: memberRole
    };
    
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, memberWithRole]
    }));
    
    setAddMemberDialogOpen(false);
    setSelectedMember('');
    setMemberRole('musico');
    setError('');
  };

  const handleAddSong = () => {
    if (!selectedSong) return;
    
    const song = availableSongs.find(s => s._id === selectedSong);
    if (!song) return;
    
    // Verificar se a música já está no repertório
    if (formData.songs.some(s => s._id === selectedSong)) {
      setError('Esta música já está no repertório');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      songs: [...prev.songs, song]
    }));
    
    setAddSongDialogOpen(false);
    setSelectedSong('');
    setError('');
  };

  const handleRemoveMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(m => m._id !== memberId)
    }));
  };

  const handleRemoveSong = (songId) => {
    setFormData(prev => ({
      ...prev,
      songs: prev.songs.filter(s => s._id !== songId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      
      const submitData = {
        ...formData,
        members: formData.members.map(m => ({
          memberId: m._id,
          role: m.role
        })),
        songs: formData.songs.map(s => s._id)
      };
      
      if (isEditing) {
        await axios.put(`/api/schedules/${id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Escala atualizada com sucesso!');
      } else {
        await axios.post('/api/schedules', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Escala criada com sucesso!');
      }
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/schedules');
      }, 2000);
      
    } catch (err) {
      setError(isEditing ? 'Erro ao atualizar escala' : 'Erro ao criar escala');
      console.error('Erro ao salvar escala:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'lider': 'primary',
      'vocal': 'secondary',
      'musico': 'default',
      'tecnico': 'info'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'lider': 'Líder',
      'vocal': 'Vocal',
      'musico': 'Músico',
      'tecnico': 'Técnico'
    };
    return labels[role] || role;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/schedules')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {isEditing ? 'Editar Escala' : 'Nova Escala'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Informações Básicas */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Informações da Escala
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Título da Escala"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Data"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Horário"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      label="Tipo"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="culto">Culto</MenuItem>
                      <MenuItem value="ensaio">Ensaio</MenuItem>
                      <MenuItem value="evento">Evento Especial</MenuItem>
                      <MenuItem value="conferencia">Conferência</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição (opcional)"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Repertório */}
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Repertório ({formData.songs.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddSongDialogOpen(true)}
                >
                  Adicionar Música
                </Button>
              </Box>
              
              {formData.songs.length > 0 ? (
                <List>
                  {formData.songs.map((song, index) => (
                    <React.Fragment key={song._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <MusicNoteIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={song.title}
                          secondary={`${song.artist} • ${song.key || 'Tom não definido'}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveSong(song._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < formData.songs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MusicNoteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma música adicionada ainda
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Membros */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Membros ({formData.members.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setAddMemberDialogOpen(true)}
                >
                  Adicionar
                </Button>
              </Box>
              
              {formData.members.length > 0 ? (
                <List>
                  {formData.members.map((member, index) => (
                    <React.Fragment key={member._id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={member.name}
                          secondary={
                            <Chip
                              label={getRoleLabel(member.role)}
                              color={getRoleColor(member.role)}
                              size="small"
                            />
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < formData.members.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nenhum membro escalado ainda
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {/* Botões de Ação */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/schedules')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Escala')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Dialog para Adicionar Membro */}
      <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Membro à Escala</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Membro</InputLabel>
              <Select
                value={selectedMember}
                label="Membro"
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                {availableMembers
                  .filter(member => !formData.members.some(m => m._id === member._id))
                  .map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      {member.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Função</InputLabel>
              <Select
                value={memberRole}
                label="Função"
                onChange={(e) => setMemberRole(e.target.value)}
              >
                <MenuItem value="lider">Líder</MenuItem>
                <MenuItem value="vocal">Vocal</MenuItem>
                <MenuItem value="musico">Músico</MenuItem>
                <MenuItem value="tecnico">Técnico</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddMember} 
            variant="contained"
            disabled={!selectedMember}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Adicionar Música */}
      <Dialog open={addSongDialogOpen} onClose={() => setAddSongDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Música ao Repertório</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Música</InputLabel>
              <Select
                value={selectedSong}
                label="Música"
                onChange={(e) => setSelectedSong(e.target.value)}
              >
                {availableSongs
                  .filter(song => !formData.songs.some(s => s._id === song._id))
                  .map((song) => (
                    <MenuItem key={song._id} value={song._id}>
                      {song.title} - {song.artist}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSongDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddSong} 
            variant="contained"
            disabled={!selectedSong}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NewSchedule;