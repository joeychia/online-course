import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  CardActionArea,
  Chip,
  Box
} from '@mui/material';
import { Course } from '../types';
import Layout from '../components/Layout';
import { mockCourses } from '../mockData';

export default function CourseList() {
  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Available Courses
      </Typography>

      <Grid container spacing={3}>
        {mockCourses.map((course: Course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card>
              <CardActionArea component={Link} to={`/course/${course.id}`}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6">{course.name}</Typography>
                    <Chip 
                      label="Preview Available" 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Typography color="textSecondary" sx={{ mt: 1 }}>
                    {course.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
} 