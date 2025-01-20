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
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { Course } from '../types';
import { getAllCourses } from '../services/dataService';
import { useAuth } from '../contexts/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { convertChinese } from '../utils/chineseConverter';

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

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesData = await getAllCourses();
        setCourses(coursesData);
        setError(null);
      } catch (err) {
        setError(String(t('failedToLoadCourses')));
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [t]);

  const handleSignInClick = () => {
    navigate('/login');
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
              size="small" 
              onClick={handleSignInClick}
            >
              {t('signIn')}
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {t('signInMessage')}
        </Alert>
      )}
      
      <Typography variant="h4" gutterBottom>
        {t('availableCourses')}
      </Typography>

      <Grid container spacing={3}>
        {courses.map((course) => (
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
              onClick={() => navigate(`/${course.id}`)}
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
                  {!currentUser && (
                    <Chip
                      icon={<LockIcon />}
                      label={t('signInToAccess')}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: 'var(--font-size-body)',
                  }}
                >
                  {convertChinese(course.description, language)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
} 