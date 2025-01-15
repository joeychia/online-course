import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  LinearProgress,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getMockCourse, getMockUnitsForCourse, getMockLessonsForUnit, getMockUser } from '../data/mockDataLoader';
import NavPanel from '../components/NavPanel';
import { useState } from 'react';

export default function CourseView() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>({});
  
  const course = getMockCourse(courseId);
  const currentUser = getMockUser('system');
  const userProgress = currentUser?.progress[courseId] || {};

  if (!course) {
    return <Typography>Course not found</Typography>;
  }

  const units = getMockUnitsForCourse(course.id);

  // Initialize first unit as expanded if expandedUnits is empty
  if (Object.keys(expandedUnits).length === 0 && units.length > 0) {
    setExpandedUnits({ [units[0].id]: true });
  }

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    console.log('Navigating to unit:', unitId, 'lesson:', lessonId);
    navigate(`/${courseId}/${unitId}/${lessonId}`);
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev: { [key: string]: boolean }) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const isLessonAccessible = (orderIndex: number) => {
    if (course.settings?.unlockLessonIndex !== undefined) {
      return orderIndex === course.settings.unlockLessonIndex;
    }
    return orderIndex === 1;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <NavPanel
        course={course}
        units={units}
        progress={userProgress}
        onSelectLesson={handleSelectLesson}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 350px)` },
          maxWidth: 'lg'
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          {course.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {course.description}
        </Typography>

        <List>
          {units.map((unit) => {
            const lessons = getMockLessonsForUnit(unit.id);
            const completedCount = lessons.filter(l => userProgress[l.id]?.completed).length;
            const progressPercentage = (completedCount / lessons.length) * 100;

            return (
              <Card key={unit.id} sx={{ mb: 2 }}>
                <ListItemButton onClick={() => toggleUnit(unit.id)}>
                  <ListItemText
                    primary={unit.name}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress variant="determinate" value={progressPercentage} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {completedCount} of {lessons.length} completed
                        </Typography>
                      </Box>
                    }
                  />
                  {expandedUnits[unit.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={expandedUnits[unit.id]} timeout="auto">
                  <CardContent>
                    <List component="div" disablePadding>
                      {lessons.map((lesson) => {
                        const isAccessible = isLessonAccessible(lesson.orderIndex);
                        const isCompleted = userProgress[lesson.id]?.completed;

                        return (
                          <ListItemButton
                            key={lesson.id}
                            onClick={() => isAccessible && handleSelectLesson(unit.id, lesson.id)}
                            disabled={!isAccessible}
                            sx={{ pl: 4 }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                              <Typography sx={{ flex: 1 }}>
                                {lesson.orderIndex}. {lesson.name}
                              </Typography>
                              {!isAccessible ? (
                                <LockIcon color="disabled" fontSize="small" />
                              ) : isCompleted ? (
                                <CheckCircleIcon color="success" fontSize="small" />
                              ) : null}
                            </Stack>
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </CardContent>
                </Collapse>
              </Card>
            );
          })}
        </List>
      </Box>
    </Box>
  );
} 