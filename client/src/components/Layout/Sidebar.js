import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
  MusicNote as MusicNoteIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  PhoneAndroid as PhoneAndroidIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Escalas',
    icon: <ScheduleIcon />,
    path: '/schedules',
  },
  {
    text: 'Repertório',
    icon: <MusicNoteIcon />,
    path: '/songs',
  },
  {
    text: 'Membros',
    icon: <PeopleIcon />,
    path: '/members',
  },
  {
    text: 'Chat',
    icon: <ChatIcon />,
    path: '/chat',
  },
  {
    text: 'Relatórios',
    icon: <AssessmentIcon />,
    path: '/reports',
    adminOnly: true,
  },
  {
    text: 'Demo Mobile',
    icon: <PhoneAndroidIcon />,
    path: '/mobile-demo',
  },
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const isAdmin = user?.ministries?.some(
    ministry => ministry.role === 'admin' || ministry.role === 'leader'
  );

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || isAdmin
  );

  const drawerContent = (
    <>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={
              {
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #4A90E2, #7B68EE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold',
              }
            }
          >
            MCJ
          </Box>
          <Typography variant="h6" noWrap>
            Worship
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider />
      
      {/* User Ministry Info */}
      {user?.ministries && user.ministries.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Ministério Atual
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {user.ministries[0].ministry?.name || 'Ministério'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.ministries[0].role === 'admin' ? 'Administrador' :
             user.ministries[0].role === 'leader' ? 'Líder' : 'Membro'}
          </Typography>
        </Box>
      )}
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;