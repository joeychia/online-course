import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Container,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Course } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { firestoreService } from '../services/firestoreService';
import CourseCard from '../components/CourseCard';
import AnnouncementsList from '../components/AnnouncementsList';

export default function CourseList({ myCourses = false }: { myCourses?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);
  const [courseToRegister, setCourseToRegister] = useState<Course | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, userProfileData] = await Promise.all([
          firestoreService.getAllCourses(),
          currentUser ? firestoreService.getUserById(currentUser.uid) : null
        ]);
        if (myCourses) {
          if (userProfileData) {
            // Filter courses based on user's registeredCourses
            const filteredCourses = coursesData.filter(course => 
              userProfileData.registeredCourses && userProfileData.registeredCourses[course.id]
            );
            setCourses(filteredCourses);
          } else {
            setCourses([]);
          }
        } else {
          setCourses(coursesData);
        }
        setUserProfile(userProfileData);
        setError(null);
      } catch (err) {
        setError(String(t('failedToLoadCourses')));
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [myCourses, currentUser]);

  const handleSignInClick = () => {
    navigate('/login');
  };

  const handleRegisterCourse = async (course: Course) => {
    try {
      if (!currentUser) return;

      if (course.settings?.token) {
        setCourseToRegister(course);
        setTokenDialogOpen(true);
        return;
      }
      
      // Update user's registered courses in Firestore
      const updatedProfile = {
        ...userProfile,
        registeredCourses: {
          ...(userProfile?.registeredCourses || {}),
          [course.id]: true
        }
      };
      
      await firestoreService.registerCourse(currentUser.uid, course.id);
      setUserProfile(updatedProfile);
      navigate(`/${course.id}`);
    } catch (err) {
      console.error('Error registering for course:', err);
    }
  };

  const handleTokenSubmit = async () => {
    if (!courseToRegister || !currentUser) return;

    if (courseToRegister.settings?.token === tokenInput) {
      // Token is correct, proceed with registration
      try {
        await firestoreService.registerCourse(currentUser.uid, courseToRegister.id);
        const updatedProfile = await firestoreService.getUserById(currentUser.uid);
        setUserProfile(updatedProfile);
        setTokenDialogOpen(false);
        setTokenInput('');
        setTokenError(false);
        setCourseToRegister(null);
        navigate(`/${courseToRegister.id}`);
      } catch (err) {
        console.error('Error registering for course:', err);
      }
    } else {
      setTokenError(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (courses.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('noCourses')}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {!currentUser && (
        <Alert 
          severity="info"
          variant="filled"
          sx={{
            display: 'flex',
            alignItems: 'center',
            my: 4,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiAlert-icon': {
              color: 'inherit'
            },
            '& .MuiAlert-message': {
              fontSize: '1.4rem', // Increased font size
              textAlign: 'left',
              flex: 1
            }
          }}
          action={
            <Button 
              color="inherit" 
              size="large" 
              onClick={handleSignInClick}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                },
                fontSize: '1.2rem' // Increased button text size
              }}
            >
              {t('signIn')}
            </Button>
          }
        >
          {t('signInMessage')}
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <AnnouncementsList />
      </Box>
      <Typography variant="h4" gutterBottom>
        {myCourses? t('myCourses') : t('availableCourses')}
      </Typography>

      <Grid container spacing={3}>
        {courses.map((course) => {
          const isRegistered = userProfile?.registeredCourses?.[course.id];
          const canAccess = isRegistered || course.isPublic;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <CourseCard
                course={course}
                onPrimaryAction={() => canAccess ? navigate(`/${course.id}`) : handleRegisterCourse(course)}
                primaryActionText={canAccess ? t('enterCourse') : t('registerCourse')}
                language={language}
                showDescriptionButton={true}
              />
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={tokenDialogOpen}
        onClose={() => {
          setTokenDialogOpen(false);
          setTokenInput('');
          setTokenError(false);
          setCourseToRegister(null);
        }}
      >
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              label={t('courseToken')}
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setTokenError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tokenInput) {
                  handleTokenSubmit();
                }
              }}
              error={tokenError}
              helperText={tokenError ? t('invalidToken') : ''}
              type="text"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTokenDialogOpen(false);
            setTokenInput('');
            setTokenError(false);
            setCourseToRegister(null);
          }}>
            {t('cancel')}
          </Button>
          <Button onClick={handleTokenSubmit} variant="contained" disabled={!tokenInput}>
            {t('submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
