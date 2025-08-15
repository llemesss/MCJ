import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import MultitrackPlayer from '../../components/MultitrackPlayer';

const TestMultitrack = () => {
  const navigate = useNavigate();

  // Dados de exemplo - usando arquivos de teste simples
  const testTracks = [
    {
      name: 'Teste Audio Online',
      fileName: 'test-audio.mp3',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Arquivo de teste online
      instrument: 'test',
      volume: 1.0,
      mute: false,
      solo: false
    },
    {
      name: 'Teste Audio Local',
      fileName: 'test-audio.mp3',
      url: '/test-audio.mp3', // Arquivo na pasta public
      instrument: 'test',
      volume: 1.0,
      mute: false,
      solo: false
    }
  ];

  // Tracks reais do servidor (comentadas para teste)
  const realTracks = [
    {
      name: 'Bateria',
      fileName: 'track_3_bateria.wav',
      url: '/uploads/multitracks/audio/007a36ad-a7e9-4d83-b487-7421f01e74b1/track_3_bateria.wav',
      instrument: 'drums',
      volume: 1.0,
      mute: false,
      solo: false
    },
    {
      name: 'Baixo',
      fileName: 'track_7_baixo.wav',
      url: '/uploads/multitracks/audio/007a36ad-a7e9-4d83-b487-7421f01e74b1/track_7_baixo.wav',
      instrument: 'bass',
      volume: 1.0,
      mute: false,
      solo: false
    }
  ];

  // Debug: verificar se os arquivos estão sendo carregados
  React.useEffect(() => {
    console.log('TestMultitrack - Tracks configuradas:', testTracks);
    
    // Testar se os arquivos estão acessíveis
    testTracks.forEach((track, index) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        console.log(`✅ Arquivo ${track.fileName} carregado com sucesso`);
      });
      audio.addEventListener('error', (e) => {
        console.error(`❌ Erro ao carregar ${track.fileName}:`, e);
      });
      audio.src = track.url;
    });
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/songs')}
          variant="outlined"
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          Teste do Player Multitrack
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Demonstração do Sistema de Carregamento
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Esta página demonstra o funcionamento do MultitrackPlayer com arquivos reais do servidor.
          O sistema inclui:
        </Typography>
        <ul>
          <li>Tela de carregamento com spinner circular (estilo Windows/Mac)</li>
          <li>Progresso individual por faixa</li>
          <li>Efeito de blur durante o carregamento</li>
          <li>Reprodução sincronizada de múltiplas faixas</li>
          <li>Controles individuais de volume e mute</li>
        </ul>
        
        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
          📝 Abra o console do navegador (F12) para ver os logs de carregamento dos arquivos.
        </Typography>
      </Paper>

      <MultitrackPlayer 
        tracks={testTracks}
        title="Exemplo de Música Multitrack"
        artist="Artista Demo"
        bpm={120}
        songKey="C Major"
      />
    </Container>
  );
};

export default TestMultitrack;