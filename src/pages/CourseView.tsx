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
  CircularProgress,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getLesson, getCourse, getUnitsForCourse, getLessonsForUnit, getUser } from '../services/dataService';
import NavPanel from '../components/NavPanel';
import LessonView from './LessonView';
import { useState, useEffect } from 'react';
import { Lesson, Course, Unit } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function CourseView() {
  const { courseId = '', unitId = '', lessonId = '' } = useParams<{ 
    courseId: string;
    unitId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Lesson[] }>({});
  const [userProgress, setUserProgress] = useState<{ [key: string]: { completed: boolean } }>({});

  // Load course and units data
  useEffect(() => {
    async function loadCourseData() {
      if (!courseId || !currentUser) return;
      
      setLoading(true);
      try {
        const [courseData, unitsData, userData] = await Promise.all([
          getCourse(courseId),
          getUnitsForCourse(courseId),
          getUser(currentUser.uid)
        ]);
        setCourse(courseData);
        setUnits(unitsData);
        setUserProgress(userData?.progress?.[courseId] || {});
      } catch (err) {
        console.error('Error loading course data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseData();
  }, [courseId, currentUser]);

  // Load lessons for expanded units
  useEffect(() => {
    async function loadUnitLessons(unitId: string) {
      if (!unitLessons[unitId]) {
        try {
          const lessons = await getLessonsForUnit(unitId);
          setUnitLessons(prev => ({ ...prev, [unitId]: lessons }));
        } catch (err) {
          console.error(`Error loading lessons for unit ${unitId}:`, err);
        }
      }
    }

    units.forEach(unit => {
      if (expandedUnits[unit.id]) {
        loadUnitLessons(unit.id);
      }
    });
  }, [units, expandedUnits]);

  // Load selected lesson
  useEffect(() => {
    async function loadLesson() {
      if (lessonId) {
        setLoading(true);
        try {
          const lesson = await getLesson(lessonId);
          setSelectedLesson(lesson);
        } catch (err) {
          console.error('Error loading lesson:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setSelectedLesson(null);
      }
    }
    loadLesson();
  }, [lessonId]);

  if (!course) {
    return <Typography>Course not found</Typography>;
  }

  // Initialize first unit as expanded if expandedUnits is empty
  if (Object.keys(expandedUnits).length === 0 && units.length > 0) {
    setExpandedUnits({ [units[0].id]: true });
  }

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    console.log('Navigating to unit:', unitId, 'lesson:', lessonId);
    navigate(`/${courseId}/${unitId}/${lessonId}`);
  };

  const handleLessonComplete = async (completedLessonId: string) => {
    if (!currentUser) return;
    
    // Update local progress state
    const updatedProgress = {
      ...userProgress,
      [completedLessonId]: { completed: true }
    };
    setUserProgress(updatedProgress);
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

  const mainContent = loading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ) : selectedLesson ? (
    <LessonView
      courseId={courseId}
      lesson={selectedLesson}
      onComplete={handleLessonComplete}
      isCompleted={userProgress[selectedLesson.id]?.completed}
    />
  ) : (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        {course.name}
      </Typography>
      <Typography variant="body1" paragraph>
        {course.description}
      </Typography>

      <List>
        {units.map((unit) => {
          const lessons = unitLessons[unit.id] || [];
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
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <NavPanel
        course={course}
        units={units}
        progress={userProgress}
        selectedUnitId={unitId}
        selectedLessonId={lessonId}
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
        {mainContent}
      </Box>
    </Box>
  );
} 