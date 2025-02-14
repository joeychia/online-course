import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Container,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  TextField,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import { Course } from '../types';
import { getAllCourses, getUser } from '../services/dataService';
import { useAuth } from '../contexts/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { convertChinese } from '../utils/chineseConverter';
import MarkdownViewer from '../components/MarkdownViewer';
import { firestoreService } from '../services/firestoreService';

interface CourseCardProps {
  course: Course;
  isAuthenticated: boolean;
  onSignInClick: () => void;
  language: 'zh-TW' | 'zh-CN';
}

// @ts-ignore - This component will be used in the future
const CourseCard = ({ course, isAuthenticated, onSignInClick, language }: CourseCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    if (isAuthenticated) {
      navigate(`/${course.id}`);
    } else {
      onSignInClick();
    }
  };

  return (
    <Card>
      <CardActionArea onClick={handleClick}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {convertChinese(course.name, language)}
          </Typography>
          <Typography color="text.secondary" paragraph>
            {convertChinese(course.description, language)}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {!isAuthenticated && (
              <Chip
                icon={<LockIcon />}
                label={t('signInToAccess')}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default function CourseList({ myCourses = false }: { myCourses?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
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
          getAllCourses(),
          currentUser ? getUser(currentUser.uid) : null
        ]);
        if (myCourses && userProfileData) {
          // Filter courses based on user's registeredCourses
          const filteredCourses = coursesData.filter(course => 
            userProfileData.registeredCourses && userProfileData.registeredCourses[course.id]
          );
          setCourses(filteredCourses);
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

  const handleDescriptionClick = (event: React.MouseEvent, course: Course) => {
    event.stopPropagation();
    setSelectedCourse(course);
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
        const updatedProfile = await getUser(currentUser.uid);
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {!currentUser && (
        <Alert 
          severity="info" 
          action={
            <Button 
              color="inherit" 
              size="large" 
              onClick={handleSignInClick}
            >
              {t('signIn')}
            </Button>
          }
          sx={{ mb: 3, fontSize: 'var(--font-size-h6)' }}
        >
          {t('signInMessage')}
        </Alert>
      )}
      
      <Typography variant="h4" gutterBottom>
        {t('availableCourses')}
      </Typography>

      <Grid container spacing={3}>
        {courses.map((course) => {
          const isRegistered = userProfile?.registeredCourses?.[course.id];
          
          return (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      component="h2"
                      sx={{ 
                        flexGrow: 1,
                        fontSize: 'var(--font-size-h6)',
                      }}
                    >
                      {convertChinese(course.name, language)}
                    </Typography>
                  </Box>
                 
                  <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Button
                      startIcon={<DescriptionIcon />}
                      onClick={(e) => handleDescriptionClick(e, course)}
                      size="small"
                    >
                      {t('viewDescription')}
                    </Button>
                    {currentUser && (
                      <Button
                        onClick={() => isRegistered ? navigate(`/${course.id}`) : handleRegisterCourse(course)}
                        size="small"
                        variant="contained"
                      >
                        {isRegistered ? t('enterCourse') : t('registerCourse')}
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedCourse && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
              {convertChinese(selectedCourse.name, language)}
              <IconButton
                onClick={() => setSelectedCourse(null)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box>
                <MarkdownViewer
                  content={convertChinese(selectedCourse.description, language)}
                />
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>

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