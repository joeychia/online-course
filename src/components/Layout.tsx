import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  IconButton,
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
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import NotesIcon from '@mui/icons-material/Notes';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useFontSize } from '../contexts/FontSizeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { getUser } from '../services/dataService';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { language, setLanguage } = useLanguage();
  const { currentUser, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (currentUser?.uid) {
          const userProfile = await getUser(currentUser.uid);
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

  // Only show menu button on course pages
  const showMenuButton = location.pathname.split('/').length > 1 && 
                        location.pathname !== '/login' &&
                        location.pathname !== '/' &&
                        location.pathname !== '/notebook' &&
                        location.pathname !== '/admin' &&
                        location.pathname !== '/help' &&
                        location.pathname !== '/courses';

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

  const handleSettingsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
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
        sx={{ 
          zIndex: theme => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            px: 2,
            height: 56,
            minHeight: 56
          }}
        >
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
              {t('appTitle')}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            {currentUser && (
              <>
                              <Button
                  component={RouterLink}
                  to="/courses?myCourses=true"
                  color="inherit"
                  startIcon={null}
                  sx={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    padding: { xs: '4px 8px', sm: '6px 16px' },
                    '&:hover': {
                      color: 'primary.light',
                    }
                  }}
                >
                  <SchoolIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <span>{t('myCourses')}</span>
                </Button>
                <Button
                  component={RouterLink}
                  to={"/notebook"}
                  color="inherit"
                  startIcon={null}
                  sx={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    padding: { xs: '4px 8px', sm: '6px 16px' },
                    '&:hover': {
                      color: 'primary.light',
                    }
                  }}
                >
                  <NotesIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <span>{t('myNotes')}</span>
                </Button>
                <Button
                  component={RouterLink}
                  to={"/help"}
                  color="inherit"
                  startIcon={null}
                  sx={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    padding: { xs: '4px 8px', sm: '6px 16px' },
                    '&:hover': {
                      color: 'primary.light',
                    }
                  }}
                >
                  <HelpOutlineIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                  <span>{t('help')}</span>
                </Button>
                {isAdmin && (
                  <Button
                    component={RouterLink}
                    to="/admin"
                    color="inherit"
                    startIcon={null}
                    sx={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      gap: { xs: 0.5, sm: 1 },
                      minWidth: { xs: 'auto', sm: 'auto' },
                      padding: { xs: '4px 8px', sm: '6px 16px' },
                      '&:hover': {
                        color: 'primary.light',
                      }
                    }}
                  >
                    <AdminPanelSettingsIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                    <span>Admin</span>
                  </Button>
                )}

              </>
            )}

            <IconButton
              color="inherit"
              onClick={handleSettingsMenu}
              aria-label="settings"
            >
              <SettingsIcon />
            </IconButton>
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
            
          </Stack>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This creates space for the fixed AppBar */}
      
      <Box component="main" sx={{ flex: 1, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}