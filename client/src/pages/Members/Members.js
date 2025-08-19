import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  MusicNote as MusicNoteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Members = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState({
    name: '',
    email: '',
    phone: '',
    instruments: [],
    roles: [],
    notes: ''
  });

  const instrumentOptions = [
    'vocal', 'guitarra', 'baixo', 'bateria', 'teclado', 
    'violao', 'saxofone', 'flauta', 'violino', 'outros'
  ];

  const roleOptions = ['lider', 'vocal', 'musico', 'tecnico'];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      if (!user?.ministries?.[0]?.ministry?._id) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const ministryId = user.ministries[0].ministry._id;
      const response = await axios.get(`/api/members/ministry/${ministryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // A API retorna o ministério completo, então extraímos apenas os membros
      setMembers(response.data.members || []);
    } catch (err) {
      setError('Erro ao carregar membros');
      console.error('Erro ao buscar membros:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleEdit = () => {
    setEditMember({
      name: selectedMember.name,
      email: selectedMember.email,
      phone: selectedMember.phone || '',
      instruments: selectedMember.instruments || [],
      roles: selectedMember.roles || [],
      notes: selectedMember.notes || ''
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleSaveEdit = async () => {
    try {
      const response = await api.put(`/members/${selectedMember._id}`, editMember);
      setMembers(members.map(m => m._id === selectedMember._id ? response.data : m));
      setEditDialogOpen(false);
      setSelectedMember(null);
    } catch (err) {
      setError('Erro ao atualizar membro');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/members/${selectedMember._id}`);
      setMembers(members.filter(m => m._id !== selectedMember._id));
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (err) {
      setError('Erro ao excluir membro');
    }
  };

  const getInstrumentColor = (instrument) => {
    const colors = {
      vocal: 'primary',
      guitarra: 'secondary',
      baixo: 'success',
      bateria: 'warning',
      teclado: 'info',
      violao: 'default'
    };
    return colors[instrument] || 'default';
  };

  const getRoleColor = (role) => {
    const colors = {
      lider: 'error',
      vocal: 'primary',
      musico: 'secondary',
      tecnico: 'info'
    };
    return colors[role] || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
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
          Membros
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setError('Funcionalidade de adicionar membro será implementada em breve')}
        >
          Adicionar Membro
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {members.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum membro encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Adicione membros ao seu ministério para começar.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {members.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        {member.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.email}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, member)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {member.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {member.phone}
                      </Typography>
                    </Box>
                  )}

                  {member.instruments && member.instruments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Instrumentos:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {member.instruments.map((instrument, index) => (
                          <Chip
                            key={index}
                            label={instrument}
                            size="small"
                            color={getInstrumentColor(instrument)}
                            icon={<MusicNoteIcon />}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {member.roles && member.roles.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Funções:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {member.roles.map((role, index) => (
                          <Chip
                            key={index}
                            label={role}
                            size="small"
                            color={getRoleColor(role)}
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {member.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {member.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog de edição */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Membro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            variant="outlined"
            value={editMember.name}
            onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={editMember.email}
            onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Telefone"
            fullWidth
            variant="outlined"
            value={editMember.phone}
            onChange={(e) => setEditMember({ ...editMember, phone: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Instrumentos</InputLabel>
            <Select
              multiple
              value={editMember.instruments}
              onChange={(e) => setEditMember({ ...editMember, instruments: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {instrumentOptions.map((instrument) => (
                <MenuItem key={instrument} value={instrument}>
                  {instrument}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Funções</InputLabel>
            <Select
              multiple
              value={editMember.roles}
              onChange={(e) => setEditMember({ ...editMember, roles: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Observações"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editMember.notes}
            onChange={(e) => setEditMember({ ...editMember, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o membro {selectedMember?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Members;