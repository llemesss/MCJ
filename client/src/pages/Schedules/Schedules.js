import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Group as GroupIcon,
  MusicNote as MusicNoteIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Schedules = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState({
    title: '',
    date: '',
    time: '',
    type: 'culto',
    description: '',
    ministry: null
  });
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    date: '',
    time: '',
    type: 'culto',
    description: '',
    ministry: null
  });
  const [ministries, setMinistries] = useState([]);

  useEffect(() => {
    fetchSchedules();
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/members/my-ministries', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMinistries(response.data);
      // Define o primeiro ministério como padrão
      if (response.data.length > 0) {
        setNewSchedule(prev => ({ ...prev, ministry: response.data[0].ministry._id }));
      }
    } catch (err) {
      console.error('Erro ao buscar ministérios:', err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // A API retorna um objeto com a propriedade schedules
      setSchedules(response.data.schedules || []);
    } catch (err) {
      setError('Erro ao carregar escalas');
      console.error('Erro ao buscar escalas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = useCallback((schedule = selectedSchedule) => {
    // Verificar se há uma escala selecionada
    if (!schedule) {
      setError('Nenhuma escala selecionada para edição');
      return;
    }

    // Preenche o formulário de edição com os dados da escala selecionada
    const ministryId = schedule.ministry && typeof schedule.ministry === 'object' 
      ? schedule.ministry._id 
      : schedule.ministry;
    
    setEditSchedule({
      title: schedule.title,
      date: schedule.date.split('T')[0], // Converte para formato YYYY-MM-DD
      time: schedule.time,
      type: schedule.type,
      description: schedule.description || '',
      ministry: ministryId
    });
    setSelectedSchedule(schedule); // Garante que selectedSchedule está definido
    setEditDialogOpen(true);
  }, [selectedSchedule]);

  // Detecta se o usuário está tentando editar uma escala específica via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const editId = urlParams.get('edit');
    
    if (editId && schedules.length > 0 && !loading) {
      const scheduleToEdit = schedules.find(s => s._id === editId);
      if (scheduleToEdit) {
        // Aguarda um pouco para garantir que o componente está totalmente carregado
        setTimeout(() => {
          handleEdit(scheduleToEdit);
          // Remove o parâmetro da URL sem recarregar a página
          navigate('/schedules', { replace: true });
        }, 100);
      }
    }
  }, [schedules, location.search, navigate, loading, handleEdit]);

  const handleMenuOpen = (event, schedule) => {
    setAnchorEl(event.currentTarget);
    setSelectedSchedule(schedule);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSchedule(null);
  };

  const handleDelete = async () => {
    try {
      // Verificar se há uma escala selecionada
      if (!selectedSchedule || !selectedSchedule._id) {
        setError('Nenhuma escala selecionada para exclusão');
        return;
      }

      const token = localStorage.getItem('token');
      await axios.delete(`/api/schedules/${selectedSchedule._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(schedules.filter(s => s._id !== selectedSchedule._id));
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (err) {
      setError('Erro ao excluir escala');
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/schedules', newSchedule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules([...schedules, response.data]);
      setCreateDialogOpen(false);
      setNewSchedule({ 
        title: '', 
        date: '', 
        time: '', 
        type: 'culto', 
        description: '',
        ministry: ministries.length > 0 ? ministries[0].ministry._id : null
      });
    } catch (err) {
      setError('Erro ao criar escala');
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      // Verificar se há uma escala selecionada
      if (!selectedSchedule || !selectedSchedule._id) {
        setError('Nenhuma escala selecionada para atualização');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Log para debug
      console.log('Dados sendo enviados para atualização:', editSchedule);
      console.log('Ministry ID:', editSchedule.ministry);
      
      const response = await axios.put(`/api/schedules/${selectedSchedule._id}`, editSchedule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Atualiza a escala na lista
      setSchedules(schedules.map(s => s._id === selectedSchedule._id ? response.data : s));
      setEditDialogOpen(false);
      setEditSchedule({
        title: '',
        date: '',
        time: '',
        type: 'culto',
        description: '',
        ministry: null
      });
      setError(''); // Limpa qualquer erro anterior
    } catch (err) {
      console.error('Erro ao atualizar escala:', err);
      setError('Erro ao atualizar escala: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (date) => {
    const scheduleDate = new Date(date);
    const today = new Date();
    const diffTime = scheduleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'default';
    if (diffDays === 0) return 'warning';
    if (diffDays <= 7) return 'info';
    return 'success';
  };

  const getStatusText = (date) => {
    const scheduleDate = new Date(date);
    const today = new Date();
    const diffTime = scheduleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Realizada';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays <= 7) return `${diffDays} dias`;
    return `${diffDays} dias`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString) => {
    // Se o horário já está no formato HH:MM, retorna como está
    if (timeString && timeString.includes(':')) {
      return timeString;
    }
    // Caso contrário, tenta converter
    return timeString;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={150} height={40} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Escalas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Nova Escala
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {schedules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma escala encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comece criando sua primeira escala de ministério.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Criar Primeira Escala
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {schedules.map((schedule) => (
            <Grid item xs={12} md={6} lg={4} key={schedule._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {schedule.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, schedule)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(schedule.date)} às {formatTime(schedule.time)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={getStatusText(schedule.date)}
                      color={getStatusColor(schedule.date)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={schedule.type}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  
                  {schedule.description && (
                    <Typography variant="body2" color="text.secondary">
                      {schedule.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GroupIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {schedule.members?.length || 0} membros
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MusicNoteIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {schedule.songs?.length || 0} músicas
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/schedules/${schedule._id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu de Ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleEdit(selectedSchedule);
          handleMenuClose();
        }}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => setDeleteDialogOpen(true)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a escala "{selectedSchedule?.title}"?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Criação de Escala */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Escala</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Título"
              value={newSchedule.title}
              onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ministério</InputLabel>
              <Select
                value={newSchedule.ministry || ''}
                label="Ministério"
                onChange={(e) => setNewSchedule({ ...newSchedule, ministry: e.target.value })}
              >
                {ministries.map((item) => (
                  <MenuItem key={item.ministry._id} value={item.ministry._id}>
                    {item.ministry.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Data"
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    placeholder: 'dd/mm/aaaa'
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Horário"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={newSchedule.type}
                label="Tipo"
                onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value })}
              >
                <MenuItem value="culto">Culto</MenuItem>
                <MenuItem value="ensaio">Ensaio</MenuItem>
                <MenuItem value="evento">Evento Especial</MenuItem>
                <MenuItem value="conferencia">Conferência</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Descrição (opcional)"
              multiline
              rows={3}
              value={newSchedule.description}
              onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateSchedule} 
            variant="contained"
            disabled={!newSchedule.title || !newSchedule.date || !newSchedule.time || !newSchedule.ministry}
          >
            Criar Escala
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Edição */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Escala</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Título"
              value={editSchedule.title}
              onChange={(e) => setEditSchedule({ ...editSchedule, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ministério</InputLabel>
              <Select
                value={editSchedule.ministry || ''}
                label="Ministério"
                onChange={(e) => setEditSchedule({ ...editSchedule, ministry: e.target.value })}
              >
                {ministries.map((item) => (
                  <MenuItem key={item.ministry._id} value={item.ministry._id}>
                    {item.ministry.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Data"
                  type="date"
                  value={editSchedule.date}
                  onChange={(e) => setEditSchedule({ ...editSchedule, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    placeholder: 'dd/mm/aaaa'
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Horário"
                  type="time"
                  value={editSchedule.time}
                  onChange={(e) => setEditSchedule({ ...editSchedule, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={editSchedule.type}
                label="Tipo"
                onChange={(e) => setEditSchedule({ ...editSchedule, type: e.target.value })}
              >
                <MenuItem value="culto">Culto</MenuItem>
                <MenuItem value="ensaio">Ensaio</MenuItem>
                <MenuItem value="evento">Evento Especial</MenuItem>
                <MenuItem value="conferencia">Conferência</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Descrição (opcional)"
              multiline
              rows={3}
              value={editSchedule.description}
              onChange={(e) => setEditSchedule({ ...editSchedule, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleUpdateSchedule} 
            variant="contained"
            disabled={!editSchedule.title || !editSchedule.date || !editSchedule.time || !editSchedule.ministry}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Schedules;