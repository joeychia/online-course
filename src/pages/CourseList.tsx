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
  CircularProgress
} from '@mui/material';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course.id}`);
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
          <Stack direction="row" spacing={1}>
            {course.isPublic && (
              <Chip 
                label="Public" 
                color="primary" 
                size="small" 
                variant="outlined" 
              />
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

interface CourseListProps {
  courses?: { [key: string]: Course };
}

export default function CourseList({ courses = {} }: CourseListProps) {
  const courseArray = Object.values(courses);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Available Courses
      </Typography>
      {courseArray.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {courseArray.map((course) => (
            <Grid item key={course.id} xs={12} sm={6} md={4}>
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
} 