import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  Menu,
  Avatar,
  Button,
  Switch,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useFontSize } from '../contexts/FontSizeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { firestoreService } from '../services/firestoreService';
import MenuBookIcon from '@mui/icons-material/MenuBook';

interface LayoutProps {
  children: React.ReactNode;
}

const menuButtonStyles = {
  textDecoration: 'none',
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  alignItems: 'center',
  gap: { xs: 0.5, sm: 1.5 },
  minWidth: { xs: 'auto', sm: 'auto' },
  padding: { xs: '4px 8px', sm: '8px 16px' },
  fontSize: { xs: 'inherit', sm: '1.1rem' },
  fontWeight: 300,

  whiteSpace: 'nowrap'
};

export default function Layout({ children }: LayoutProps) {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { language, setLanguage } = useLanguage();
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (currentUser?.uid) {
          const userProfile = await firestoreService.getUserById(currentUser.uid);
          setIsAdmin(!!userProfile?.roles?.admin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
    console.log('isAdmin:', isAdmin);
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const handleSettingsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleFontSizeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSize: string | null,
  ) => {
    if (newSize !== null) {
      setFontSize(newSize as 'small' | 'medium' | 'large');
    }
  };

  const handleThemeChange = () => {
    toggleTheme();
  };
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      fontSize: 'var(--font-size-body)',
      '& h1': { fontSize: 'var(--font-size-h1)' },
      '& h2': { fontSize: 'var(--font-size-h2)' },
      '& h3': { fontSize: 'var(--font-size-h3)' },
      '& h4': { fontSize: 'var(--font-size-h4)' },
      '& h5': { fontSize: 'var(--font-size-h5)' },
      '& h6': { fontSize: 'var(--font-size-h6)' },
    }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar 
          sx={{ 
            display: 'flex', 
            justifyContent: 'flex-start', 
            px: { xs: 1, sm: 2 },
            height: 62,
            minHeight: 52,
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>           
            <Button
              color="inherit"
              onClick={handleMenuClick}
              sx={{
                ...menuButtonStyles,
                minWidth: 'auto',
                p: 1
              }}
            >
              <Box 
                component="img"
                src="/icons/web-app-manifest-192x192.png"
                alt="App Logo"
                sx={{
                  height: 40,
                  width: 40,
                  objectFit: 'contain'
                }}
              />
            </Button>
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              sx={{
                ...menuButtonStyles,
                fontSize: { xs: '1.2rem', sm: '1.4rem' },
                fontWeight: 500,
                ml: 1
              }}
            >
              {t('appTitle')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end' }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Button
                component={RouterLink}
                to="/mycourses"
                color="inherit"
                startIcon={null}
                sx={menuButtonStyles}
              >
                <SchoolIcon sx={{ fontSize: '1.75rem', color: 'primary.main' }} />
                <span>{t('myCourses')}</span>
              </Button>
              <Button
                component={RouterLink}
                to={"/notebook"}
                color="inherit"
                startIcon={null}
                sx={menuButtonStyles}
              >
                <MenuBookIcon sx={{ fontSize: '1.75rem', color: 'primary.main' }} />
                <span>{t('myNotes')}</span>
              </Button>
            </Box>
            <Button
              color="inherit"
              onClick={handleSettingsMenu}
              aria-label="settings"
              sx={menuButtonStyles}
            >
              <SettingsIcon sx={{ fontSize: '1.75rem', color: 'primary.main' }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>{t('settings')}</Box>
            </Button>
          </Box>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
          >
            <Box sx={{ minWidth: 200 }}>
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1 }}
              >
                <HomeIcon sx={{ mr: 1, fontSize: '1.75rem' }} />
                <span>{t('homepage')}</span>
              </Button>
              <Box sx={{ display: { sm: 'none' } }}>
                <Button
                  component={RouterLink}
                  to="/mycourses"
                  color="inherit"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                >
                  <SchoolIcon sx={{ mr: 1, fontSize: '1.75rem' }} />
                  <span>{t('myCourses')}</span>
                </Button>
                <Button
                  component={RouterLink}
                  to="/notebook"
                  color="inherit"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                >
                  <MenuBookIcon sx={{ mr: 1, fontSize: '1.75rem' }} />
                  <span>{t('myNotes')}</span>
                </Button>
              </Box>
              <Button
                component={RouterLink}
                to="/help"
                color="inherit"
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1 }}
              >
                <HelpOutlineIcon sx={{ mr: 1, fontSize: '1.75rem' }} />
                <span>{t('help')}</span>
              </Button>
              {isAdmin && (
                <Button
                  component={RouterLink}
                  to="/admin"
                  color="inherit"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1 }}
                >
                  <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: '1.75rem' }} />
                  <span>{t('admin')}</span>
                </Button>
              )}
            </Box>
          </Menu>


            <Menu
              anchorEl={settingsAnchorEl}
              open={Boolean(settingsAnchorEl)}
              onClose={handleSettingsClose}
              onClick={handleSettingsClose}
            >
              <Box sx={{ p: 2, minWidth: 200 }}>                
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('fontSize')}</Typography>
                <ToggleButtonGroup
                  value={fontSize}
                  exclusive
                  onChange={handleFontSizeChange}
                  aria-label="font size"
                  size="small"
                  sx={{ mb: 2, display: 'flex' }}
                >
                  <ToggleButton value="small" aria-label="small font">
                    <Typography sx={{ fontSize: '0.875rem' }}>{t('small')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="medium" aria-label="medium font">
                    <Typography sx={{ fontSize: '1rem' }}>{t('medium')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="large" aria-label="large font">
                    <Typography sx={{ fontSize: '1.125rem' }}>{t('large')}</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDarkMode}
                      onChange={handleThemeChange}
                    />
                  }
                  label={t('darkMode')}
                />
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('language')}</Typography>
                <ToggleButtonGroup
                  value={language}
                  exclusive
                  onChange={(_, newLang) => newLang && setLanguage(newLang)}
                  aria-label="language"
                  size="small"
                  sx={{ display: 'flex' }}
                >
                  <ToggleButton value="zh-TW" aria-label="traditional chinese">
                    <Typography>{t('traditional')}</Typography>
                  </ToggleButton>
                  <ToggleButton value="zh-CN" aria-label="simplified chinese">
                    <Typography>{t('simplified')}</Typography>
                  </ToggleButton>
                </ToggleButtonGroup>
                {currentUser && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar 
                        alt={userProfile?.name || currentUser?.email || ''}
                        src={currentUser?.photoURL?.toString()}
                        sx={{ width: 32, height: 32 }}
                      >
                        {(userProfile?.name || currentUser?.email || '').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" color="text.primary">
                          {userProfile?.name || currentUser.email?.split('@')[0]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {currentUser.email}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      fullWidth
                      onClick={handleSignOut}
                      color="primary"
                      variant="outlined"
                      size="small"
                    >
                      {t('signOut')}
                    </Button>
                  </>
                )}
              </Box>
            </Menu>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This creates space for the fixed AppBar */}
      
      <Box component="main" sx={{ flex: 1, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
