import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
} from '@mui/material';

const Profile = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">
          Meu Perfil
        </Typography>
      </Box>

      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Página de Perfil em Desenvolvimento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Esta funcionalidade será implementada em breve.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Profile;