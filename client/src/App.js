import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Schedules from './pages/Schedules/Schedules';
import ScheduleDetail from './pages/Schedules/ScheduleDetail';
import CreateSchedule from './pages/Schedules/CreateSchedule';
import Songs from './pages/Songs/Songs';
import SongDetail from './pages/Songs/SongDetail';
import CreateSong from './pages/Songs/CreateSong';
import EditSong from './pages/Songs/EditSong';
import Player from './pages/Player/Player';
import Members from './pages/Members/Members';
import Chat from './pages/Chat/Chat';
import Reports from './pages/Reports/Reports';
import Profile from './pages/Profile/Profile';
import Ministry from './pages/Ministry/Ministry';
import TestPlayer from './pages/TestPlayer';
import TestMultitrack from './pages/Songs/TestMultitrack';
import MobileFeatureDemo from './components/Common/MobileFeatureDemo';

function ScheduleEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/schedules?edit=${id}`} replace />;
}

// Tema movido para ThemeContext

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  console.log('ProtectedRoute - loading:', loading, 'user:', user);
  console.log('ProtectedRoute - localStorage token:', localStorage.getItem('token'));
  
  if (loading) {
    console.log('ProtectedRoute - Mostrando loading spinner');
    return <LoadingSpinner />;
  }
  
  // Temporariamente, vamos verificar se há token no localStorage
  const hasToken = localStorage.getItem('token');
  if (!user && !hasToken) {
    console.log('ProtectedRoute - Usuário não encontrado e sem token, redirecionando para login');
    return <Navigate to="/login" replace />;
  }
  
  if (!user && hasToken) {
    console.log('ProtectedRoute - Token encontrado mas usuário não carregado ainda, aguardando...');
    return <LoadingSpinner />;
  }
  
  console.log('ProtectedRoute - Usuário autenticado, renderizando children');
  return children;
}

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
      />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Navigate to="/dashboard" replace />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/schedules" element={
        <ProtectedRoute>
          <AppLayout>
            <Schedules />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/schedules/new" element={
        <ProtectedRoute>
          <AppLayout>
            <CreateSchedule />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/schedules/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <ScheduleEditRedirect />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/schedules/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <ScheduleDetail />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/songs" element={
        <ProtectedRoute>
          <AppLayout>
            <Songs />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/songs/new" element={
        <ProtectedRoute>
          <AppLayout>
            <CreateSong />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/songs/test-multitrack" element={
        <ProtectedRoute>
          <AppLayout>
            <TestMultitrack />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/test-player" element={
        <ProtectedRoute>
          <AppLayout>
            <TestPlayer />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/songs/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <SongDetail />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/songs/:id/edit" element={
        <ProtectedRoute>
          <AppLayout>
            <EditSong />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/player/:id" element={
        <ProtectedRoute>
          <Player />
        </ProtectedRoute>
      } />
      
      <Route path="/members" element={
        <ProtectedRoute>
          <AppLayout>
            <Members />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/chat" element={
        <ProtectedRoute>
          <AppLayout>
            <Chat />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <AppLayout>
            <Reports />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout>
            <Profile />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/ministry" element={
        <ProtectedRoute>
          <AppLayout>
            <Ministry />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/mobile-demo" element={
        <ProtectedRoute>
          <AppLayout>
            <MobileFeatureDemo />
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SnackbarProvider 
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <Router>
            <AuthProvider>
              <SocketProvider>
                <AppRoutes />
              </SocketProvider>
            </AuthProvider>
          </Router>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;