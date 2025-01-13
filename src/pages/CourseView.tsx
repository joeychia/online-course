import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { Course } from '../types';
import { getMockCourse, getMockUnitsForCourse, getMockUser } from '../data/mockDataLoader';
import NavPanel from '../components/NavPanel';

export default function CourseView() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const course = getMockCourse(courseId);
  const currentUser = getMockUser('system');
  const userProgress = currentUser?.progress[courseId] || {};

  if (!course) {
    return <Typography>Course not found</Typography>;
  }

  const units = getMockUnitsForCourse(course.id);

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    navigate(`/courses/${courseId}/units/${unitId}/lessons/${lessonId}`);
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <NavPanel
        course={course}
        units={units}
        progress={userProgress}
        onSelectLesson={handleSelectLesson}
        isOpen={isDrawerOpen}
        onToggle={toggleDrawer}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 350px)` },
          ml: { sm: `350px` }
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to {course.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {course.description}
        </Typography>
        <Typography variant="body1">
          Select a lesson from the navigation panel to begin.
        </Typography>
      </Box>
    </Box>
  );
} 