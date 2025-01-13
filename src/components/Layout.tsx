import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Link,
  Grid,
  Stack,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';

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

const Footer = styled('footer')(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.grey[400],
  padding: theme.spacing(8, 0),
  marginTop: 'auto',
}));

const TOOLBAR_HEIGHT = 64; // Standard MUI toolbar height

export default function Layout({ children }: LayoutProps) {
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
              Online Course
            </Typography>
            <Stack direction="row" spacing={4}>
              <StyledLink to="/">Courses</StyledLink>
              <StyledLink to="/progress">My Progress</StyledLink>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* This creates space for the fixed AppBar */}
      
      <Box component="main" sx={{ flex: 1, width: '100%' }}>
        {children}
      </Box>

      <Footer>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="white" gutterBottom>
                About Us
              </Typography>
              <Typography variant="body2">
                Dedicated to providing high-quality online learning experiences.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="white" gutterBottom>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Link component={RouterLink} to="/about" color="inherit" sx={{ '&:hover': { color: 'white' } }}>
                  About
                </Link>
                <Link component={RouterLink} to="/contact" color="inherit" sx={{ '&:hover': { color: 'white' } }}>
                  Contact
                </Link>
                <Link component={RouterLink} to="/faq" color="inherit" sx={{ '&:hover': { color: 'white' } }}>
                  FAQ
                </Link>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="white" gutterBottom>
                Connect
              </Typography>
              <Stack direction="row" spacing={2}>
                <Link href="#" color="inherit" sx={{ '&:hover': { color: 'white' } }}>
                  Twitter
                </Link>
                <Link href="#" color="inherit" sx={{ '&:hover': { color: 'white' } }}>
                  LinkedIn
                </Link>
                <Link href="#" color="inherit" sx={{ '&:hover': { color: 'white' } }}>
                  GitHub
                </Link>
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ mt: 8, pt: 3, borderTop: 1, borderColor: 'grey.800', textAlign: 'center' }}>
            <Typography variant="body2">
              © 2024 Online Course. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Footer>
    </Box>
  );
} 