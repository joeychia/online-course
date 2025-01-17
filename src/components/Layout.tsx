import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Only show menu button on course pages
  const showMenuButton = location.pathname.split('/').length > 1 && 
                        location.pathname !== '/login' &&
                        location.pathname !== '/courses';

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
    // Propagate drawer state to CourseView
    const event = new CustomEvent('toggleDrawer', { detail: !isDrawerOpen });
    window.dispatchEvent(event);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {showMenuButton && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" component={RouterLink} to="/" sx={{ color: 'white', textDecoration: 'none' }}>
                ECC Online Classes
              </Typography>
            </Stack>
            <Stack direction="row" spacing={4} alignItems="center">
              {currentUser ? (
                <>
                  <div>
                    <IconButton
                      onClick={handleMenu}
                      sx={{ p: 0 }}
                    >
                      <Avatar 
                        alt={userProfile?.name || currentUser?.email || ''} 
                        src={currentUser?.photoURL?.toString()}
                      />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      onClick={handleClose}
                    >
                      <MenuItem disabled>
                        {userProfile?.name || currentUser.email}
                      </MenuItem>
                      <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                    </Menu>
                  </div>
                </>
              ) : (
                <Button 
                  color="inherit" 
                  onClick={handleSignIn}
                  sx={{ 
                    '&:hover': {
                      color: 'primary.light',
                    }
                  }}
                >
                  Sign In
                </Button>
              )}
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This creates space for the fixed AppBar */}
      
      <Box component="main" sx={{ flex: 1, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
} 