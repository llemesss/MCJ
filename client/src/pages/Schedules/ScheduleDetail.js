import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Divider,
  Avatar,
  ListItemAvatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  MusicNote as MusicNoteIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ScheduleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addSongDialogOpen, setAddSongDialogOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [availableSongs, setAvailableSongs] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedSong, setSelectedSong] = useState('');
  const [memberRole, setMemberRole] = useState('musico');

  useEffect(() => {
    fetchScheduleDetails();
    fetchAvailableMembers();
    fetchAvailableSongs();
  }, [id]);

  const fetchScheduleDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data);
    } catch (err) {
      setError('Erro ao carregar detalhes da escala');
      console.error('Erro ao buscar escala:', err);
    } finally {
      setLoading(false);
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

  const handleAddMember = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/schedules/${id}/members`, {
        memberId: selectedMember,
        role: memberRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAddMemberDialogOpen(false);
      setSelectedMember('');
      setMemberRole('musico');
      fetchScheduleDetails();
    } catch (err) {
      setError('Erro ao adicionar membro');
    }
  };

  const handleAddSong = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/schedules/${id}/songs`, {
        songId: selectedSong
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAddSongDialogOpen(false);
      setSelectedSong('');
      fetchScheduleDetails();
    } catch (err) {
      setError('Erro ao adicionar música');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/schedules/${id}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchScheduleDetails();
    } catch (err) {
      setError('Erro ao remover membro');
    }
  };

  const handleRemoveSong = async (songId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/schedules/${id}/songs/${songId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchScheduleDetails();
    } catch (err) {
      setError('Erro ao remover música');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    // Se o horário já está no formato HH:MM, retorna como está
    if (timeString && timeString.includes(':')) {
      return timeString;
    }
    // Caso contrário, tenta converter
    return timeString;
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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!schedule) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Escala não encontrada
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/schedules')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {schedule.title}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/schedules/${id}/edit`)}
        >
          Editar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informações da Escala */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações da Escala
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Data
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(schedule.date)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Horário
                    </Typography>
                    <Typography variant="body1">
                      {formatTime(schedule.time)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tipo
                  </Typography>
                  <Chip label={schedule.type} variant="outlined" />
                </Box>
              </Grid>
              
              {schedule.description && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <DescriptionIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Descrição
                      </Typography>
                      <Typography variant="body1">
                        {schedule.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Lista de Músicas */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Repertório ({schedule.songs?.length || 0})
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
            
            {schedule.songs?.length > 0 ? (
              <List>
                {schedule.songs.map((song, index) => (
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
                    {index < schedule.songs.length - 1 && <Divider />}
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

        {/* Membros Escalados */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Membros ({schedule.members?.length || 0})
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
            
            {schedule.members?.length > 0 ? (
              <List>
                {schedule.members.map((member, index) => (
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
                    {index < schedule.members.length - 1 && <Divider />}
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
        </Grid>
      </Grid>

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
                {availableMembers.map((member) => (
                  <MenuItem key={member._id} value={member._id}>
                    {member.name}
                  </MenuItem>
                ))}
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
                {availableSongs.map((song) => (
                  <MenuItem key={song._id} value={song._id}>
                    {song.title} - {song.artist}
                  </MenuItem>
                ))}
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

export default ScheduleDetail;