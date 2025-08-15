import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Alert,
  Collapse
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as ExcellentIcon,
  SignalWifi3Bar as GoodIcon,
  SignalWifi2Bar as FairIcon,
  SignalWifi1Bar as PoorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const ConnectionStatus = ({ showAlert = false, compact = false }) => {
  const { isOnline, connectionQuality, canUseMultitrack, recommendedQuality } = useOnlineStatus();

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOffIcon />;
    
    switch (connectionQuality) {
      case 'excellent': return <ExcellentIcon />;
      case 'good': return <GoodIcon />;
      case 'fair': return <FairIcon />;
      case 'poor': return <PoorIcon />;
      default: return <WifiIcon />;
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    
    switch (connectionQuality) {
      case 'excellent': return 'success';
      case 'good': return 'success';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (connectionQuality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Boa';
      case 'fair': return 'Regular';
      case 'poor': return 'Ruim';
      default: return 'Verificando...';
    }
  };

  const getTooltipText = () => {
    if (!isOnline) {
      return 'Sem conexão com a internet. Player multitrack indisponível.';
    }
    
    const qualityText = getStatusText();
    const playerStatus = canUseMultitrack ? 'disponível' : 'indisponível';
    const quality = recommendedQuality !== 'disabled' ? `Qualidade recomendada: ${recommendedQuality}` : '';
    
    return `Conexão: ${qualityText}. Player multitrack ${playerStatus}. ${quality}`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (compact) {
    return (
      <Tooltip title={getTooltipText()}>
        <IconButton size="small" color={getStatusColor()}>
          {getStatusIcon()}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={getTooltipText()}>
          <Chip
            icon={getStatusIcon()}
            label={getStatusText()}
            color={getStatusColor()}
            variant="outlined"
            size="small"
          />
        </Tooltip>
        
        {!isOnline && (
          <Tooltip title="Tentar reconectar">
            <IconButton size="small" onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {showAlert && (
        <Collapse in={!canUseMultitrack}>
          <Alert 
            severity={isOnline ? 'warning' : 'error'} 
            sx={{ mt: 1 }}
          >
            {!isOnline 
              ? 'Você está offline. Conecte-se à internet para usar o player multitrack.'
              : 'Conexão instável. O player multitrack pode não funcionar adequadamente.'
            }
          </Alert>
        </Collapse>
      )}
    </Box>
  );
};

export default ConnectionStatus;