import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  MusicNote as MusicNoteIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Reports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('participation');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportTypes = [
    { value: 'participation', label: 'Participação de Membros', icon: <PeopleIcon /> },
    { value: 'songs', label: 'Uso de Músicas', icon: <MusicNoteIcon /> },
    { value: 'schedules', label: 'Visão Geral de Escalas', icon: <ScheduleIcon /> },
    { value: 'frequency', label: 'Frequência de Participação', icon: <TrendingUpIcon /> }
  ];

  useEffect(() => {
    if (reportType) {
      fetchReport();
    }
  }, [reportType]);

  const fetchReport = async () => {
    try {
      if (!user?.ministries?.[0]?.ministry?._id) {
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');
      const ministryId = user.ministries[0].ministry._id;
      
      const response = await axios.get(`/api/reports/${reportType}/${ministryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReportData(response.data);
    } catch (err) {
      setError('Erro ao carregar relatório');
      console.error('Erro ao buscar relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderParticipationReport = () => {
    if (!reportData?.members) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Participação de Membros" 
              avatar={<PeopleIcon color="primary" />}
            />
            <CardContent>
              <List>
                {reportData.members.map((member, index) => (
                  <React.Fragment key={member._id}>
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={member.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {member.instrument} • {member.role}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                Participação: {member.participationRate}%
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={member.participationRate} 
                                sx={{ flexGrow: 1, mr: 1 }}
                              />
                              <Chip 
                                label={`${member.schedulesParticipated}/${member.totalSchedules}`}
                                size="small"
                                color={member.participationRate >= 80 ? 'success' : 
                                       member.participationRate >= 60 ? 'warning' : 'error'}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < reportData.members.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderSongsReport = () => {
    if (!reportData?.songs) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Músicas Mais Tocadas" 
              avatar={<MusicNoteIcon color="primary" />}
            />
            <CardContent>
              <List>
                {reportData.songs.map((song, index) => (
                  <React.Fragment key={song._id}>
                    <ListItem>
                      <ListItemIcon>
                        <MusicNoteIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={song.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {song.artist} • {song.genre}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                              <Chip 
                                label={`${song.timesPlayed} vezes`}
                                size="small"
                                color="primary"
                              />
                              {song.averageRating > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <StarIcon sx={{ fontSize: 16, color: 'warning.main', mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {song.averageRating.toFixed(1)}
                                  </Typography>
                                </Box>
                              )}
                              {song.originalKey && (
                                <Chip 
                                  label={`Tom: ${song.originalKey}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < reportData.songs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderSchedulesReport = () => {
    if (!reportData?.schedules) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Estatísticas Gerais" 
              avatar={<AssessmentIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Total de Escalas:</Typography>
                  <Chip label={reportData.totalSchedules} color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Escalas Confirmadas:</Typography>
                  <Chip label={reportData.confirmedSchedules} color="success" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Escalas Pendentes:</Typography>
                  <Chip label={reportData.pendingSchedules} color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Taxa de Confirmação:</Typography>
                  <Chip 
                    label={`${reportData.confirmationRate}%`} 
                    color={reportData.confirmationRate >= 80 ? 'success' : 
                           reportData.confirmationRate >= 60 ? 'warning' : 'error'}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Próximas Escalas" 
              avatar={<ScheduleIcon color="primary" />}
            />
            <CardContent>
              <List>
                {reportData.schedules.slice(0, 5).map((schedule, index) => (
                  <React.Fragment key={schedule._id}>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={schedule.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(schedule.date).toLocaleDateString('pt-BR')}
                            </Typography>
                            <Chip 
                              label={schedule.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                              size="small"
                              color={schedule.status === 'confirmed' ? 'success' : 'warning'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(reportData.schedules.length, 5) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFrequencyReport = () => {
    if (!reportData?.frequency) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Frequência de Participação por Mês" 
              avatar={<TrendingUpIcon color="primary" />}
            />
            <CardContent>
              <List>
                {reportData.frequency.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`${item.month}/${item.year}`}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Participação Média:</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {item.averageParticipation}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={item.averageParticipation} 
                              color={item.averageParticipation >= 80 ? 'success' : 
                                     item.averageParticipation >= 60 ? 'warning' : 'error'}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {item.totalSchedules} escalas
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.totalParticipations} participações
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < reportData.frequency.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (!reportData) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum dado encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Não há dados suficientes para gerar este relatório.
          </Typography>
        </Paper>
      );
    }

    switch (reportType) {
      case 'participation':
        return renderParticipationReport();
      case 'songs':
        return renderSongsReport();
      case 'schedules':
        return renderSchedulesReport();
      case 'frequency':
        return renderFrequencyReport();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Relatórios
        </Typography>
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Tipo de Relatório</InputLabel>
          <Select
            value={reportType}
            label="Tipo de Relatório"
            onChange={(e) => setReportType(e.target.value)}
          >
            {reportTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {type.icon}
                  {type.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {renderReportContent()}
    </Container>
  );
};

export default Reports;