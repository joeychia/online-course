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
import { useAuth } from '../contexts/AuthContext';

interface CourseCardProps {
  course: Course;
  isAuthenticated: boolean;
  onSignInClick: () => void;
}

const CourseCard = ({ course, isAuthenticated, onSignInClick }: CourseCardProps) => {
  const navigate = useNavigate();

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
            {course.name}
          </Typography>
          <Typography color="text.secondary" paragraph>
            {course.description}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {!isAuthenticated && (
              <Chip
                icon={<LockIcon />}
                label="Sign in to access"
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

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllCourses();
        setCourses(data);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const handleSignInClick = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Available Courses
        </Typography>
        {!currentUser && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sign in to access full course content and track your progress.
            <Button
              color="primary"
              onClick={handleSignInClick}
              sx={{ ml: 2 }}
            >
              Sign In
            </Button>
          </Alert>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : courses.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No courses available
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item key={course.id} xs={12} sm={6} md={4}>
              <CourseCard 
                course={course} 
                isAuthenticated={!!currentUser}
                onSignInClick={handleSignInClick}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 