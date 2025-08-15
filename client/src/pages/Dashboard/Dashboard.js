import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  MusicNote as MusicNoteIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user's first ministry (for now)
      const ministryId = user?.ministries?.[0]?.ministry?._id;
      
      if (!ministryId) {
        setLoading(false);
        return;
      }

      // Fetch dashboard stats
      const [schedulesRes, songsRes] = await Promise.all([
        axios.get(`/api/schedules/ministry/${ministryId}?limit=5&upcoming=true`),
        axios.get(`/api/songs/ministry/${ministryId}?limit=5&sort=lastPlayed`),
      ]);

      setUpcomingSchedules(schedulesRes.data.schedules || []);
      setRecentSongs(songsRes.data.songs || []);
      
      // Calculate basic stats
      const totalSchedules = schedulesRes.data.total || 0;
      const totalSongs = songsRes.data.total || 0;
      
      setStats({
        totalSchedules,
        totalSongs,
        totalMembers: user?.ministries?.[0]?.ministry?.members?.length || 0,
        upcomingEvents: schedulesRes.data.schedules?.length || 0,
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleDate = (date) => {
    const scheduleDate = new Date(date);
    if (isToday(scheduleDate)) {
      return 'Hoje';
    } else if (isTomorrow(scheduleDate)) {
      return 'Amanhã';
    } else {
      return format(scheduleDate, 'dd/MM', { locale: ptBR });
    }
  };

  const getScheduleTypeColor = (type) => {
    switch (type) {
      case 'culto':
        return 'primary';
      case 'ensaio':
        return 'secondary';
      case 'evento':
        return 'success';
      case 'especial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getScheduleTypeLabel = (type) => {
    switch (type) {
      case 'culto':
        return 'Culto';
      case 'ensaio':
        return 'Ensaio';
      case 'evento':
        return 'Evento';
      case 'especial':
        return 'Especial';
      default:
        return type;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando dashboard..." />;
  }

  if (!user?.ministries?.length) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Bem-vindo ao MCJ Worship!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Você ainda não faz parte de nenhum ministério.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/ministry')}
            startIcon={<AddIcon />}
          >
            Criar ou Entrar em um Ministério
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo de volta, {user?.name}!
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.totalSchedules || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Escalas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <MusicNoteIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.totalSongs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Músicas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.totalMembers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Membros
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <EventIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.upcomingEvents || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Próximos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Upcoming Schedules */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Próximas Escalas
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/schedules')}
                endIcon={<ChevronRightIcon />}
              >
                Ver todas
              </Button>
            </Box>
            
            {upcomingSchedules.length > 0 ? (
              <List>
                {upcomingSchedules.map((schedule, index) => (
                  <React.Fragment key={schedule._id}>
                    <ListItem
                      sx={{ px: 0 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/schedules/${schedule._id}`)}
                        >
                          <ChevronRightIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {schedule.title}
                            </Typography>
                            <Chip
                              label={getScheduleTypeLabel(schedule.type)}
                              size="small"
                              color={getScheduleTypeColor(schedule.type)}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {getScheduleDate(schedule.date)} às {schedule.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < upcomingSchedules.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhuma escala próxima
              </Typography>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => navigate('/schedules/new')}
              >
                Nova Escala
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Songs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Repertório Recente
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/songs')}
                endIcon={<ChevronRightIcon />}
              >
                Ver todas
              </Button>
            </Box>
            
            {recentSongs.length > 0 ? (
              <List>
                {recentSongs.map((song, index) => (
                  <React.Fragment key={song._id}>
                    <ListItem
                      sx={{ px: 0 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/songs/${song._id}`)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                          <MusicNoteIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={song.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {song.artist}
                            </Typography>
                            {song.usage?.timesPlayed > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                Tocada {song.usage.timesPlayed} vez(es)
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentSongs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhuma música no repertório
              </Typography>
            )}
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => navigate('/songs/new')}
              >
                Adicionar Música
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;