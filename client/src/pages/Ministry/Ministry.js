import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Fab,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Church as ChurchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Ministry = () => {
  const { user } = useAuth();
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [newMinistry, setNewMinistry] = useState({
    name: '',
    description: '',
    church: ''
  });

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/members/my-ministries');
      setMinistries(response.data);
    } catch (err) {
      setError('Erro ao carregar ministérios');
      console.error('Erro ao buscar ministérios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMinistry = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!newMinistry.name.trim() || !newMinistry.church.trim()) {
        setError('Nome e Igreja são obrigatórios');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/members/ministry', newMinistry, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMinistries(prev => [...prev, {
        ministry: response.data,
        role: 'admin',
        joinedAt: new Date()
      }]);
      
      setSuccess('Ministério criado com sucesso!');
      setCreateDialogOpen(false);
      setNewMinistry({ name: '', description: '', church: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar ministério');
      console.error('Erro ao criar ministério:', err);
    }
  };

  const handleMenuOpen = (event, ministry) => {
    setAnchorEl(event.currentTarget);
    setSelectedMinistry(ministry);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMinistry(null);
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'leader': return 'Líder';
      case 'member': return 'Membro';
      default: return 'Membro';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'leader': return 'warning';
      case 'member': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Carregando...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Ministérios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Criar Ministério
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {ministries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ChurchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum ministério encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comece criando seu primeiro ministério ou aguarde um convite.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Criar Primeiro Ministério
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {ministries.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item.ministry._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {item.ministry.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, item)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ChurchIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {item.ministry.church}
                    </Typography>
                  </Box>
                  
                  {item.ministry.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.ministry.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {item.ministry.members?.length || 0} membros
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={getRoleText(item.role)}
                    color={getRoleColor(item.role)}
                    size="small"
                  />
                </CardContent>
                
                <CardActions>
                  <Button size="small" color="primary">
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
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DeleteIcon sx={{ mr: 1 }} />
          Sair do Ministério
        </MenuItem>
      </Menu>

      {/* Dialog de Criação */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Criar Novo Ministério</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nome do Ministério"
              value={newMinistry.name}
              onChange={(e) => setNewMinistry(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Igreja"
              value={newMinistry.church}
              onChange={(e) => setNewMinistry(prev => ({ ...prev, church: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Descrição (opcional)"
              value={newMinistry.description}
              onChange={(e) => setNewMinistry(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreateMinistry}
            variant="contained"
            disabled={!newMinistry.name.trim() || !newMinistry.church.trim()}
          >
            Criar Ministério
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Ministry;