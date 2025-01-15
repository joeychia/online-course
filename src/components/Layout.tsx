import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const StyledLink = styled(RouterLink)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.primary.light,
  },
}));

export default function Layout({ children }: LayoutProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
            <Typography variant="h6" component={RouterLink} to="/" sx={{ color: 'white', textDecoration: 'none' }}>
              ECC Online Classes
            </Typography>
            <Stack direction="row" spacing={4} alignItems="center">
              <StyledLink to="/courses">Courses</StyledLink>
              {currentUser ? (
                <>
                  <StyledLink to="/progress">My Progress</StyledLink>
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