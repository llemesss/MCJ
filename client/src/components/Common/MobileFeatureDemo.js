import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Smartphone as MobileIcon,
  CloudOff as OfflineIcon,
  Wifi as OnlineIcon,
  MusicNote as MusicIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Notifications as NotificationIcon,
  Download as DownloadIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import useOfflineStorage from '../../hooks/useOfflineStorage';
import ConnectionStatus from './ConnectionStatus';
import OfflineIndicator from './OfflineIndicator';

const MobileFeatureDemo = () => {
  const { isOnline, canUseMultitrack, connectionQuality } = useOnlineStatus();
  const { 
    syncAll, 
    getSongs, 
    getSchedules, 
    getMembers, 
    lastSync,
    syncStatus 
  } = useOfflineStorage();
  
  const [simulateOffline, setSimulateOffline] = useState(false);

  const offlineFeatures = [
    {
      icon: <MusicIcon />,
      title: 'Cifras e Letras',
      description: 'Acesse músicas salvas offline',
      available: getSongs().length > 0,
      count: getSongs().length
    },
    {
      icon: <ScheduleIcon />,
      title: 'Cronogramas',
      description: 'Visualize escalas e eventos',
      available: getSchedules().length > 0,
      count: getSchedules().length
    },
    {
      icon: <PeopleIcon />,
      title: 'Membros',
      description: 'Lista de contatos do ministério',
      available: getMembers().length > 0,
      count: getMembers().length
    },
    {
      icon: <ChatIcon />,
      title: 'Chat Offline',
      description: 'Mensagens em cache local',
      available: true,
      count: 'Cache'
    },
    {
      icon: <NotificationIcon />,
      title: 'Notificações',
      description: 'Alertas importantes salvos',
      available: true,
      count: 'PWA'
    }
  ];

  const onlineOnlyFeatures = [
    {
      icon: <MusicIcon />,
      title: 'Player Multitrack',
      description: 'Reprodução de faixas separadas',
      requiresGoodConnection: true
    },
    {
      icon: <DownloadIcon />,
      title: 'Upload de Arquivos',
      description: 'Envio de multitracks e documentos',
      requiresGoodConnection: true
    },
    {
      icon: <SyncIcon />,
      title: 'Sincronização em Tempo Real',
      description: 'Atualizações instantâneas',
      requiresGoodConnection: false
    }
  ];

  const handleTestSync = async () => {
    await syncAll();
  };

  const getConnectionStatusColor = () => {
    if (!isOnline) return 'error';
    if (connectionQuality === 'excellent' || connectionQuality === 'good') return 'success';
    if (connectionQuality === 'fair') return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        🚀 Funcionalidades Mobile & Offline
      </Typography>

      {/* Status de Conectividade */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Status de Conectividade
            </Typography>
            <ConnectionStatus showAlert={false} />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Alert severity={getConnectionStatusColor()}>
                <Typography variant="body2">
                  <strong>Status:</strong> {isOnline ? 'Online' : 'Offline'}<br/>
                  <strong>Qualidade:</strong> {connectionQuality}<br/>
                  <strong>Player Multitrack:</strong> {canUseMultitrack ? 'Disponível' : 'Indisponível'}
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center' }}>
                <OfflineIndicator showDetails={true} />
                <Button 
                  variant="outlined" 
                  onClick={handleTestSync}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  sx={{ mt: 1 }}
                >
                  {syncStatus === 'syncing' ? 'Sincronizando...' : 'Testar Sincronização'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Funcionalidades Offline */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfflineIcon color="primary" />
            Funcionalidades Offline
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estas funcionalidades estão disponíveis mesmo sem conexão com a internet:
          </Typography>
          
          <List>
            {offlineFeatures.map((feature, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature.title}
                    secondary={feature.description}
                  />
                  <Chip 
                    label={feature.available ? `${feature.count} itens` : 'Não disponível'}
                    color={feature.available ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
                {index < offlineFeatures.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Funcionalidades Online */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <OnlineIcon color="primary" />
            Funcionalidades Online
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estas funcionalidades requerem conexão com a internet:
          </Typography>
          
          <List>
            {onlineOnlyFeatures.map((feature, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {feature.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature.title}
                    secondary={feature.description}
                  />
                  <Chip 
                    label={
                      !isOnline 
                        ? 'Offline' 
                        : feature.requiresGoodConnection && !canUseMultitrack
                        ? 'Conexão insuficiente'
                        : 'Disponível'
                    }
                    color={
                      !isOnline 
                        ? 'error' 
                        : feature.requiresGoodConnection && !canUseMultitrack
                        ? 'warning'
                        : 'success'
                    }
                    size="small"
                  />
                </ListItem>
                {index < onlineOnlyFeatures.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Informações PWA */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MobileIcon color="primary" />
            Progressive Web App (PWA)
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Esta aplicação pode ser instalada no seu dispositivo móvel como um app nativo!
            </Typography>
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Recursos PWA implementados:</strong>
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemText 
                primary="📱 Instalação como App"
                secondary="Adicione à tela inicial do dispositivo"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="🔄 Service Worker"
                secondary="Cache inteligente e funcionamento offline"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="🔔 Notificações Push"
                secondary="Alertas mesmo com app fechado (futuro)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="📊 Sincronização em Background"
                secondary="Dados atualizados automaticamente"
              />
            </ListItem>
          </List>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            💡 Para testar o modo offline, desconecte sua internet ou use as ferramentas de desenvolvedor do navegador.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MobileFeatureDemo;