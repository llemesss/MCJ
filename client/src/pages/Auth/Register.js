import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  Piano,
  Mic,
  MusicNote,
  GraphicEq,
  Lightbulb,
  Videocam,
  LibraryMusic,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const { register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const instruments = [
    { value: 'vocal', label: 'Vocal', icon: <Mic /> },
    { value: 'teclado', label: 'Teclado', icon: <Piano /> },
    { value: 'guitarra', label: 'Guitarra', icon: <MusicNote /> },
    { value: 'baixo', label: 'Contra-baixo', icon: <LibraryMusic /> },
    { value: 'bateria', label: 'Bateria', icon: <GraphicEq /> },
    { value: 'violao', label: 'Violão', icon: <MusicNote /> },
    { value: 'mesa_som', label: 'Mesa de Som', icon: <GraphicEq /> },
    { value: 'iluminacao', label: 'Iluminação', icon: <Lightbulb /> },
    { value: 'midia', label: 'Mídia', icon: <Videocam /> },
    { value: 'outros', label: 'Outros', icon: <MusicNote /> },
  ];
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    clearError();
    const { confirmPassword, ...userData } = data;
    userData.instruments = selectedInstruments;
    const result = await registerUser(userData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleInstrumentChange = (event) => {
    const value = event.target.value;
    setSelectedInstruments(typeof value === 'string' ? value.split(',') : value);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <LoadingSpinner message="Criando conta..." />
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4A90E2, #7B68EE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            MCJ
          </Box>
          
          <Typography component="h1" variant="h4" gutterBottom>
            Criar Conta
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Junte-se ao MCJ Worship e gerencie seu ministério
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Nome Completo"
                  autoComplete="name"
                  autoFocus
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('name', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres',
                    },
                  })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="instruments-label">Instrumentos/Funções</InputLabel>
                  <Select
                    labelId="instruments-label"
                    id="instruments"
                    multiple
                    value={selectedInstruments}
                    onChange={handleInstrumentChange}
                    input={<OutlinedInput label="Instrumentos/Funções" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const instrument = instruments.find(inst => inst.value === value);
                          return (
                            <Chip
                              key={value}
                              label={instrument?.label || value}
                              size="small"
                              icon={instrument?.icon}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {instruments.map((instrument) => (
                      <MenuItem key={instrument.value} value={instrument.value}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {instrument.icon}
                        </ListItemIcon>
                        <ListItemText primary={instrument.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Telefone"
                  autoComplete="tel"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('phone', {
                    pattern: {
                      value: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
                      message: 'Telefone inválido',
                    },
                  })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido',
                    },
                  })}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres',
                    },
                  })}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Confirmar Senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleClickShowConfirmPassword}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  {...register('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: value =>
                      value === password || 'Senhas não coincidem',
                  })}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                position: 'relative',
                overflow: 'hidden',
                background: loading 
                  ? 'linear-gradient(45deg, #e0e0e0, #f5f5f5)'
                  : 'linear-gradient(45deg, #2e7d32, #4caf50)',
                transition: 'all 0.3s ease-in-out',
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                boxShadow: loading 
                  ? '0 2px 8px rgba(0,0,0,0.1)'
                  : '0 4px 20px rgba(46, 125, 50, 0.3)',
                '&:hover': {
                  background: loading 
                    ? 'linear-gradient(45deg, #e0e0e0, #f5f5f5)'
                    : 'linear-gradient(45deg, #1b5e20, #2e7d32)',
                  transform: loading ? 'scale(0.98)' : 'scale(1.02)',
                  boxShadow: loading 
                    ? '0 2px 8px rgba(0,0,0,0.1)'
                    : '0 6px 25px rgba(46, 125, 50, 0.4)'
                },
                '&:active': {
                  transform: 'scale(0.98)'
                },
                '&::before': loading ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 1.5s infinite'
                } : {}
              }}
              disabled={loading}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 1
              }}>
                {loading && (
                  <Box
                    sx={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid',
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'rotate 1s linear infinite'
                    }}
                  />
                )}
                {loading ? 'Criando Conta...' : 'Criar Conta'}
              </Box>
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Já tem uma conta? Faça login
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;