import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Box,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  VolumeUp as VolumeIcon,
  Speed as SpeedIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';

const PlayerSettings = ({ open, onClose, settings: externalSettings, onSettingsChange }) => {
  const [settings, setSettings] = useState(externalSettings || {
    autoPlay: false,
    showVUMeters: true,
    showWaveform: false,
    defaultVolume: 80,
    seekStep: 10,
    volumeStep: 5,
    keyboardShortcuts: true,
    compactMode: false,
    colorScheme: 'auto',
    vuSensitivity: 0.8,
    smoothTransitions: true,
  });

  useEffect(() => {
    if (externalSettings) {
      setSettings(externalSettings);
    }
  }, [externalSettings]);

  useEffect(() => {
    localStorage.setItem('playerSettings', JSON.stringify(settings));
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      autoPlay: false,
      showVUMeters: true,
      showWaveform: false,
      defaultVolume: 80,
      seekStep: 10,
      volumeStep: 5,
      keyboardShortcuts: true,
      compactMode: false,
      colorScheme: 'auto',
      vuSensitivity: 0.8,
      smoothTransitions: true,
    };
    setSettings(defaultSettings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        Configurações do Player
      </DialogTitle>
      
      <DialogContent>
        {/* Reprodução */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolumeIcon fontSize="small" />
            Reprodução
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoPlay}
                  onChange={(e) => handleSettingChange('autoPlay', e.target.checked)}
                />
              }
              label="Reprodução automática"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.keyboardShortcuts}
                  onChange={(e) => handleSettingChange('keyboardShortcuts', e.target.checked)}
                />
              }
              label="Atalhos de teclado"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.smoothTransitions}
                  onChange={(e) => handleSettingChange('smoothTransitions', e.target.checked)}
                />
              }
              label="Transições suaves"
            />
          </FormGroup>
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Volume padrão: {settings.defaultVolume}%</Typography>
            <Slider
              value={settings.defaultVolume}
              onChange={(e, value) => handleSettingChange('defaultVolume', value)}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Controles */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon fontSize="small" />
            Controles
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Passo de navegação: {settings.seekStep}s</Typography>
            <Slider
              value={settings.seekStep}
              onChange={(e, value) => handleSettingChange('seekStep', value)}
              min={5}
              max={30}
              step={5}
              marks={[
                { value: 5, label: '5s' },
                { value: 15, label: '15s' },
                { value: 30, label: '30s' }
              ]}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>Passo de volume: {settings.volumeStep}%</Typography>
            <Slider
              value={settings.volumeStep}
              onChange={(e, value) => handleSettingChange('volumeStep', value)}
              min={1}
              max={10}
              step={1}
              marks={[
                { value: 1, label: '1%' },
                { value: 5, label: '5%' },
                { value: 10, label: '10%' }
              ]}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Interface */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon fontSize="small" />
            Interface
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showVUMeters}
                  onChange={(e) => handleSettingChange('showVUMeters', e.target.checked)}
                />
              }
              label="Mostrar VU Meters"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.compactMode}
                  onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                />
              }
              label="Modo compacto"
            />
          </FormGroup>
          
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Esquema de cores</InputLabel>
              <Select
                value={settings.colorScheme}
                label="Esquema de cores"
                onChange={(e) => handleSettingChange('colorScheme', e.target.value)}
              >
                <MenuItem value="auto">Automático</MenuItem>
                <MenuItem value="light">Claro</MenuItem>
                <MenuItem value="dark">Escuro</MenuItem>
                <MenuItem value="colorful">Colorido</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Sensibilidade VU Meter: {Math.round(settings.vuSensitivity * 100)}%</Typography>
            <Slider
              value={settings.vuSensitivity}
              onChange={(e, value) => handleSettingChange('vuSensitivity', value)}
              min={0.1}
              max={1.0}
              step={0.1}
              marks={[
                { value: 0.1, label: '10%' },
                { value: 0.5, label: '50%' },
                { value: 1.0, label: '100%' }
              ]}
            />
          </Box>
        </Box>
        
        {/* Informações dos Atalhos */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Atalhos de Teclado Disponíveis:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Espaço: Play/Pause" size="small" />
            <Chip label="S: Stop" size="small" />
            <Chip label="← →: Navegar" size="small" />
            <Chip label="M: Mutar todas" size="small" />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={resetToDefaults} color="secondary">
          Restaurar Padrões
        </Button>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlayerSettings;