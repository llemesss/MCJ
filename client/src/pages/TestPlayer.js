import React, { useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import MultitrackPlayer from '../components/MultitrackPlayer';
import SimplePlayer from '../components/SimplePlayer';

const TestPlayer = () => {
  // Tracks de teste com URLs de áudio válidas
  const testTracks = [
    {
      filename: 'sample-audio-1.mp3',
      url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3'
    },
    {
      filename: 'sample-audio-2.mp3', 
      url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'
    }
  ];

  useEffect(() => {
    console.log('TestPlayer carregado com tracks:', testTracks);
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Teste do Player Multitrack
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Esta página é para testar o funcionamento do player multitrack.
        </Typography>
        
        <SimplePlayer 
          tracks={testTracks}
        />
        
        <Box sx={{ mt: 3 }}>
          <MultitrackPlayer 
            tracks={testTracks}
            title="Teste - Multitrack"
          />
        </Box>
      </Box>
    </Container>
  );
};

export default TestPlayer;