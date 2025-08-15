import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  Cloud as OnlineIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
  MusicNote as MusicIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useOfflineStorage from '../../hooks/useOfflineStorage';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const OfflineIndicator = ({ showDetails = false }) => {
  const { isOnline } = useOnlineStatus();
  const {
    lastSync,
    syncStatus,
    isDataStale,
    storageSize,
    syncAll,
    getSongs,
    getSchedules,
    getMembers,
    clearOfflineData
  } = useOfflineStorage();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastSync = (date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days} dias atrás`;
  };

  const getStatusIcon = () => {
    if (!isOnline) return <OfflineIcon />;
    
    switch (syncStatus) {
      case 'syncing': return <SyncIcon className="rotating" />;
      case 'success': return <CheckIcon />;
      case 'error': return <ErrorIcon />;
      default: return <OnlineIcon />;
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    if (isDataStale) return 'warning';
    
    switch (syncStatus) {
      case 'syncing': return 'info';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isDataStale) return 'Desatualizado';
    
    switch (syncStatus) {
      case 'syncing': return 'Sincronizando';
      case 'success': return 'Sincronizado';
      case 'error': return 'Erro';
      default: return 'Online';
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) return;
    
    setIsManualSyncing(true);
    await syncAll();
    setIsManualSyncing(false);
  };

  const offlineData = {
    songs: getSongs(),
    schedules: getSchedules(),
    members: getMembers()
  };

  if (!showDetails) {
    return (
      <Tooltip title={`Status: ${getStatusText()}. Última sync: ${formatLastSync(lastSync)}`}>
        <IconButton 
          size="small" 
          onClick={() => setDialogOpen(true)}
          color={getStatusColor()}
        >
          {getStatusIcon()}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box>
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor()}
        variant="outlined"
        size="small"
        onClick={() => setDialogOpen(true)}
        sx={{ cursor: 'pointer' }}
      />

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          Status de Sincronização
        </DialogTitle>
        
        <DialogContent>
          {/* Status Geral */}
          <Alert 
            severity={getStatusColor()} 
            sx={{ mb: 2 }}
            action={
              isOnline && (
                <IconButton
                  size="small"
                  onClick={handleManualSync}
                  disabled={isManualSyncing || syncStatus === 'syncing'}
                >
                  <RefreshIcon className={isManualSyncing ? 'rotating' : ''} />
                </IconButton>
              )
            }
          >
            <Typography variant="body2">
              {!isOnline 
                ? 'Você está offline. Os dados podem estar desatualizados.'
                : isDataStale
                ? 'Dados desatualizados. Recomendamos sincronizar.'
                : 'Dados atualizados e sincronizados.'
              }
            </Typography>
          </Alert>

          {/* Progresso de Sincronização */}
          {syncStatus === 'syncing' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Sincronizando dados...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Informações de Sincronização */}
          <List dense>
            <ListItem>
              <ListItemIcon>
                <ScheduleIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Última Sincronização"
                secondary={formatLastSync(lastSync)}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dados Offline"
                secondary={formatBytes(storageSize)}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Dados Disponíveis Offline */}
          <Typography variant="h6" sx={{ mb: 1 }}>
            Dados Disponíveis Offline
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <MusicIcon color={offlineData.songs.length > 0 ? 'success' : 'disabled'} />
              </ListItemIcon>
              <ListItemText 
                primary="Músicas"
                secondary={`${offlineData.songs.length} disponíveis`}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ScheduleIcon color={offlineData.schedules.length > 0 ? 'success' : 'disabled'} />
              </ListItemIcon>
              <ListItemText 
                primary="Cronogramas"
                secondary={`${offlineData.schedules.length} disponíveis`}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PeopleIcon color={offlineData.members.length > 0 ? 'success' : 'disabled'} />
              </ListItemIcon>
              <ListItemText 
                primary="Membros"
                secondary={`${offlineData.members.length} disponíveis`}
              />
            </ListItem>
          </List>

          {/* Informações Adicionais */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              💡 Os dados são sincronizados automaticamente quando você está online. 
              O player multitrack requer conexão ativa.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={clearOfflineData} color="error">
            Limpar Dados
          </Button>
          
          {isOnline && (
            <Button 
              onClick={handleManualSync}
              disabled={isManualSyncing || syncStatus === 'syncing'}
              variant="contained"
            >
              {isManualSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          )}
          
          <Button onClick={() => setDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <style jsx>{`
        .rotating {
          animation: rotate 1s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default OfflineIndicator;